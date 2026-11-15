#!/usr/bin/env python3
"""Пересборка ассетов вкладки «Скины» магазина (v2: прозрачный фон + единое кадрирование).
   python3 tools/skins-assets.py [путь_к_pet-skins]   (по умолчанию /workspace/pet-skins)

Источник — raw/*.png (RGBA, прозрачный фон, тот же ракурс камеры «tq») + raw/*_emit_0001.png (свечение).
Каждый рендер: bbox по непрозрачным пикселям (alpha>=128, тень пола не считается) → масштаб и центр
по ОДНОМУ правилу для всех питомцев и наборов:
  * сцена (питомец в наборе / с частями / без скина / сзади) — 800×640, высота фигуры ≤ 78%, ширина ≤ 90%;
  * плитка части (крупный план предмета) — 400×400, фигура ≤ 84% по большей стороне.
Пишет shop/skins/assets/*.webp и shop/skins/manifest.js. Ничего не удаляет; старые webp остаются.

Имена, которые понимает скрипт (raw/):
  <set>_<pet>_s<N>_tq / _back          — питомец в полном наборе (берётся s1, иначе младшая стадия)
  <set>_<pet>_s1_part_<id>              — питомец только в одной части (примерка 1 части)
  <set>_<pet>_s1_parts_<id>__<id>[...]  — питомец в комбинации частей (примерка 2–3 частей; порядок id = порядок в skins.json)
  base_<pet>_s1_tq                      — питомец без скина
  <set>_part_<id>                       — крупный план части (плитка, если нет рендера части на питомце)
Плитки частей делаются из <set>_<pet>_s1_part_<id> (суффикс _sq), чтобы ракурс совпадал со сценой."""
import sys, json, re, hashlib, pathlib
import numpy as np
from PIL import Image, ImageFilter
SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/workspace/pet-skins')
RAW = SRC / 'raw'
FC = pathlib.Path(__file__).resolve().parent.parent
OUT = FC / 'shop/skins/assets'; OUT.mkdir(parents=True, exist_ok=True)
PETS = ('raccoon', 'capybara', 'dragon', 'goose')
data = json.loads((SRC / 'skins.json').read_text())
h = hashlib.sha1((SRC / 'skins.json').read_bytes())
done = {}

def glow(im, stem):
    ef = sorted(RAW.glob(stem + '_emit_*.png'))
    if not ef: return im
    w, hh = im.size; E = Image.open(ef[0]).convert('RGB').resize((w, hh))
    g = np.clip(np.array(E.filter(ImageFilter.GaussianBlur(w * .007)), float) / 255 * .8 +
                np.array(E.filter(ImageFilter.GaussianBlur(w * .022)), float) / 255 * .9, 0, 1)
    ga = np.clip(g.max(-1) * .85, 0, 1)
    lay = np.zeros((hh, w, 4)); lay[..., :3] = np.where(ga[..., None] > 0, g / np.maximum(ga[..., None], 1e-3), 0).clip(0, 1); lay[..., 3] = ga
    base = Image.fromarray((lay * 255).astype(np.uint8), 'RGBA'); base.alpha_composite(im)
    o = np.array(base).astype(float) / 255; o[..., :3] = 1 - (1 - o[..., :3]) * (1 - g * .45)
    return Image.fromarray((o * 255).astype(np.uint8), 'RGBA')

def fit(stem, kind, sfx=''):
    key = stem + sfx
    if key in done: return key
    f = RAW / (stem + '.png'); raw = f.read_bytes(); h.update(raw); h.update(kind.encode())
    o = OUT / (key + '.webp'); srcs = [f] + sorted(RAW.glob(stem + '_emit_*.png'))
    if o.exists() and o.stat().st_mtime > max(x.stat().st_mtime for x in srcs) and o.stat().st_mtime > pathlib.Path(__file__).stat().st_mtime:
        done[key] = 1; return key   # уже собран из этого же рендера
    im = Image.open(f).convert('RGBA'); a = np.array(im)[..., 3]
    ys, xs = np.nonzero(a >= 128); x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    arr = np.array(im)
    # тень пола: оставляем только мягкую контактную тень у фигуры, края «плиты» пола убираем
    near = np.array(Image.fromarray(((a >= 200) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(im.width * .03)), float) / 255
    arr[..., 3] = np.where(a >= 200, a, (a * np.clip(near * 2.2, 0, 1)).astype(np.uint8)); arr[..., 3][arr[..., 3] < 10] = 0; im = glow(Image.fromarray(arr, 'RGBA'), stem)
    W, H, fh, fw, cy = (800, 640, .78, .90, .53) if kind == 'scene' else (400, 400, .84, .84, .5)
    bw, bh = x1 - x0, y1 - y0; k = min(fh * H / bh, fw * W / bw)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    cx_, cy_ = (x0 + x1) / 2 * k, (y0 + y1) / 2 * k
    can = Image.new('RGBA', (W, H)); can.paste(im, (round(W / 2 - cx_), round(H * cy - cy_)), im)
    can.save(o, quality=86, method=6); done[key] = 1; return key

man = {'sets': {}, 'slots': {k: v['ru'] for k, v in data['slots'].items()}, 'base': {}}
for pet in PETS:
    if (RAW / f'base_{pet}_s1_tq.png').exists(): man['base'][pet] = fit(f'base_{pet}_s1_tq', 'scene')
for sid, s in data['sets'].items():
    ids = [p['id'] for p in s['items']]; pets = {}
    for pet in PETS:
        tq = sorted(RAW.glob(f'{sid}_{pet}_s*_tq.png'), key=lambda p: int(re.search(r'_s(\d)_', p.name).group(1)))
        if not tq: continue
        st = int(re.search(r'_s(\d)_', tq[0].name).group(1)); e = {'st': st, 'tq': fit(tq[0].stem, 'scene'), 'combo': {}}
        if (RAW / f'{sid}_{pet}_s{st}_back.png').exists(): e['back'] = fit(f'{sid}_{pet}_s{st}_back', 'scene')
        for i in ids:
            if (RAW / f'{sid}_{pet}_s{st}_part_{i}.png').exists():
                e['combo'][i] = fit(f'{sid}_{pet}_s{st}_part_{i}', 'scene')
                e.setdefault('tile', {})[i] = fit(f'{sid}_{pet}_s{st}_part_{i}', 'tile', '_sq')   # плитка: тот же ракурс, квадрат
        for f in RAW.glob(f'{sid}_{pet}_s{st}_parts_*.png'):
            if '_emit_' in f.name: continue
            key = '__'.join(sorted(f.stem.split('_parts_', 1)[1].split('__'), key=ids.index)); e['combo'][key] = fit(f.stem, 'scene')
        pets[pet] = e
    parts = [{'id': p['id'], 'slot': p['slot'], 'name': p['name_ru'], 'desc': p['desc_ru'],
              'img': fit(f'{sid}_part_{p["id"]}', 'tile') if (RAW / f'{sid}_part_{p["id"]}.png').exists() else None} for p in s['items']]
    man['sets'][sid] = {'r': s['rarity_ru'], 'name': s['name_ru'], 'pets': pets, 'parts': parts}
    miss = [p for p in PETS if p not in pets]
    print(f"{sid}: в наборе {', '.join(f'{p} s{pets[p][chr(115)+chr(116)]}' for p in pets)}; нет: {miss or '—'}; "
          f"сзади: {[p for p in pets if 'back' in pets[p]]}; примерка (готовых комбинаций из 14): "
          + ', '.join(f'{p} {len(pets[p]["combo"])}' for p in pets))
man['v'] = h.hexdigest()[:8]
(FC / 'shop/skins/manifest.js').write_text('/* Сгенерировано tools/skins-assets.py — не править руками. */\nwindow.SK_MANIFEST=' + json.dumps(man, ensure_ascii=False) + ';\n')
print('файлов', len(done), '· manifest v=' + man['v'], '→', OUT)
