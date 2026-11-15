// «99 ночей» — тонкая обёртка над паком звука /fx/audio.js (процедурный Web Audio, 0 КБ файлов).
// Пак даёт все звуки (действия, угрозы, погода, UI, джинглы, пэды дня/ночи; с пака 0.6 — ещё poof / hit / dream). Здесь только:
// mute (выключатель в HUD/меню) и счётчик сыгранных событий для тестов. v0.7: свой «poof» убран — играет звук пака (без двойного звука).
import { GameAudio } from './fx/audio.js?v=0.8.1';

export class GameSfx extends GameAudio {
  constructor(opts = {}) { super(opts); this.muted = false; this._vol = opts.masterVolume ?? .3; this.log = Object.create(null); }
  async init() { const ok = await super.init(); this.setMuted(this.muted); return ok; }
  setMuted(m) { this.muted = !!m; this.setMasterVolume(this.muted ? 0 : this._vol); }
  play(name, opts = {}) {
    this.log[name] = (this.log[name] || 0) + 1;
    if (this.muted) return false;
    return super.play(name, opts);
  }
}
