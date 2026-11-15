// «99 ночей» — тонкая обёртка над паком звука /fx/audio.js (процедурный Web Audio, 0 КБ файлов).
// Пак даёт все звуки ТЗ 3 (действия, угрозы, погода, UI, джинглы, пэды дня/ночи). Здесь только:
// mute (выключатель в HUD/меню), счётчик сыгранных событий для тестов и короткое «блестящее» рассеивание тени.
import { GameAudio } from './fx/audio.js?v=0.5.2';

export class GameSfx extends GameAudio {
  constructor(opts = {}) { super(opts); this.muted = false; this._vol = opts.masterVolume ?? .3; this.log = Object.create(null); }
  async init() { const ok = await super.init(); this.setMuted(this.muted); return ok; }
  setMuted(m) { this.muted = !!m; this.setMasterVolume(this.muted ? 0 : this._vol); }
  play(name, opts = {}) {
    this.log[name] = (this.log[name] || 0) + 1;
    if (this.muted) return false;
    if (name === 'poof') {   // тень рассыпалась в блёстки (в паке нет) — три тихие высокие ноты
      if (!this.ready || this._ctx.state !== 'running') return false;
      [1046, 1318, 1568].forEach((f, i) => this._tone({ type: 'sine', f0: f, f1: f * 1.2, dur: .14, peak: .03, shift: i * .05, group: 'poof' }));
      return true;
    }
    return super.play(name, opts);
  }
}
