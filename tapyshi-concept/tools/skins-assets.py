#!/usr/bin/env python3
"""Пересборка ассетов вкладки «Скины» магазина из папки рендеров.
   python3 tools/skins-assets.py [путь_к_pet-skins]   (по умолчанию /workspace/pet-skins)
Берёт renders/<common|epic|legendary>/*.png и skins.json, пишет shop/skins/assets/*.webp (640 px)
и shop/skins/manifest.js (тексты, какие питомцы/стадии есть, версия картинок для кэша).
Новые рендеры (например, дракон для «Мороза») подхватываются автоматически. Старые webp не удаляются."""
import sys, json, re, hashlib, pathlib
from PIL import Image
SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/workspace/pet-skins')
FC = pathlib.Path(__file__).resolve().parent.parent
OUT = FC / 'shop/skins/assets'; OUT.mkdir(parents=True, exist_ok=True)
data = json.loads((SRC / 'skins.json').read_text())
h = hashlib.sha1((SRC / 'skins.json').read_bytes())
man = {'sets': {}, 'slots': {k: v['ru'] for k, v in data['slots'].items()}}

for sid, s in data['sets'].items():
    pets, back, parts = {}, None, {}
    for f in sorted((SRC / 'renders' / sid).glob('*.png')):
        raw = f.read_bytes(); h.update(raw)
        Image.open(f).convert('RGB').resize((640, 640), Image.LANCZOS).save(OUT / (f.stem + '.webp'), quality=88)
        m = re.match(sid + r'_(raccoon|capybara|dragon|goose)_s(\d)_(tq|back)$', f.stem)
        if m:
            pet, st, view = m.group(1), int(m.group(2)), m.group(3)
            if view == 'back': back = f.stem if pet == 'raccoon' else back
            elif pet not in pets or st < pets[pet][0]: pets[pet] = [st, f.stem]   # младшая стадия
            continue
        m = re.match(sid + r'_part_(\w+)$', f.stem)
        if m: parts[m.group(1)] = f.stem
    man['sets'][sid] = {'r': s['rarity_ru'], 'name': s['name_ru'], 'pets': pets, 'back': back,
        'parts': [{'id': p['id'], 'slot': p['slot'], 'name': p['name_ru'], 'desc': p['desc_ru'], 'img': parts.get(p['id'])} for p in s['items']]}
    miss = [p for p in ('raccoon', 'capybara', 'dragon', 'goose') if p not in pets]
    print(f"{sid}: питомцы {sorted(pets)}; нет рендера: {miss or '—'}; частей {len(parts)}/4")
man['v'] = h.hexdigest()[:8]
(FC / 'shop/skins/manifest.js').write_text('/* Сгенерировано tools/skins-assets.py — не править руками. */\nwindow.SK_MANIFEST=' + json.dumps(man, ensure_ascii=False) + ';\n')
print('manifest v=' + man['v'], '→', OUT)
