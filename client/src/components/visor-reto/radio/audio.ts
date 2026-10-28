// Síntesis de la radio con WebAudio: onda cuadrada, filtro paso bajo y un poco de estática. Sin ficheros de audio.
export type Pareja = [string, number];

export const ESCALA = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si', 'do2', 're2', 'mi2', 'fa2', 'sol2', 'la2', 'si2'];
const BASE = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88];
export const PULSO_S = 0.12;

export const frecuencia = (nota: string) => {
  const i = ESCALA.indexOf(nota);
  return i < 0 ? 0 : BASE[i % 7] * (i >= 7 ? 2 : 1);
};

export const pulsosTotales = (senal: Pareja[]) => senal.reduce((s, [, d]) => s + d, 0);

let contexto: AudioContext | null = null;

// El AudioContext se crea (o se reanuda) dentro del clic: si no, iOS no deja sonar
function obtenerContexto() {
  const Clase = window.AudioContext || (window as any).webkitAudioContext;
  if (!Clase) return null;
  if (!contexto) contexto = new Clase();
  if (contexto.state === 'suspended') contexto.resume();
  return contexto;
}

function ruidoBlanco(ctx: AudioContext, segundos: number) {
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * segundos)), ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
  return buffer;
}

export interface Reproduccion {
  analizador: AnalyserNode;
  inicio: number;
  duracion: number;
  ahora: () => number;
  parar: () => void;
}

export function reproducir(senal: Pareja[], volumen: number, alTerminar: () => void): Reproduccion | null {
  const ctx = obtenerContexto();
  if (!ctx || !senal.length) return null;
  const salida = ctx.createGain();
  salida.gain.value = Math.max(0, Math.min(1, volumen));
  const analizador = ctx.createAnalyser();
  analizador.fftSize = 1024;
  salida.connect(analizador);
  analizador.connect(ctx.destination);

  const filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = 1800;
  filtro.connect(salida);

  const tono = ctx.createOscillator();
  tono.type = 'square';
  const envolvente = ctx.createGain();
  envolvente.gain.value = 0;
  tono.connect(envolvente);
  envolvente.connect(filtro);

  const inicio = ctx.currentTime + 0.05;
  const duracion = pulsosTotales(senal) * PULSO_S;
  const fuentes: AudioScheduledSourceNode[] = [tono];

  // Siseo de fondo, muy bajo, durante toda la transmisión
  const siseo = ctx.createBufferSource();
  siseo.buffer = ruidoBlanco(ctx, duracion + 0.2);
  const volSiseo = ctx.createGain();
  volSiseo.gain.value = 0.025;
  siseo.connect(volSiseo);
  volSiseo.connect(filtro);
  siseo.start(inicio);
  fuentes.push(siseo);

  let t = inicio;
  for (const [nota, pulsos] of senal) {
    const fin = t + pulsos * PULSO_S;
    if (nota === 'estatica') {
      // Chasquidos de estática
      const chasquido = ctx.createBufferSource();
      chasquido.buffer = ruidoBlanco(ctx, fin - t);
      const vol = ctx.createGain();
      vol.gain.value = 0.35;
      chasquido.connect(vol);
      vol.connect(salida);
      chasquido.start(t);
      fuentes.push(chasquido);
    } else if (nota !== 'silencio') {
      tono.frequency.setValueAtTime(frecuencia(nota) || 440, t);
      envolvente.gain.setValueAtTime(0, t);
      envolvente.gain.linearRampToValueAtTime(0.22, t + 0.008);
      envolvente.gain.setValueAtTime(0.22, Math.max(t + 0.008, fin - 0.012));
      envolvente.gain.linearRampToValueAtTime(0, fin);
    }
    t = fin;
  }
  tono.start(inicio);

  let parado = false;
  const parar = () => {
    if (parado) return;
    parado = true;
    fuentes.forEach((f) => { try { f.stop(); } catch { /* ya parada */ } });
    salida.disconnect();
    alTerminar();
  };
  tono.stop(t + 0.05);
  tono.onended = parar;
  return { analizador, inicio, duracion, ahora: () => ctx.currentTime, parar };
}
