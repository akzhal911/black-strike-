import * as THREE from 'three';
import { MusicMood, WeaponId } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;

  private volume = 0.8;
  private musicVolume = 0.55;
  private currentMood: MusicMood = 'MENU';
  private musicInterval: number | null = null;
  private musicStep = 0;
  private noiseBuffer: AudioBuffer | null = null;

  public init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1.0;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.volume;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume;
    this.musicGain.connect(this.masterGain);

    // Create shared white noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.setupRainAmbience();
    this.startMusicLoop();
  }

  public setVolumes(sfxVol: number, musVol: number) {
    this.volume = sfxVol;
    this.musicVolume = musVol;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(sfxVol, this.ctx.currentTime, 0.05);
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(musVol, this.ctx.currentTime, 0.1);
    }
  }

  public updateListener(position: THREE.Vector3, forward: THREE.Vector3, up: THREE.Vector3) {
    if (!this.ctx) return;
    const listener = this.ctx.listener;
    const now = this.ctx.currentTime;
    if (listener.positionX) {
      listener.positionX.setValueAtTime(position.x, now);
      listener.positionY.setValueAtTime(position.y, now);
      listener.positionZ.setValueAtTime(position.z, now);
      listener.forwardX.setValueAtTime(forward.x, now);
      listener.forwardY.setValueAtTime(forward.y, now);
      listener.forwardZ.setValueAtTime(forward.z, now);
      listener.upX.setValueAtTime(up.x, now);
      listener.upY.setValueAtTime(up.y, now);
      listener.upZ.setValueAtTime(up.z, now);
    } else {
      listener.setPosition(position.x, position.y, position.z);
      listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }
  }

  private createPanner(pos?: THREE.Vector3): AudioNode {
    if (!this.ctx || !this.sfxGain) return null as unknown as AudioNode;
    if (!pos) return this.sfxGain;

    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 5;
    panner.maxDistance = 140;
    panner.rolloffFactor = 1.1;
    panner.setPosition(pos.x, pos.y, pos.z);
    panner.connect(this.sfxGain);
    return panner;
  }

  private setupRainAmbience() {
    if (!this.ctx || !this.noiseBuffer || !this.sfxGain) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1150;
    filter.Q.value = 0.7;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.04;

    src.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.sfxGain);
    src.start();
  }

  public setRainIntensity(level: number) {
    if (!this.ctx || !this.rainGain) return;
    // level 0.05 (overcast wind) -> 0.16 (rain) -> 0.28 (heavy storm)
    this.rainGain.gain.setTargetAtTime(level, this.ctx.currentTime, 0.5);
  }

  public setAlarmSiren(active: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    if (active && !this.sirenOsc) {
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();
      this.sirenOsc.type = 'sawtooth';
      this.sirenOsc.frequency.value = 420;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 950;

      this.sirenGain.gain.value = 0.06;
      this.sirenOsc.connect(filter);
      filter.connect(this.sirenGain);
      this.sirenGain.connect(this.sfxGain);
      this.sirenOsc.start();
    } else if (!active && this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch {
        // ignore
      }
      this.sirenOsc = null;
      this.sirenGain = null;
    }
  }

  public playWeaponFire(weaponId: WeaponId, suppressed = false, worldPos?: THREE.Vector3) {
    this.init();
    if (!this.ctx || !this.noiseBuffer || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const targetNode = this.createPanner(worldPos);

    // Noise burst for gunshot transient
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';

    const env = this.ctx.createGain();
    let duration = 0.18;
    let punchFreq = 130;

    if (weaponId === 'assault_rifle') {
      filter.frequency.setValueAtTime(suppressed ? 900 : 1650, now);
      duration = suppressed ? 0.11 : 0.21;
      punchFreq = 125;
    } else if (weaponId === 'smg') {
      filter.frequency.setValueAtTime(suppressed ? 1100 : 2100, now);
      duration = 0.14;
      punchFreq = 160;
    } else if (weaponId === 'shotgun') {
      filter.frequency.setValueAtTime(850, now);
      duration = 0.36;
      punchFreq = 75;
    } else if (weaponId === 'sniper') {
      filter.frequency.setValueAtTime(1300, now);
      duration = 0.48;
      punchFreq = 65;
    } else {
      // pistol
      filter.frequency.setValueAtTime(suppressed ? 950 : 1900, now);
      duration = suppressed ? 0.09 : 0.15;
      punchFreq = 150;
    }

    const peakGain = worldPos ? 0.42 : suppressed ? 0.25 : 0.55;
    env.gain.setValueAtTime(peakGain, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(env);
    env.connect(targetNode);
    noise.start(now);
    noise.stop(now + duration);

    // Sub-bass punch oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(punchFreq, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + duration * 0.75);

    oscGain.gain.setValueAtTime(peakGain * 0.9, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.75);

    osc.connect(oscGain);
    oscGain.connect(targetNode);
    osc.start(now);
    osc.stop(now + duration * 0.8);

    // Shell casing clink for local player shots
    if (!worldPos) {
      window.setTimeout(() => this.playShellCasing(), 220 + Math.random() * 120);
    }
  }

  public playShellCasing() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(3400 + Math.random() * 800, now);
    osc.frequency.exponentialRampToValueAtTime(1900, now + 0.045);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playReloadSound() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Mag out click
    this.playMechanicalClick(now, 650, 0.06);
    // Mag in clack
    this.playMechanicalClick(now + 0.55, 920, 0.08);
    // Bolt release rack
    this.playMechanicalClick(now + 1.05, 1320, 0.09);
  }

  public playMechanicalClick(startTime = 0, freq = 920, dur = 0.06) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = startTime > 0 ? startTime : this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + dur);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + dur);
  }

  public playFootstep(surface: 'wet' | 'asphalt' | 'metal' | 'concrete', sprinting = false) {
    if (!this.ctx || !this.noiseBuffer || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = surface === 'wet' ? 'bandpass' : 'lowpass';
    filter.frequency.value =
      surface === 'wet' ? 1600 : surface === 'metal' ? 1200 : surface === 'concrete' ? 680 : 520;

    const gain = this.ctx.createGain();
    const vol = sprinting ? 0.12 : 0.065;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);
    src.stop(now + 0.095);
  }

  public playGlassBreak(worldPos?: THREE.Vector3) {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const target = this.createPanner(worldPos);

    for (let i = 0; i < 5; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + i * 0.035;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2200 + Math.random() * 2400, start);
      osc.frequency.exponentialRampToValueAtTime(900, start + 0.09);

      gain.gain.setValueAtTime(0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);

      osc.connect(gain);
      gain.connect(target);
      osc.start(start);
      osc.stop(start + 0.1);
    }
  }

  public playExplosion(worldPos?: THREE.Vector3) {
    this.init();
    if (!this.ctx || !this.noiseBuffer || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const target = this.createPanner(worldPos);

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(620, now);
    filter.frequency.exponentialRampToValueAtTime(85, now + 1.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(target);
    noise.start(now);
    noise.stop(now + 1.55);

    // Sub-bass shockwave
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(95, now);
    sub.frequency.exponentialRampToValueAtTime(22, now + 1.1);
    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);

    sub.connect(subGain);
    subGain.connect(target);
    sub.start(now);
    sub.stop(now + 1.2);
  }

  public playThunder() {
    if (!this.ctx || !this.noiseBuffer || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(340, now);
    filter.frequency.exponentialRampToValueAtTime(55, now + 2.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + 2.6);
  }

  public playHitMarker(isHeadshot: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isHeadshot ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isHeadshot ? 1850 : 920, now);
    osc.frequency.exponentialRampToValueAtTime(isHeadshot ? 2400 : 420, now + 0.065);

    gain.gain.setValueAtTime(isHeadshot ? 0.24 : 0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  public playRadioBeep() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1480, now);
    osc.frequency.setValueAtTime(1920, now + 0.05);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playAlertSting() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  public playMedkit() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playArmorPickup() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.1);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playObjectiveComplete() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880.0]; // D5, F#5, A5
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.18, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.42);
    });
  }

  public playCheckpointSound() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(987.77, now + 0.1); // B5
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.31);
  }

  public playUiHover() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  public playUiClick() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1240, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.06);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public setMusicMood(mood: MusicMood) {
    this.currentMood = mood;
  }

  private startMusicLoop() {
    if (this.musicInterval) window.clearInterval(this.musicInterval);
    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      this.musicStep = (this.musicStep + 1) % 16;

      // Update siren pitch if active
      if (this.sirenOsc) {
        const freq = this.musicStep % 8 < 4 ? 580 : 410;
        this.sirenOsc.frequency.setTargetAtTime(freq, now, 0.25);
      }

      if (this.currentMood === 'AMBIENT' || this.currentMood === 'MENU') {
        if (this.musicStep % 8 === 0) {
          this.playBassNote(now, this.musicStep === 0 ? 55 : 49, 1.6, 0.14);
        }
      } else if (this.currentMood === 'COMBAT') {
        if (this.musicStep % 2 === 0) {
          const notes = [55, 55, 65.4, 55, 73.4, 55, 61.7, 49];
          const f = notes[(this.musicStep / 2) % notes.length];
          this.playBassNote(now, f, 0.32, 0.22);
        }
      } else if (this.currentMood === 'CHASE' || this.currentMood === 'FINALE') {
        const notes = [55, 65.4, 73.4, 82.4, 55, 65.4, 87.3, 82.4];
        const f = notes[this.musicStep % notes.length];
        this.playBassNote(now, f, 0.22, this.currentMood === 'FINALE' ? 0.3 : 0.25);
        if (this.currentMood === 'FINALE' && this.musicStep % 4 === 0) {
          this.playBassNote(now, f * 2, 0.45, 0.15);
        }
      } else if (this.currentMood === 'VICTORY') {
        if (this.musicStep % 8 === 0) {
          this.playBassNote(now, 65.4, 2.0, 0.12);
        }
      }
    }, 240);
  }

  private playBassNote(time: number, freq: number, dur: number, gainVal: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, time);
    filter.frequency.exponentialRampToValueAtTime(75, time + dur);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }
}

export const soundEngine = new SoundEngine();
