import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PropsMaterial } from '../MaterialGenerico';
import Plano from './Plano';
import './Impostor.css';

const ALTO_LINEA = 20;
const ALTO_VISOR = 300;
const TIPOS = ['TRIPULACION', 'PUERTA', 'ALERTA', 'ERROR', 'INFO', 'RECUENTO', 'ENERGIA', 'COMMS', 'MANTENIMIENTO'];
// De entrada se ocultan los tipos que son ruido
const RUIDO = ['ENERGIA', 'COMMS', 'MANTENIMIENTO'];

interface Linea {
  n: number;
  hora: string;
  tipo: string;
  resto: string;
  quien: string;
  texto: string;
}

const trocear = (log: string): Linea[] =>
  log.split('\n').map((texto, i) => {
    if (!texto.startsWith('[')) return { n: i + 1, hora: '', tipo: 'TITULO', resto: texto, quien: '', texto };
    const [hora, tipo, ...resto] = texto.split(' ');
    return { n: i + 1, hora, tipo, resto: resto.join(' '), quien: resto[0] || '', texto };
  });

const formatear = (n: number) => n.toLocaleString('es-ES');

// Pestaña 📁 Expediente: un visor de log de verdad (virtualizado: solo pinta las líneas a la vista)
const MaterialImpostor: React.FC<PropsMaterial> = ({ material, foco }) => {
  const [actual, setActual] = useState(0);
  const [tipos, setTipos] = useState<Set<string>>(() => new Set(TIPOS.filter((t) => !RUIDO.includes(t))));
  const [busqueda, setBusqueda] = useState('');
  const [tarjeta, setTarjeta] = useState('');
  const [arriba, setArriba] = useState(0);
  const [resaltada, setResaltada] = useState<number | null>(null);
  const caja = useRef<HTMLDivElement>(null);

  const m = material[actual]?.material || {};
  const lineas = useMemo(() => trocear(m.log || ''), [m.log]);
  const tarjetas = useMemo(() => {
    const quienes = new Set<string>();
    lineas.forEach((l) => (l.tipo === 'TRIPULACION' || l.tipo === 'PUERTA') && quienes.add(l.quien));
    return Array.from(quienes).sort();
  }, [lineas]);
  // Solo los tipos que aparecen en este registro (en el reactor no hay apagón ni recuento)
  const presentes = useMemo(() => TIPOS.filter((t) => lineas.some((l) => l.tipo === t)), [lineas]);
  const nombres = useMemo(
    () => Object.fromEntries(lineas.filter((l) => l.tipo === 'TRIPULACION').map((l) => [l.quien, l.resto.split(' ')[1]])),
    [lineas]
  );

  const texto = busqueda.trim().toLowerCase();
  const visibles = useMemo(
    () => lineas.filter((l) => (l.tipo === 'TITULO' || tipos.has(l.tipo))
      && (!tarjeta || l.quien === tarjeta)
      && (!texto || l.texto.toLowerCase().includes(texto))),
    [lineas, tipos, tarjeta, texto]
  );

  // Desde el visor («ver la línea 1.204»): se abre el escenario, se quitan los filtros y se salta a la línea
  useEffect(() => {
    if (!foco) return;
    const i = material.findIndex((x) => x.nombre === foco.escenario);
    if (i >= 0) setActual(i);
    setTipos(new Set(TIPOS));
    setBusqueda('');
    setTarjeta('');
    setResaltada(foco.linea);
  }, [foco, material]);

  useEffect(() => {
    if (resaltada === null || !caja.current) return;
    const i = visibles.findIndex((l) => l.n === resaltada);
    if (i >= 0) caja.current.scrollTop = Math.max(0, i * ALTO_LINEA - ALTO_VISOR / 2);
  }, [resaltada, visibles]);

  const desde = Math.max(0, Math.floor(arriba / ALTO_LINEA) - 10);
  const hasta = Math.min(visibles.length, desde + Math.ceil(ALTO_VISOR / ALTO_LINEA) + 20);

  const alternar = (tipo: string) => {
    const nuevos = new Set(tipos);
    if (nuevos.has(tipo)) nuevos.delete(tipo);
    else nuevos.add(tipo);
    setTipos(nuevos);
  };

  return (
    <div className="impostor-material">
      {material.length > 1 && (
        <div className="impostor-casos" role="tablist">
          {material.map((x, i) => (
            <button key={x.nombre} role="tab" aria-selected={i === actual} className={i === actual ? 'activa' : ''}
              onClick={() => { setActual(i); setResaltada(null); }}>
              📁 {x.nombre}
            </button>
          ))}
        </div>
      )}

      {m.pasillos && (
        <details className="impostor-plano-material" open>
          <summary>🗺️ Plano de la estación</summary>
          <Plano salas={m.salas} pasillos={m.pasillos} titulo="Plano de la estación" />
        </details>
      )}

      <div className="impostor-log">
        <div className="impostor-log-cabecera">
          📜 LOG · Hiperión · {formatear(m.lineas || lineas.length)} líneas
          {visibles.length !== lineas.length && <small> (se ven {formatear(visibles.length)})</small>}
        </div>
        <details className="impostor-filtros" open>
          <summary>Filtros</summary>
          <div className="impostor-filtros-fila">
            <input type="search" placeholder="🔎 Buscar…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar en el registro" />
            <select value={tarjeta} onChange={(e) => setTarjeta(e.target.value)} aria-label="Filtrar por tarjeta">
              <option value="">Todas las tarjetas</option>
              {tarjetas.map((t) => <option key={t} value={t}>{nombres[t] ? `${t} · ${nombres[t]}` : t}</option>)}
            </select>
          </div>
          <div className="impostor-filtros-fila">
            {presentes.map((t) => (
              <label key={t} className={`impostor-tipo t-${t.toLowerCase()}`}>
                <input type="checkbox" checked={tipos.has(t)} onChange={() => alternar(t)} /> {t}
              </label>
            ))}
          </div>
        </details>
        <div className="impostor-log-lineas" ref={caja} style={{ height: ALTO_VISOR }}
          onScroll={(e) => setArriba(e.currentTarget.scrollTop)} tabIndex={0} aria-label="Registro del sistema">
          <div style={{ height: visibles.length * ALTO_LINEA, position: 'relative' }}>
            {visibles.slice(desde, hasta).map((l, i) => (
              <div key={l.n}
                className={`impostor-linea t-${l.tipo.toLowerCase()} ${l.resto.endsWith('DENEGADO') ? 'denegado' : ''} ${l.n === resaltada ? 'resaltada' : ''}`}
                style={{ top: (desde + i) * ALTO_LINEA, height: ALTO_LINEA }}>
                <span className="impostor-n">{String(l.n).padStart(4, '0')}</span>
                {l.tipo === 'TITULO' ? <span>{l.resto}</span> : (
                  <>
                    <span className="impostor-hora">{l.hora}</span>
                    <span className="impostor-tipo-col">{l.tipo}</span>
                    <span>{l.resto}</span>
                  </>
                )}
              </div>
            ))}
            {!visibles.length && <p className="impostor-vacio">Ninguna línea con estos filtros.</p>}
          </div>
        </div>
      </div>
      {!m.pasillos && (
        <p className="impostor-leyenda">🕵️ Aquí no hay plano: la estación se deduce de las líneas PUERTA (también las DENEGADO).</p>
      )}
    </div>
  );
};

export default MaterialImpostor;
