import React, { useEffect, useMemo, useRef, useState } from 'react';
import CodeEditor from '../code-editor/CodeEditor';
import './CajaNegra.css';

export interface Traza {
  pasos: any[];
  salida: string;
  error: string | null;
  truncado: boolean;
}

interface CajaNegraProps {
  titulo: string;
  codigo: string;
  traza: Traza;
  onCerrar: () => void;
}

const VELOCIDADES = [0.5, 1, 2, 4];
const PASOS_POR_SEGUNDO = 3;

// ---------- Dibujo de un valor según su tipo ----------
const Valor: React.FC<{ v: any }> = ({ v }) => {
  if (!v) return null;
  switch (v.t) {
    case 'list':
    case 'tuple':
    case 'set':
    case 'frozenset':
    case 'deque':
      return (
        <div className="cn-contenedor">
          <span className="cn-tipo">{v.t}{v.longitud !== v.elementos.length ? ` · ${v.longitud} elementos` : ''}</span>
          <div className="cn-compartimentos">
            {v.elementos.length === 0 && <span className="cn-vacio">vacía</span>}
            {v.elementos.map((e: any, i: number) => (
              <div key={i} className="cn-compartimento">
                {v.t !== 'set' && v.t !== 'frozenset' && <span className="cn-indice">{i}</span>}
                <Valor v={e} />
              </div>
            ))}
            {v.longitud > v.elementos.length && <span className="cn-mas">… +{v.longitud - v.elementos.length}</span>}
          </div>
        </div>
      );
    case 'dict':
      return (
        <div className="cn-contenedor">
          <span className="cn-tipo">dict{v.longitud > v.items.length ? ` · ${v.longitud} claves` : ''}</span>
          <div className="cn-dict">
            {v.items.length === 0 && <span className="cn-vacio">vacío</span>}
            {v.items.map(([k, val]: any[], i: number) => (
              <div key={i} className="cn-dict-fila">
                <Valor v={k} />
                <span className="cn-flecha">→</span>
                <Valor v={val} />
              </div>
            ))}
          </div>
        </div>
      );
    case 'obj':
      return (
        <div className="cn-contenedor cn-objeto">
          <span className="cn-tipo">🛰️ {v.clase}</span>
          <div className="cn-dict">
            {Object.entries(v.atributos).map(([k, val]) => (
              <div key={k} className="cn-dict-fila">
                <span className="cn-atributo">.{k}</span>
                <Valor v={val} />
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return <span className={`cn-chip cn-${v.t}`} title={v.t}>{v.r}</span>;
  }
};

const CajaNegra: React.FC<CajaNegraProps> = ({ titulo, codigo, traza, onCerrar }) => {
  const { pasos } = traza;
  const ultimo = Math.max(pasos.length - 1, 0);
  const indiceExcepcion = pasos.findIndex((p) => p.evento === 'exception');
  // Si hubo una excepción, se empieza justo ahí (es lo que el alumno quiere ver)
  const [indice, setIndice] = useState(indiceExcepcion >= 0 ? indiceExcepcion : 0);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [velocidad, setVelocidad] = useState(1);
  const dialogo = useRef<HTMLDivElement>(null);

  const paso = pasos[indice];
  const anterior = indice > 0 ? pasos[indice - 1] : null;

  // Reproducción automática
  useEffect(() => {
    if (!reproduciendo) return;
    if (indice >= ultimo) {
      setReproduciendo(false);
      return;
    }
    const t = setTimeout(() => setIndice((i) => Math.min(i + 1, ultimo)), 1000 / (PASOS_POR_SEGUNDO * velocidad));
    return () => clearTimeout(t);
  }, [reproduciendo, indice, ultimo, velocidad]);

  // Teclado: ← → para avanzar y retroceder, Escape para cerrar
  useEffect(() => {
    dialogo.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
      if (e.key === 'ArrowRight') { setReproduciendo(false); setIndice((i) => Math.min(i + 1, ultimo)); }
      if (e.key === 'ArrowLeft') { setReproduciendo(false); setIndice((i) => Math.max(i - 1, 0)); }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onCerrar, ultimo]);

  // Variables que han cambiado respecto al paso anterior (mismo nivel de la pila)
  const cambiadas = useMemo(() => {
    const resultado = new Set<string>();
    if (!paso || !anterior) return resultado;
    paso.pila.forEach((nivel: any, n: number) => {
      const previo = anterior.pila[n];
      if (!previo || previo.funcion !== nivel.funcion) return;
      for (const [nombre, v] of Object.entries(nivel.vars)) {
        if (JSON.stringify(previo.vars[nombre]) !== JSON.stringify(v)) resultado.add(`${n}:${nombre}`);
      }
    });
    return resultado;
  }, [paso, anterior]);

  if (!paso) {
    return (
      <div className="cn-fondo" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="cn-caja cn-caja-vacia">
          <h2>🔭 {titulo}</h2>
          <p>{traza.error || 'El programa no ejecutó ninguna línea.'}</p>
          <button className="cn-boton" onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    );
  }

  // En el último paso se enseña toda la salida (incluida la que imprime un test después de llamar a la función)
  const salidaHastaAqui = indice === ultimo ? traza.salida : traza.salida.slice(0, paso.salida);
  const pilaInvertida = [...paso.pila].reverse(); // la función actual arriba

  return (
    <div className="cn-fondo" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="cn-caja" ref={dialogo} tabIndex={-1}>
        <header className="cn-cabecera">
          <h2>🔭 {titulo}</h2>
          <button className="cn-boton" onClick={onCerrar} aria-label="Cerrar la caja negra">✕</button>
        </header>

        {traza.truncado && (
          <p className="cn-aviso">⚠️ Se muestran los primeros {pasos.length} pasos: el programa siguió (¿un bucle infinito?).</p>
        )}

        <div className="cn-cuerpo">
          <section className="cn-codigo">
            <div className="cn-editor">
              <CodeEditor
                value={codigo}
                onChange={() => undefined}
                readOnly
                lineaActiva={paso.evento === 'exception' ? null : paso.linea}
                lineaError={paso.evento === 'exception' ? paso.linea : null}
              />
            </div>
            <div className="cn-salida">
              <h3>Salida hasta aquí</h3>
              <pre>{salidaHastaAqui || <span className="cn-vacio">(nada todavía)</span>}</pre>
            </div>
          </section>

          <section className="cn-estado" aria-live="polite">
            <div className="cn-evento">
              Paso {indice + 1} de {pasos.length} · línea {paso.linea}
              {/* El «return» del programa principal (siempre None) no aporta nada */}
              {paso.evento === 'return' && paso.pila[paso.pila.length - 1]?.funcion !== '<programa>' && (
                <span className="cn-retorno"> · ↩ {paso.pila[paso.pila.length - 1].funcion}() devuelve <Valor v={paso.retorno} /></span>
              )}
              {paso.evento === 'return' && paso.pila[paso.pila.length - 1]?.funcion === '<programa>' && (
                <span className="cn-retorno"> · 🏁 fin del programa</span>
              )}
            </div>
            {paso.evento === 'exception' && <div className="cn-excepcion">💥 {paso.excepcion}</div>}

            <h3>Pila de llamadas</h3>
            <div className="cn-pila">
              {pilaInvertida.map((nivel: any, i: number) => {
                const n = paso.pila.length - 1 - i;
                const variables = Object.entries(nivel.vars);
                return (
                  <div key={`${n}-${nivel.funcion}`} className={`cn-nivel ${i === 0 ? 'actual' : ''}`}>
                    <div className="cn-nivel-titulo">
                      🚀 {nivel.funcion === '<programa>' ? 'Programa principal' : `${nivel.funcion}()`}
                      <span className="cn-nivel-linea">línea {nivel.linea}</span>
                    </div>
                    {variables.length === 0 && <span className="cn-vacio">sin variables todavía</span>}
                    {variables.map(([nombre, v]) => (
                      <div key={nombre} className={`cn-variable ${cambiadas.has(`${n}:${nombre}`) ? 'cambiada' : ''}`}>
                        <span className="cn-nombre">{nombre}</span>
                        <Valor v={v} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <footer className="cn-controles">
          <button className="cn-boton" onClick={() => { setReproduciendo(false); setIndice(0); }} aria-label="Primer paso">⏮</button>
          <button className="cn-boton" onClick={() => { setReproduciendo(false); setIndice((i) => Math.max(i - 1, 0)); }} aria-label="Paso anterior">◀</button>
          <button
            className="cn-boton cn-play"
            onClick={() => { if (indice >= ultimo) setIndice(0); setReproduciendo((r) => !r); }}
            aria-label={reproduciendo ? 'Pausa' : 'Reproducir'}
          >
            {reproduciendo ? '⏸' : '▶'}
          </button>
          <button className="cn-boton" onClick={() => { setReproduciendo(false); setIndice((i) => Math.min(i + 1, ultimo)); }} aria-label="Paso siguiente">▶|</button>
          <button className="cn-boton" onClick={() => { setReproduciendo(false); setIndice(ultimo); }} aria-label="Último paso">⏭</button>
          <input
            type="range"
            min={0}
            max={ultimo}
            value={indice}
            onChange={(e) => { setReproduciendo(false); setIndice(Number(e.target.value)); }}
            aria-label="Línea de tiempo de la ejecución"
          />
          <select value={velocidad} onChange={(e) => setVelocidad(Number(e.target.value))} aria-label="Velocidad">
            {VELOCIDADES.map((v) => <option key={v} value={v}>×{v}</option>)}
          </select>
          {indiceExcepcion >= 0 && (
            <button className="cn-boton cn-ir-error" onClick={() => { setReproduciendo(false); setIndice(indiceExcepcion); }}>
              Ir al error
            </button>
          )}
        </footer>
        {traza.error && paso.evento !== 'exception' && indice === ultimo && (
          <p className="cn-aviso error">💥 {traza.error}</p>
        )}
      </div>
    </div>
  );
};

export default CajaNegra;
