/**
 * Audio synthesis utilities using Web Audio API
 */

let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
      globalAudioCtx = new AudioContextClass();
    }
    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume();
    }
    return globalAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Sintetiza um miado adorável e realista de gatinho ("Mee-ooww!")
 * Usa osciladores com envelope de pitch dinâmico e filtro formante de boca de gato.
 */
export function playCatMeowSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Oscilador Principal (Fundamental)
    const osc1 = ctx.createOscillator();
    // Oscilador Harmônico (Dá calor e textura à voz do gatinho)
    const osc2 = ctx.createOscillator();
    // LFO para vibrato sutil felino
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    // Filtro formante simulando a abertura e fechamento da boquinha
    const filter = ctx.createBiquadFilter();
    const masterGain = ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sawtooth';

    // Curva de Pitch do Miado:
    // Começa no 'M' (~440Hz), sobe rápido no 'EE' (~780Hz), sustenta no 'AA' (~820Hz) e desce suave no 'OWW' (~480Hz)
    osc1.frequency.setValueAtTime(420, now);
    osc1.frequency.exponentialRampToValueAtTime(760, now + 0.12);
    osc1.frequency.linearRampToValueAtTime(840, now + 0.28);
    osc1.frequency.exponentialRampToValueAtTime(460, now + 0.68);

    osc2.frequency.setValueAtTime(420 * 2, now);
    osc2.frequency.exponentialRampToValueAtTime(760 * 2, now + 0.12);
    osc2.frequency.linearRampToValueAtTime(840 * 2, now + 0.28);
    osc2.frequency.exponentialRampToValueAtTime(460 * 2, now + 0.68);

    // Vibrato felino a 5.5 Hz
    lfo.frequency.setValueAtTime(5.5, now);
    lfoGain.gain.setValueAtTime(14, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    // Filtro Passa-Faixa Formante ("M-E-O-W")
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.8, now);
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.18); // "EE"
    filter.frequency.linearRampToValueAtTime(1600, now + 0.35); // "AA"
    filter.frequency.exponentialRampToValueAtTime(750, now + 0.70); // "OW"

    // Envelope de Volume
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.18, now + 0.08); // ataque suave
    masterGain.gain.linearRampToValueAtTime(0.22, now + 0.25); // pico
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.72); // decrescendo

    // Conexões de áudio
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.12, now); // harmônico sutil

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Início e parada
    lfo.start(now);
    osc1.start(now);
    osc2.start(now);

    lfo.stop(now + 0.75);
    osc1.stop(now + 0.75);
    osc2.stop(now + 0.75);
  } catch {
    // Silencioso em caso de bloqueio de autoplay
  }
}

/**
 * Som fofo de conclusão de tarefa (chime de patinha)
 */
export function playCuteSuccessSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.24); // C6

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch {
    // Silencioso
  }
}
