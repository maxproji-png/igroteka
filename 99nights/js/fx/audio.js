/**
 * 99 ночей — аудио-модуль (концепт на согласование, не продакшен).
 * Все звуки — процедурный синтез на Web Audio, 0 КБ файлов, без сторонних сэмплов.
 *
 *   import { GameAudio } from './fx/audio.js';
 *   const audio = new GameAudio();
 *   await audio.init();            // только из жеста (тап / клик)
 *   audio.play('step', { surface: 'grass' });
 *   audio.setNight(true);
 *   audio.setMasterVolume(0.3);
 *   audio.update(dt);
 *   audio.dispose();
 */
export const VERSION = '0.5-concept';

const VOICES = { low: 8, high: 14 };
const GROUP_LIMIT = {
  step: 2, chop: 2, collect: 2, fire: 2, night: 1, moose: 2, ping: 1,
  crow: 2, mist: 2, moth: 2, rain: 2, wind: 1, chat: 1, ui: 2,
  chest: 2, craft: 1, lamp: 1, push: 2, eat: 1, pet: 2, jingle: 1
};

/** Погода ночей 1–12 (GDD v0.5, раздел 4). Ночь 8 — «лёгкий дождь» (одна из 7–9). */
export const NIGHT_WEATHER = {
  1:  { rain: false, wind: false, fog: 'off',  moths: false },
  2:  { rain: false, wind: false, fog: 'off',  moths: false },
  3:  { rain: false, wind: false, fog: 'off',  moths: false },
  4:  { rain: false, wind: false, fog: 'off',  moths: false },
  5:  { rain: false, wind: false, fog: 'off',  moths: false },
  6:  { rain: false, wind: false, fog: 'off',  moths: false },
  7:  { rain: false, wind: false, fog: 'off',  moths: false },
  8:  { rain: true,  wind: false, fog: 'off',  moths: false },
  9:  { rain: false, wind: false, fog: 'off',  moths: false },
  10: { rain: false, wind: false, fog: 'dense', moths: false },
  11: { rain: false, wind: true,  fog: 'soft', moths: true  },
  12: { rain: false, wind: true,  fog: 'soft', moths: true  }
};

export function weatherForNight(n) {
  const i = Math.max(1, Math.min(12, n | 0));
  return Object.assign({}, NIGHT_WEATHER[i]);
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function R(a, b) { return a + Math.random() * (b - a); }

function makeNoise(ctx, sec, kind) {
  const n = Math.floor(ctx.sampleRate * sec);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'brown') {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else {
      d[i] = w;
    }
  }
  return buf;
}

export class GameAudio {
  /**
   * @param {{masterVolume?: number, quality?: 'low'|'high', maxVoices?: number}} [opts]
   */
  constructor(opts = {}) {
    this.quality = opts.quality === 'low' ? 'low' : 'high';
    this._masterVolume = clamp(opts.masterVolume ?? 0.3, 0, 1);
    this._maxVoices = opts.maxVoices ?? VOICES[this.quality];
    this._ctx = null;
    this._master = null;
    this._comp = null;
    this._noise = null;
    this._brown = null;
    this._ready = false;
    this._voices = 0;
    this._groups = Object.create(null);
    this._beds = Object.create(null);
    this._night = 0;
    this._nightTarget = 0;
    this._fireLevel = 1;
    this._lit = true;
    this._nextPop = 0;
    this._nextOwl = 0;
    this._nextChirp = 0;
    this._nextRain = 0;
    this._nextMoth = 0;
    this._metaNight = 0;
    this._weather = { rain: false, wind: false, fog: 'off', moths: false };
    this._chatEnabled = true;
    this._out = null;
    this._filter = null;
    this._disposed = false;
  }

  get ready() { return this._ready && !!this._ctx && this._ctx.state !== 'closed'; }
  get night() { return this._nightTarget >= 0.5; }
  get fireLevel() { return this._fireLevel; }
  get nightIndex() { return this._metaNight; }
  get weather() { return Object.assign({}, this._weather); }

  /**
   * Создаёт AudioContext. Вызывать только из жеста пользователя (pointerdown / keydown).
   * Повторные вызовы безопасны: если контекст уже есть — resume().
   */
  async init() {
    if (this._disposed) return false;
    if (!this._ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      const ctx = new Ctx();
      const master = ctx.createGain();
      master.gain.value = this._masterVolume;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 10;
      comp.ratio.value = 3.5;
      comp.attack.value = 0.003;
      comp.release.value = 0.12;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 16000;
      filter.Q.value = 0.7;
      filter.connect(master);
      master.connect(comp);
      comp.connect(ctx.destination);
      this._ctx = ctx;
      this._master = master;
      this._comp = comp;
      this._filter = filter;
      this._out = filter;
      this._noise = makeNoise(ctx, 1.5, 'white');
      this._brown = makeNoise(ctx, 2, 'brown');
    }
    try { await this._ctx.resume(); } catch (_) { /* ignore */ }
    if (this._ctx.state === 'suspended') return false;
    // тихий буфер — разблокировка Safari / WebView
    const silent = this._ctx.createBuffer(1, 1, 22050);
    const src = this._ctx.createBufferSource();
    src.buffer = silent;
    src.connect(this._ctx.destination);
    src.start(0);
    if (!this._ready) {
      this._startBeds();
      this._ready = true;
    }
    this._applyBeds(true);
    return true;
  }

  /**
   * @param {'step'|'chop'|'collect'|'fire'|'night'|'moose'|'ping'} name
   * @param {object} [opts]
   *   step:    { surface?: 'grass'|'stone'|'wood', remote?: boolean }
   *   collect: { item?: 'sticks'|'stones'|'berries'|'scraps' }
   *   fire:    { kind?: 'feed'|'upgrade'|'ignite'|'extinguish' }
   *   moose:   { kind?: 'steps'|'breath'|'light' }
   *   ping:    { tired?: boolean }
   */
  play(name, opts = {}) {
    if (!this.ready) return false;
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
      return false;
    }
    switch (name) {
      case 'step': return this._step(opts);
      case 'chop': return this._chop(opts);
      case 'collect': return this._collect(opts);
      case 'fire': return this._fireAction(opts);
      case 'night': return this._nightFall(opts);
      case 'moose': return this._moose(opts);
      case 'ping': return this._ping(opts);
      case 'crow': return this._crow(opts);
      case 'mist': return this._mistball(opts);
      case 'moth': return this._moth(opts);
      case 'rain': return this._rainDrop(opts);
      case 'wind': return this._windGust(opts);
      case 'chat': return this._chat(opts);
      case 'ui': return this._ui(opts);
      case 'chest': return this._chest(opts);
      case 'craft': return this._craft(opts);
      case 'lamp': return this._lamp(opts);
      case 'push': return this._push(opts);
      case 'eat': return this._eat(opts);
      case 'pet': return this._pet(opts);
      case 'morning': return this._jingle('morning');
      case 'win': return this._jingle('win');
      case 'lose': return this._jingle('lose');
      default: return false;
    }
  }

  /** Включает/выключает ночной амбиент (кроссфейд ~1.5 с). Погоду не сбрасывает. */
  setNight(on) {
    this._nightTarget = on ? 1 : 0;
    this._applyBeds(false);
  }

  /**
   * Пресет ночи 1–12 по GDD v0.5: включает ночь и погоду (дождь / густой туман / ветер / мотыльки).
   * setNight(boolean) по-прежнему только кроссфейд дня и ночи.
   */
  applyNight(n) {
    const i = Math.max(1, Math.min(12, n | 0));
    this._metaNight = i;
    this.setWeather(weatherForNight(i));
    this.setNight(true);
    return i;
  }

  /**
   * @param {{rain?: boolean, wind?: boolean, fog?: 'off'|'soft'|'dense', moths?: boolean}} w
   */
  setWeather(w = {}) {
    const cur = this._weather;
    if ('rain' in w) cur.rain = !!w.rain;
    if ('wind' in w) cur.wind = !!w.wind;
    if ('moths' in w) cur.moths = !!w.moths;
    if ('fog' in w) cur.fog = w.fog === 'dense' ? 'dense' : w.fog === 'soft' ? 'soft' : 'off';
    this._applyBeds(false);
  }

  setChatEnabled(on) {
    this._chatEnabled = !!on;
  }

  /** Уровень костра 1–3 (из GDD): плотность треска и глубина гула. */
  setFireLevel(level) {
    this._fireLevel = clamp(level | 0, 1, 3);
    this._applyBeds(false);
  }

  /** Горит ли костёр (петля треска). */
  setLit(on) {
    this._lit = !!on;
    this._applyBeds(false);
  }

  setMasterVolume(v) {
    this._masterVolume = clamp(v, 0, 1);
    if (this._master) {
      const t = this._ctx ? this._ctx.currentTime : 0;
      this._master.gain.setTargetAtTime(this._masterVolume, t, 0.05);
    }
  }

  setQuality(q) {
    this.quality = q === 'low' ? 'low' : 'high';
    this._maxVoices = VOICES[this.quality];
  }

  /**
   * Тик для слоёв (треск, сверчки, сова). Движок должен вызывать из своего цикла.
   * @param {number} dt секунды
   */
  update(dt) {
    if (!this.ready || this._ctx.state !== 'running') return;
    const k = 1 - Math.exp(-(dt || 0.016) * 1.8);
    this._night += (this._nightTarget - this._night) * k;
    const t = this._ctx.currentTime;
    if (this._lit && t >= this._nextPop) {
      this._firePop();
      const gap = this._fireLevel === 3 ? R(0.12, 0.5) : this._fireLevel === 2 ? R(0.16, 0.65) : R(0.22, 0.8);
      this._nextPop = t + (this.quality === 'low' ? gap * 1.4 : gap);
    }
    if (this._night > 0.5 && t >= this._nextChirp) {
      this._cricket();
      if (Math.random() < 0.45) this._cricket(0.07);
      this._nextChirp = t + R(0.4, 2.0);
    }
    if (this.quality !== 'low' && this._night > 0.55 && t >= this._nextOwl && !this._weather.rain) {
      this._owl();
      this._nextOwl = t + R(10, 18);
    }
    if (this._weather.rain && this._night > 0.3 && t >= this._nextRain) {
      this._rainDrop({ soft: true });
      this._nextRain = t + (this.quality === 'low' ? R(0.35, 0.9) : R(0.18, 0.55));
    }
    if (this._weather.moths && this._night > 0.4 && t >= this._nextMoth) {
      this._moth({});
      this._nextMoth = t + R(1.6, 3.4);
    }
    this._applyMuffle();
  }

  dispose() {
    this._disposed = true;
    this._ready = false;
    this._stopBeds();
    if (this._ctx) {
      try { this._ctx.close(); } catch (_) { /* ignore */ }
    }
    this._ctx = null;
    this._master = null;
    this._comp = null;
    this._noise = null;
    this._brown = null;
    this._beds = Object.create(null);
  }

  // ----- внутреннее -----

  _take(group, dur) {
    if (this._voices >= this._maxVoices) return false;
    const cap = GROUP_LIMIT[group] ?? 2;
    const used = this._groups[group] || 0;
    if (used >= cap) return false;
    this._voices++;
    this._groups[group] = used + 1;
    const ms = Math.max(30, (dur || 0.2) * 1000);
    setTimeout(() => {
      this._voices = Math.max(0, this._voices - 1);
      this._groups[group] = Math.max(0, (this._groups[group] || 1) - 1);
    }, ms);
    return true;
  }

  _noiseBurst({ dur = 0.1, peak = 0.08, type = 'bandpass', freq = 1200, Qv = 1.2, buf, shift = 0, group = 'fire' }) {
    if (!this._take(group, dur + shift + 0.05)) return false;
    const ctx = this._ctx;
    const t = ctx.currentTime + shift;
    const src = ctx.createBufferSource();
    src.buffer = buf || this._noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = Qv;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this._out);
    src.start(t);
    src.stop(t + dur + 0.02);
    return true;
  }

  _tone({ type = 'sine', f0 = 440, f1, dur = 0.12, peak = 0.07, shift = 0, group = 'collect' }) {
    if (!this._take(group, dur + shift + 0.05)) return false;
    const ctx = this._ctx;
    const t = ctx.currentTime + shift;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 ?? f0), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this._out);
    o.start(t);
    o.stop(t + dur + 0.02);
    return true;
  }

  _step(opts) {
    const surface = opts.surface || 'grass';
    const vary = 1 + R(-0.08, 0.08);
    const remote = opts.remote ? 0.45 : 1;
    if (surface === 'stone') {
      this._tone({ type: 'triangle', f0: 420 * vary, f1: 180, dur: 0.08, peak: 0.07 * remote, group: 'step' });
      this._noiseBurst({ dur: 0.06, peak: 0.05 * remote, type: 'bandpass', freq: 2400, Qv: 1.6, group: 'step' });
    } else if (surface === 'wood') {
      this._tone({ type: 'triangle', f0: 280 * vary, f1: 140, dur: 0.1, peak: 0.075 * remote, group: 'step' });
      this._noiseBurst({ dur: 0.07, peak: 0.045 * remote, type: 'bandpass', freq: 2000, Qv: 1.4, group: 'step' });
    } else {
      this._noiseBurst({ dur: 0.1, peak: 0.08 * vary * remote, type: 'bandpass', freq: 900 + R(0, 700), Qv: 1.1, group: 'step' });
      this._tone({ type: 'sine', f0: 130 * vary, f1: 70, dur: 0.09, peak: 0.035 * remote, group: 'step' });
    }
    return true;
  }

  _chop() {
    this._noiseBurst({ dur: 0.09, peak: 0.11, type: 'highpass', freq: 900, Qv: 0.8, group: 'chop' });
    this._tone({ type: 'triangle', f0: 320 + R(-30, 30), f1: 140, dur: 0.18, peak: 0.1, group: 'chop' });
    this._noiseBurst({ dur: 0.16, peak: 0.065, type: 'bandpass', freq: 500, Qv: 0.9, shift: 0.03, group: 'chop' });
    return true;
  }

  _collect(opts) {
    const item = opts.item || 'sticks';
    if (item === 'stones') {
      this._tone({ type: 'triangle', f0: 620, f1: 280, dur: 0.09, peak: 0.07, group: 'collect' });
      this._tone({ type: 'sine', f0: 980, f1: 720, dur: 0.07, peak: 0.04, shift: 0.03, group: 'collect' });
    } else if (item === 'berries') {
      this._tone({ type: 'sine', f0: 784, f1: 988, dur: 0.12, peak: 0.07, group: 'collect' });
      this._tone({ type: 'sine', f0: 1175, f1: 1319, dur: 0.14, peak: 0.05, shift: 0.07, group: 'collect' });
    } else if (item === 'scraps') {
      this._noiseBurst({ dur: 0.12, peak: 0.05, type: 'bandpass', freq: 1800, Qv: 0.8, group: 'collect' });
      this._tone({ type: 'sine', f0: 523, f1: 659, dur: 0.14, peak: 0.055, shift: 0.04, group: 'collect' });
    } else {
      // ветки
      this._tone({ type: 'triangle', f0: 392, f1: 494, dur: 0.11, peak: 0.065, group: 'collect' });
      this._noiseBurst({ dur: 0.08, peak: 0.04, type: 'bandpass', freq: 1400, Qv: 1.1, group: 'collect' });
    }
    return true;
  }

  _fireAction(opts) {
    const kind = opts.kind || 'feed';
    if (kind === 'upgrade') {
      const notes = [392, 494, 587, 784];
      notes.forEach((f, i) => this._tone({ type: 'sine', f0: f, f1: f * 1.02, dur: 0.35, peak: 0.06 - i * 0.006, shift: i * 0.09, group: 'fire' }));
      this._noiseBurst({ dur: 0.4, peak: 0.07, type: 'bandpass', freq: 600, Qv: 0.7, buf: this._brown, group: 'fire' });
    } else if (kind === 'ignite') {
      this._noiseBurst({ dur: 0.55, peak: 0.08, type: 'bandpass', freq: 400, Qv: 0.6, buf: this._brown, group: 'fire' });
      this._tone({ type: 'sine', f0: 180, f1: 90, dur: 0.4, peak: 0.05, group: 'fire' });
      this._nextPop = this._ctx.currentTime + 0.02;
      this.setLit(true);
    } else if (kind === 'extinguish') {
      this._noiseBurst({ dur: 0.7, peak: 0.07, type: 'lowpass', freq: 500, Qv: 0.6, buf: this._brown, group: 'fire' });
      this._tone({ type: 'sine', f0: 140, f1: 50, dur: 0.55, peak: 0.04, group: 'fire' });
      this.setLit(false);
    } else {
      // подброс топлива
      this._noiseBurst({ dur: 0.45, peak: 0.075, type: 'bandpass', freq: 500, Qv: 0.7, buf: this._brown, group: 'fire' });
      this._nextPop = this._ctx.currentTime + 0.02;
    }
    return true;
  }

  _nightFall() {
    // мягкое наступление ночи: низкие деревянные ноты + шелест, без stinger
    this.setNight(true);
    this._noiseBurst({ dur: 0.8, peak: 0.05, type: 'lowpass', freq: 700, Qv: 0.6, buf: this._brown, group: 'night' });
    this._tone({ type: 'sine', f0: 196, f1: 147, dur: 0.7, peak: 0.05, group: 'night' });
    this._tone({ type: 'sine', f0: 147, f1: 110, dur: 0.85, peak: 0.045, shift: 0.35, group: 'night' });
    this._tone({ type: 'sine', f0: 246, f1: 196, dur: 0.5, peak: 0.025, shift: 0.55, group: 'night' });
    this._nextChirp = this._ctx.currentTime + 0.6;
    return true;
  }

  _moose(opts) {
    const kind = opts.kind || 'breath';
    const ctx = this._ctx;
    const t = ctx.currentTime;
    if (kind === 'steps') {
      // далёкие мягкие шаги, без грохота
      this._tone({ type: 'sine', f0: 72, f1: 40, dur: 0.24, peak: 0.07, group: 'moose' });
      this._noiseBurst({ dur: 0.22, peak: 0.05, type: 'lowpass', freq: 160, Qv: 0.7, buf: this._brown, group: 'moose' });
      this._tone({ type: 'sine', f0: 68, f1: 38, dur: 0.26, peak: 0.06, shift: 0.55, group: 'moose' });
      this._noiseBurst({ dur: 0.22, peak: 0.045, type: 'lowpass', freq: 150, Qv: 0.7, buf: this._brown, shift: 0.55, group: 'moose' });
      return true;
    }
    if (kind === 'light') {
      // короткое «недоволен светом», без рёва и скачка громкости
      if (!this._take('moose', 0.7)) return false;
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(110, t + 0.45);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 420;
      f.Q.value = 2.2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(f);
      f.connect(g);
      g.connect(this._out);
      o.start(t);
      o.stop(t + 0.55);
      this._noiseBurst({ dur: 0.25, peak: 0.035, type: 'lowpass', freq: 280, Qv: 0.8, buf: this._brown, group: 'moose' });
      return true;
    }
    // спокойное дыхание / мычание
    if (!this._take('moose', 1.3)) return false;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(118, t);
    o.frequency.linearRampToValueAtTime(96, t + 0.55);
    o.frequency.linearRampToValueAtTime(108, t + 1.15);
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = 178;
    const g2 = ctx.createGain();
    g2.gain.value = 0.18;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 360;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.12);
    g.gain.linearRampToValueAtTime(0.06, t + 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(f);
    o2.connect(g2);
    g2.connect(f);
    f.connect(g);
    g.connect(this._out);
    o.start(t);
    o2.start(t);
    o.stop(t + 1.25);
    o2.stop(t + 1.25);
    return true;
  }

  _ping(opts) {
    const tired = !!opts.tired;
    if (tired) {
      // автосигнал «я устал, помоги» — ниже и мягче, не тревожная сирена
      this._tone({ type: 'sine', f0: 330, f1: 311, dur: 0.28, peak: 0.055, group: 'ping' });
      this._tone({ type: 'sine', f0: 392, f1: 370, dur: 0.36, peak: 0.05, shift: 0.22, group: 'ping' });
    } else {
      this._tone({ type: 'sine', f0: 659, f1: 698, dur: 0.16, peak: 0.08, group: 'ping' });
      this._tone({ type: 'sine', f0: 880, f1: 831, dur: 0.22, peak: 0.07, shift: 0.12, group: 'ping' });
    }
    return true;
  }

  _firePop() {
    if (!this._lit) return;
    const p = R(0.03, 0.07) * (0.75 + this._fireLevel * 0.12);
    this._noiseBurst({ dur: R(0.04, 0.1), peak: p, type: 'bandpass', freq: R(800, 2200), Qv: R(1, 3), group: 'fire' });
  }

  _cricket(shift = 0) {
    if (!this._take('night', 0.22)) return;
    const ctx = this._ctx;
    const t = ctx.currentTime + shift;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = R(3800, 5600);
    const am = ctx.createGain();
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = R(16, 28);
    const lg = ctx.createGain();
    lg.gain.value = 0.5;
    const base = ctx.createGain();
    base.gain.value = 0.5;
    lfo.connect(lg);
    lg.connect(am.gain);
    base.connect(am.gain);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.028 * this._night, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(am);
    am.connect(g);
    g.connect(this._out);
    o.start(t);
    lfo.start(t);
    o.stop(t + 0.18);
    lfo.stop(t + 0.18);
  }

  _owl() {
    const hoot = (shift, f, dur) => {
      if (!this._take('night', dur + 0.05)) return;
      const ctx = this._ctx;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t + shift);
      o.frequency.linearRampToValueAtTime(f * 0.92, t + shift + dur);
      const f2 = ctx.createOscillator();
      f2.type = 'sine';
      f2.frequency.value = f * 1.5;
      const g2 = ctx.createGain();
      g2.gain.value = 0.15;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + shift);
      g.gain.exponentialRampToValueAtTime(0.045 * this._night, t + shift + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + shift + dur);
      o.connect(g);
      f2.connect(g2);
      g2.connect(g);
      g.connect(this._out);
      o.start(t + shift);
      f2.start(t + shift);
      o.stop(t + shift + dur + 0.02);
      f2.stop(t + shift + dur + 0.02);
    };
    hoot(0, 355, 0.38);
    hoot(0.42, 310, 0.55);
  }

  _startBeds() {
    const ctx = this._ctx;
    const rumSrc = ctx.createBufferSource();
    rumSrc.buffer = this._brown;
    rumSrc.loop = true;
    const rumF = ctx.createBiquadFilter();
    rumF.type = 'lowpass';
    rumF.frequency.value = 220;
    const rumG = ctx.createGain();
    rumG.gain.value = 0;
    rumSrc.connect(rumF);
    rumF.connect(rumG);
    rumG.connect(this._out);
    rumSrc.start();
    this._beds.rumble = { src: rumSrc, gain: rumG, filter: rumF };

    const wSrc = ctx.createBufferSource();
    wSrc.buffer = this._brown;
    wSrc.loop = true;
    const wF = ctx.createBiquadFilter();
    wF.type = 'lowpass';
    wF.frequency.value = 500;
    const wG = ctx.createGain();
    wG.gain.value = 0;
    wSrc.connect(wF);
    wF.connect(wG);
    wG.connect(this._out);
    wSrc.start();
    this._beds.wind = { src: wSrc, gain: wG, filter: wF };

    this._nextPop = ctx.currentTime + 0.25;
    this._nextOwl = ctx.currentTime + 8;
    this._nextChirp = ctx.currentTime + 1.2;
    this._nextRain = ctx.currentTime + 0.4;
    this._nextMoth = ctx.currentTime + 2;

    const rSrc = ctx.createBufferSource();
    rSrc.buffer = this._noise;
    rSrc.loop = true;
    const rF = ctx.createBiquadFilter();
    rF.type = 'bandpass';
    rF.frequency.value = 1400;
    rF.Q.value = 0.7;
    const rG = ctx.createGain();
    rG.gain.value = 0;
    rSrc.connect(rF);
    rF.connect(rG);
    rG.connect(this._out);
    rSrc.start();
    this._beds.rain = { src: rSrc, gain: rG, filter: rF };

    const mkPad = (freq) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = freq * 1.005;
      const g = ctx.createGain();
      g.gain.value = 0;
      o.connect(g);
      o2.connect(g);
      g.connect(this._out);
      o.start();
      o2.start();
      return { src: o, src2: o2, gain: g };
    };
    this._beds.dayPad = mkPad(261.63);
    this._beds.nightPad = mkPad(196);
  }

  _applyBeds(immediate) {
    if (!this._beds.rumble || !this._ctx) return;
    const t = this._ctx.currentTime;
    const tau = immediate ? 0.05 : 0.4;
    const fireGain = this._lit ? 0.028 * (0.7 + this._fireLevel * 0.15) : 0;
    this._beds.rumble.gain.gain.setTargetAtTime(fireGain, t, tau);
    const n = this._nightTarget;
    const windBoost = this._weather.wind && n > 0.3 ? 0.035 : 0;
    this._beds.wind.gain.gain.setTargetAtTime((0.012 + 0.02 * n + windBoost) * (n > 0.15 || this._weather.wind ? 1 : 0.85), t, tau);
    this._beds.wind.filter.frequency.setTargetAtTime(350 + n * 280 + (this._weather.wind ? 200 : 0), t, tau);
    if (this._beds.rain) {
      const rg = this._weather.rain && n > 0.2 ? (this.quality === 'low' ? 0.035 : 0.05) : 0;
      this._beds.rain.gain.gain.setTargetAtTime(rg, t, tau);
    }
    if (this._beds.dayPad) {
      this._beds.dayPad.gain.gain.setTargetAtTime((1 - n) * 0.018, t, 0.6);
    }
    if (this._beds.nightPad) {
      const dark = this._weather.fog === 'dense' ? 0.016 : 0.02;
      this._beds.nightPad.gain.gain.setTargetAtTime(n * dark, t, 0.6);
    }
  }

  _stopBeds() {
    for (const key of Object.keys(this._beds)) {
      const b = this._beds[key];
      try { if (b.src) b.src.stop(); } catch (_) { /* ignore */ }
      try { if (b.src2) b.src2.stop(); } catch (_) { /* ignore */ }
    }
    this._beds = Object.create(null);
  }

  _applyMuffle() {
    if (!this._filter || !this._ctx) return;
    const t = this._ctx.currentTime;
    let hz = 16000;
    if (this._night > 0.4) {
      if (this._weather.fog === 'dense') hz = 2800;
      else if (this._weather.fog === 'soft') hz = 4200;
      else hz = 9000;
    }
    this._filter.frequency.setTargetAtTime(hz, t, 0.4);
  }

  _crow(opts) {
    const kind = opts.kind || 'caw';
    if (kind === 'flap') {
      this._noiseBurst({ dur: 0.08, peak: 0.05, type: 'bandpass', freq: 900, Qv: 1.1, group: 'crow' });
      this._noiseBurst({ dur: 0.07, peak: 0.04, type: 'bandpass', freq: 1100, Qv: 1.1, shift: 0.09, group: 'crow' });
      return true;
    }
    // сонное карканье, не резкое
    this._tone({ type: 'triangle', f0: 420, f1: 280, dur: 0.16, peak: 0.07, group: 'crow' });
    this._noiseBurst({ dur: 0.14, peak: 0.045, type: 'bandpass', freq: 800, Qv: 1.4, group: 'crow' });
    this._tone({ type: 'triangle', f0: 360, f1: 240, dur: 0.18, peak: 0.055, shift: 0.14, group: 'crow' });
    return true;
  }

  _mistball(opts) {
    const kind = opts.kind || 'puff';
    if (kind === 'blow') {
      // попытка задуть костёр — мягкий выдох, не взрыв
      this._noiseBurst({ dur: 0.45, peak: 0.07, type: 'lowpass', freq: 500, Qv: 0.6, buf: this._brown, group: 'mist' });
      this._tone({ type: 'sine', f0: 160, f1: 70, dur: 0.35, peak: 0.04, group: 'mist' });
      return true;
    }
    this._noiseBurst({ dur: 0.22, peak: 0.05, type: 'lowpass', freq: 380, Qv: 0.7, buf: this._brown, group: 'mist' });
    return true;
  }

  _moth() {
    this._noiseBurst({ dur: 0.16, peak: 0.03, type: 'bandpass', freq: 3200, Qv: 1.8, group: 'moth' });
    this._tone({ type: 'sine', f0: 1480, f1: 1760, dur: 0.14, peak: 0.022, group: 'moth' });
    return true;
  }

  _rainDrop(opts) {
    const peak = opts.soft ? 0.028 : 0.05;
    this._noiseBurst({ dur: 0.07, peak, type: 'highpass', freq: 1800, Qv: 0.8, group: 'rain' });
    if (!opts.soft) this.setWeather({ rain: true });
    return true;
  }

  _windGust() {
    this._noiseBurst({ dur: 0.55, peak: 0.055, type: 'bandpass', freq: 600, Qv: 0.6, buf: this._brown, group: 'wind' });
    this.setWeather({ wind: true });
    return true;
  }

  _chat(opts) {
    if (!this._chatEnabled || opts.muted) return false;
    this._tone({ type: 'sine', f0: 720, f1: 640, dur: 0.09, peak: 0.045, group: 'chat' });
    this._tone({ type: 'sine', f0: 540, f1: 500, dur: 0.1, peak: 0.03, shift: 0.05, group: 'chat' });
    return true;
  }

  _ui(opts) {
    const kind = opts.kind || 'click';
    const table = {
      click:  [[880, 700, 0.06, 0.05, 0]],
      play:   [[523, 659, 0.16, 0.06, 0], [659, 784, 0.18, 0.05, 0.1]],
      mode:   [[392, 494, 0.12, 0.05, 0]],
      map:    [[440, 554, 0.14, 0.055, 0], [554, 659, 0.14, 0.045, 0.1]],
      stage:  [[659, 784, 0.12, 0.055, 0]],
      join:   [[523, 659, 0.14, 0.05, 0], [659, 523, 0.12, 0.04, 0.12]],
      fill:   [[349, 440, 0.12, 0.045, 0]],
      tick:   [[980, 880, 0.05, 0.035, 0]],
      timeout:[[330, 247, 0.2, 0.05, 0]],
      empty:  [[294, 247, 0.22, 0.05, 0], [247, 196, 0.28, 0.04, 0.14]],
      found:  [[523, 659, 0.14, 0.055, 0], [659, 784, 0.18, 0.05, 0.12]],
      start:  [[392, 523, 0.16, 0.06, 0], [523, 659, 0.18, 0.055, 0.12], [659, 784, 0.22, 0.05, 0.24]]
    };
    const seq = table[kind] || table.click;
    seq.forEach(([f0, f1, dur, peak, shift]) => {
      this._tone({ type: 'sine', f0, f1, dur, peak, shift, group: 'ui' });
    });
    return true;
  }

  _chest(opts) {
    const into = (opts.kind || 'in') === 'in';
    this._tone({ type: 'triangle', f0: into ? 320 : 420, f1: into ? 240 : 360, dur: 0.1, peak: 0.055, group: 'chest' });
    this._noiseBurst({ dur: 0.08, peak: 0.035, type: 'bandpass', freq: into ? 700 : 1100, Qv: 1.2, group: 'chest' });
    return true;
  }

  _craft() {
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((f, i) => this._tone({ type: 'sine', f0: f, f1: f * 1.01, dur: 0.22, peak: 0.05 - i * 0.006, shift: i * 0.07, group: 'craft' }));
    return true;
  }

  _lamp(opts) {
    const kind = opts.kind || 'on';
    if (kind === 'charge') {
      this._tone({ type: 'sine', f0: 240, f1: 480, dur: 0.28, peak: 0.045, group: 'lamp' });
      return true;
    }
    this._tone({ type: 'sine', f0: 880, f1: 660, dur: 0.12, peak: 0.05, group: 'lamp' });
    this._noiseBurst({ dur: 0.08, peak: 0.03, type: 'highpass', freq: 2400, Qv: 0.7, group: 'lamp' });
    return true;
  }

  _push() {
    this._noiseBurst({ dur: 0.12, peak: 0.07, type: 'lowpass', freq: 500, Qv: 0.8, buf: this._brown, group: 'push' });
    this._tone({ type: 'sine', f0: 140, f1: 70, dur: 0.14, peak: 0.05, group: 'push' });
    return true;
  }

  _eat(opts) {
    const pie = (opts.item || 'berries') === 'pie';
    this._tone({ type: 'sine', f0: pie ? 392 : 659, f1: pie ? 523 : 784, dur: pie ? 0.18 : 0.1, peak: 0.055, group: 'eat' });
    if (pie) this._tone({ type: 'sine', f0: 523, f1: 659, dur: 0.16, peak: 0.04, shift: 0.1, group: 'eat' });
    return true;
  }

  _pet(opts) {
    const kind = opts.kind || 'idle';
    const pet = opts.pet || 'raccoon';
    if (kind === 'sleep') {
      this._tone({ type: 'sine', f0: 220, f1: 180, dur: 0.35, peak: 0.035, group: 'pet' });
      this._tone({ type: 'sine', f0: 180, f1: 150, dur: 0.4, peak: 0.03, shift: 0.28, group: 'pet' });
      return true;
    }
    if (kind === 'wake') {
      this._tone({ type: 'sine', f0: 392, f1: 523, dur: 0.2, peak: 0.05, group: 'pet' });
      this._tone({ type: 'sine', f0: 523, f1: 659, dur: 0.22, peak: 0.045, shift: 0.12, group: 'pet' });
      return true;
    }
    // idle: гусь — мягкий гогот-предупреждение, остальные — короткий возглас
    if (pet === 'goose') {
      this._tone({ type: 'triangle', f0: 420, f1: 300, dur: 0.1, peak: 0.05, group: 'pet' });
      this._tone({ type: 'triangle', f0: 380, f1: 260, dur: 0.1, peak: 0.04, shift: 0.1, group: 'pet' });
    } else if (pet === 'dragon') {
      this._tone({ type: 'sine', f0: 620, f1: 480, dur: 0.12, peak: 0.04, group: 'pet' });
    } else if (pet === 'capybara') {
      this._tone({ type: 'sine', f0: 240, f1: 200, dur: 0.16, peak: 0.04, group: 'pet' });
    } else {
      this._tone({ type: 'sine', f0: 480, f1: 400, dur: 0.1, peak: 0.04, group: 'pet' });
    }
    return true;
  }

  _jingle(kind) {
    if (kind === 'morning') {
      [392, 494, 587, 784].forEach((f, i) => this._tone({ type: 'sine', f0: f, f1: f * 1.01, dur: 0.28, peak: 0.05 - i * 0.005, shift: i * 0.11, group: 'jingle' }));
    } else if (kind === 'win') {
      [523, 659, 784, 1046].forEach((f, i) => this._tone({ type: 'sine', f0: f, f1: f * 1.01, dur: 0.32, peak: 0.055 - i * 0.005, shift: i * 0.12, group: 'jingle' }));
    } else {
      // поражение: мягко и коротко, плюс шипение костра
      this._tone({ type: 'sine', f0: 392, f1: 294, dur: 0.4, peak: 0.05, group: 'jingle' });
      this._tone({ type: 'sine', f0: 294, f1: 220, dur: 0.5, peak: 0.04, shift: 0.25, group: 'jingle' });
      this._noiseBurst({ dur: 0.7, peak: 0.055, type: 'lowpass', freq: 500, Qv: 0.6, buf: this._brown, group: 'fire' });
    }
    return true;
  }
}

export function createAudio(opts) {
  return new GameAudio(opts);
}

export default GameAudio;
