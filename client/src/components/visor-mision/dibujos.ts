// Dibujo en canvas de cada misión. Funciones puras: reciben el estado y pintan un fotograma.

export interface Lienzo {
  ctx: CanvasRenderingContext2D;
  ancho: number;
  alto: number;
}

export interface EstadoVisor {
  escena: any;
  fotogramas: any[];
  indice: number;        // fotograma actual
  fraccion: number;      // 0-1 entre el fotograma actual y el siguiente (para suavizar)
  terminado: boolean;    // se llegó al último fotograma
  exito: boolean;
  tiempoFinal: number;   // ms desde que se llegó al final (para la explosión)
  movimientoReducido: boolean;
}

const COLORES = {
  cielo: '#0a1521',
  estrella: 'rgba(255,255,255,0.8)',
  texto: '#eef3f7',
  ok: '#5cc8c2',
  peligro: '#ff6b7d',
  aviso: '#f4b942',
  casco: '#d5e0ea',
  detalle: '#5cc8c2',
};

// Pseudoaleatorio determinista (para estrellas y partículas)
const aleatorio = (semilla: number) => {
  const x = Math.sin(semilla * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function dibujarEstrellas(l: Lienzo, n = 70) {
  l.ctx.fillStyle = COLORES.estrella;
  for (let i = 0; i < n; i++) {
    const tam = aleatorio(i * 3) < 0.15 ? 2 : 1;
    l.ctx.fillRect(aleatorio(i) * l.ancho, aleatorio(i + 100) * l.alto, tam, tam);
  }
}

function dibujarNave(ctx: CanvasRenderingContext2D, x: number, y: number, escala: number, empuje: number, parpadeo: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(escala, escala);
  // Llama del motor (longitud proporcional al empuje)
  if (empuje > 0.01) {
    const largo = 10 + empuje * 34 * (0.85 + 0.3 * parpadeo);
    const grad = ctx.createLinearGradient(0, 14, 0, 14 + largo);
    grad.addColorStop(0, 'rgba(255,240,180,0.95)');
    grad.addColorStop(0.4, 'rgba(255,150,50,0.85)');
    grad.addColorStop(1, 'rgba(255,60,30,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-7, 14);
    ctx.quadraticCurveTo(0, 14 + largo * 1.1, 7, 14);
    ctx.closePath();
    ctx.fill();
  }
  // Patas
  ctx.strokeStyle = COLORES.detalle;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-9, 8); ctx.lineTo(-15, 20);
  ctx.moveTo(9, 8); ctx.lineTo(15, 20);
  ctx.stroke();
  // Casco
  ctx.fillStyle = COLORES.casco;
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.quadraticCurveTo(13, -8, 11, 12);
  ctx.lineTo(-11, 12);
  ctx.quadraticCurveTo(-13, -8, 0, -22);
  ctx.fill();
  // Ventana
  ctx.fillStyle = '#3b4bd8';
  ctx.beginPath();
  ctx.arc(0, -6, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(-1.5, -7.5, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function dibujarExplosion(ctx: CanvasRenderingContext2D, x: number, y: number, ms: number, reducido: boolean) {
  const t = Math.min(ms / 900, 1);
  if (reducido) {
    ctx.fillStyle = `rgba(255,120,40,${1 - t * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  // Destello
  ctx.fillStyle = `rgba(255,220,150,${Math.max(0, 0.8 - t)})`;
  ctx.beginPath();
  ctx.arc(x, y, 20 + t * 60, 0, Math.PI * 2);
  ctx.fill();
  // Partículas
  for (let i = 0; i < 46; i++) {
    const ang = aleatorio(i) * Math.PI * 2;
    const vel = 40 + aleatorio(i + 50) * 110;
    const px = x + Math.cos(ang) * vel * t;
    const py = y + Math.sin(ang) * vel * t + 40 * t * t;
    ctx.fillStyle = i % 3 === 0 ? `rgba(255,82,82,${1 - t})` : i % 3 === 1 ? `rgba(255,170,60,${1 - t})` : `rgba(207,216,255,${1 - t})`;
    ctx.fillRect(px, py, 3, 3);
  }
}

function hud(l: Lienzo, lineas: { texto: string; color?: string }[]) {
  const { ctx } = l;
  ctx.font = '600 13px "JetBrains Mono Variable", ui-monospace, monospace';
  ctx.textBaseline = 'top';
  lineas.forEach((linea, i) => {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    const w = ctx.measureText(linea.texto).width;
    ctx.fillRect(10, 10 + i * 22, w + 14, 20);
    ctx.fillStyle = linea.color || COLORES.texto;
    ctx.fillText(linea.texto, 17, 13 + i * 22);
  });
}

function cartelFinal(l: Lienzo, e: EstadoVisor, textoOk: string, textoMal: string) {
  if (!e.terminado) return;
  const { ctx } = l;
  const alfa = Math.min(e.tiempoFinal / 400, 1);
  ctx.fillStyle = `rgba(0,0,0,${0.35 * alfa})`;
  ctx.fillRect(0, l.alto / 2 - 30, l.ancho, 60);
  ctx.font = '700 22px "Bricolage Grotesque Variable", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = e.exito ? COLORES.ok : COLORES.peligro;
  ctx.globalAlpha = alfa;
  ctx.fillText(e.exito ? textoOk : textoMal, l.ancho / 2, l.alto / 2);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

const interpolar = (a: number, b: number, f: number) => a + (b - a) * f;

// ---------------- M1: aterrizaje ----------------
export function dibujarAterrizaje(l: Lienzo, e: EstadoVisor) {
  const { ctx, ancho, alto } = l;
  const f0 = e.fotogramas[e.indice];
  const f1 = e.fotogramas[Math.min(e.indice + 1, e.fotogramas.length - 1)];
  const h = interpolar(f0.h, f1.h, e.fraccion);
  const esc = e.escena;

  // Cielo con un tono según el planeta (más gravedad = más rojizo)
  const tinte = Math.min(esc.gravedad / 4, 1);
  const cielo = ctx.createLinearGradient(0, 0, 0, alto);
  cielo.addColorStop(0, COLORES.cielo);
  cielo.addColorStop(1, `rgb(${40 + tinte * 90}, ${30 + (1 - tinte) * 40}, ${70 - tinte * 30})`);
  ctx.fillStyle = cielo;
  ctx.fillRect(0, 0, ancho, alto);
  dibujarEstrellas(l);

  // Suelo
  const suelo = alto - 46;
  ctx.fillStyle = `rgb(${90 + tinte * 80}, ${70 + (1 - tinte) * 50}, ${60})`;
  ctx.beginPath();
  ctx.moveTo(0, alto);
  const n = esc.terreno.length;
  esc.terreno.forEach((v: number, i: number) => {
    const x = (i / (n - 1)) * ancho;
    const centro = Math.abs(x - ancho / 2) < 50;
    ctx.lineTo(x, centro ? suelo : suelo - 4 - v * 22);
  });
  ctx.lineTo(ancho, alto);
  ctx.closePath();
  ctx.fill();
  // Plataforma
  ctx.fillStyle = COLORES.aviso;
  ctx.fillRect(ancho / 2 - 34, suelo - 2, 68, 4);

  // Nave (el techo queda por debajo del panel de datos para no taparla en pantallas bajas)
  const techo = Math.min(110, alto * 0.38);
  const escala = (suelo - techo) / Math.max(esc.altura0 * 1.08, 1);
  const y = suelo - h * escala - 20;
  const fallo = e.terminado && !e.exito;
  if (!fallo || e.tiempoFinal < 120) {
    const parpadeo = e.movimientoReducido ? 0.5 : aleatorio(e.indice * 7 + Math.floor(e.fraccion * 4));
    dibujarNave(ctx, ancho / 2, y, 1.1, e.terminado ? 0 : f0.e, parpadeo);
  }
  if (fallo) dibujarExplosion(ctx, ancho / 2, suelo - 10, e.tiempoFinal, e.movimientoReducido);

  const v = interpolar(f0.v, f1.v, e.fraccion);
  const peligro = v < -2 && h < 30;
  hud(l, [
    { texto: `Altura     ${h.toFixed(1)} m` },
    { texto: `Velocidad  ${v.toFixed(2)} m/s`, color: peligro ? COLORES.peligro : undefined },
    { texto: `Empuje     ${'▮'.repeat(Math.round(f0.e * 10)).padEnd(10, '▯')}` },
    { texto: `Gravedad   ${esc.gravedad} m/s²` },
  ]);
  // Barra de combustible
  const c = Math.max(0, f0.c / esc.combustible0);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(ancho - 34, 14, 20, 120);
  ctx.fillStyle = c > 0.4 ? COLORES.ok : c > 0.15 ? COLORES.aviso : COLORES.peligro;
  ctx.fillRect(ancho - 31, 17 + 114 * (1 - c), 14, 114 * c);
  ctx.fillStyle = COLORES.texto;
  ctx.font = '11px "Onest Variable", system-ui, sans-serif';
  ctx.fillText('⛽', ancho - 32, 140);

  cartelFinal(l, e, '¡Aterrizaje completado!', '💥 La nave se ha estrellado');
}

// ---------------- M2: asteroides ----------------
const VISION = 15;

export function dibujarAsteroides(l: Lienzo, e: EstadoVisor) {
  const { ctx, ancho, alto } = l;
  const esc = e.escena;
  ctx.fillStyle = COLORES.cielo;
  ctx.fillRect(0, 0, ancho, alto);

  const desplazamiento = e.movimientoReducido ? 0 : (e.indice + e.fraccion) * 6;
  ctx.fillStyle = COLORES.estrella;
  for (let i = 0; i < 70; i++) {
    const y = (aleatorio(i + 100) * alto + desplazamiento * (0.5 + aleatorio(i))) % alto;
    ctx.fillRect(aleatorio(i) * ancho, y, 1, 1);
  }

  const margen = 20;
  const anchoCarril = (ancho - margen * 2) / esc.carriles;
  const naveY = alto - 50;
  const fila = (naveY - 20) / VISION;
  // Carriles
  ctx.strokeStyle = 'rgba(124,140,255,0.15)';
  ctx.setLineDash([6, 10]);
  for (let c = 1; c < esc.carriles; c++) {
    ctx.beginPath();
    ctx.moveTo(margen + c * anchoCarril, 0);
    ctx.lineTo(margen + c * anchoCarril, alto);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Asteroides: el que llega en el tick t está a (t - ahora) filas de la nave
  const ahora = e.indice + e.fraccion;
  for (const [t, c] of esc.asteroides as [number, number][]) {
    const d = t - ahora;
    if (d < -1 || d > VISION) continue;
    const x = margen + (c + 0.5) * anchoCarril;
    const y = naveY - d * fila;
    const r = Math.min(anchoCarril * 0.32, 18) * (0.8 + aleatorio(t * 10 + c) * 0.4);
    ctx.fillStyle = '#8a7a6a';
    ctx.beginPath();
    for (let k = 0; k < 9; k++) {
      const ang = (k / 9) * Math.PI * 2;
      const rr = r * (0.75 + aleatorio(t * 31 + c * 7 + k) * 0.35);
      ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.2, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  // Nave (se desliza entre carriles)
  const f0 = e.fotogramas[e.indice];
  const f1 = e.fotogramas[Math.min(e.indice + 1, e.fotogramas.length - 1)];
  const carril = interpolar(f0.carril, f1.carril, e.fraccion);
  const naveX = margen + (carril + 0.5) * anchoCarril;
  const fallo = e.terminado && !e.exito;
  if (!fallo || e.tiempoFinal < 120) dibujarNave(ctx, naveX, naveY, 0.9, e.terminado ? 0 : 0.6, aleatorio(e.indice));
  if (fallo) dibujarExplosion(ctx, naveX, naveY, e.tiempoFinal, e.movimientoReducido);

  const maniobras = e.fotogramas.slice(1, e.indice + 1).filter((f: any, i: number) => f.carril !== e.fotogramas[i].carril).length;
  hud(l, [
    { texto: `Tick       ${e.indice} / ${esc.duracion}` },
    { texto: `Carril     ${f0.carril}` },
    { texto: `Maniobras  ${maniobras}` },
  ]);
  cartelFinal(l, e, '¡Cinturón atravesado!', '💥 Impacto con un asteroide');
}

// ---------------- M3: cristales ----------------
export function dibujarCristales(l: Lienzo, e: EstadoVisor) {
  const { ctx, ancho, alto } = l;
  const esc = e.escena;
  ctx.fillStyle = COLORES.cielo;
  ctx.fillRect(0, 0, ancho, alto);
  dibujarEstrellas(l, 40);

  const filas = esc.mapa.length;
  const columnas = esc.mapa[0].length;
  const celda = Math.min((ancho - 20) / columnas, (alto - 70) / filas);
  const x0 = (ancho - celda * columnas) / 2;
  const y0 = 60 + (alto - 60 - celda * filas) / 2;
  const centro = (f: number, c: number) => [x0 + (c + 0.5) * celda, y0 + (f + 0.5) * celda];

  // Rejilla y rocas
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      ctx.fillStyle = 'rgba(124,140,255,0.06)';
      ctx.fillRect(x0 + c * celda + 1, y0 + f * celda + 1, celda - 2, celda - 2);
      if (esc.mapa[f][c] === '#') {
        const [cx, cy] = centro(f, c);
        ctx.fillStyle = '#5b5268';
        ctx.beginPath();
        ctx.arc(cx, cy, celda * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.arc(cx - celda * 0.12, cy - celda * 0.12, celda * 0.14, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Estela y cristales recogidos hasta este fotograma
  const visitadas = e.fotogramas.slice(0, e.indice + 1).map((x: any) => x.pos as [number, number]);
  ctx.strokeStyle = 'rgba(0,255,136,0.35)';
  ctx.lineWidth = Math.max(2, celda * 0.12);
  ctx.beginPath();
  visitadas.forEach(([f, c]: [number, number], i: number) => {
    const [x, y] = centro(f, c);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  const recogido = (f: number, c: number) => visitadas.some(([vf, vc]: [number, number]) => vf === f && vc === c);
  const brillo = e.movimientoReducido ? 1 : 0.75 + 0.25 * Math.sin((e.indice + e.fraccion) * 1.3);
  for (const [f, c] of esc.cristales as [number, number][]) {
    if (recogido(f, c)) continue;
    const [x, y] = centro(f, c);
    const r = celda * 0.3;
    ctx.fillStyle = `rgba(120,220,255,${brillo})`;
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.7, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.7, y);
    ctx.closePath();
    ctx.fill();
  }

  // Nave
  const f0 = e.fotogramas[e.indice];
  const f1 = e.fotogramas[Math.min(e.indice + 1, e.fotogramas.length - 1)];
  const [ax, ay] = centro(f0.pos[0], f0.pos[1]);
  const [bx, by] = centro(f1.pos[0], f1.pos[1]);
  dibujarNave(ctx, interpolar(ax, bx, e.fraccion), interpolar(ay, by, e.fraccion), celda / 55, 0, 0);

  hud(l, [
    { texto: `Movimientos ${e.indice} / ${esc.limite}` },
    { texto: `Cristales   ${f0.recogidos} / ${esc.cristales.length}` },
  ]);
  cartelFinal(l, e, '¡Todos los cristales recogidos!', '⛔ Sin movimientos');
}

export const DIBUJOS: Record<string, (l: Lienzo, e: EstadoVisor) => void> = {
  aterrizaje: dibujarAterrizaje,
  asteroides: dibujarAsteroides,
  cristales: dibujarCristales,
};

// Segundos reales por tick a velocidad x1
export const SEGUNDOS_POR_TICK: Record<string, number> = {
  aterrizaje: 0.1,
  asteroides: 0.16,
  cristales: 0.3,
};
