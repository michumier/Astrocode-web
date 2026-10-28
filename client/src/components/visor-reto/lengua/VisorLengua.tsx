import React, { useEffect, useMemo, useState } from 'react';
import { PropsVisor } from '../VisorGenerico';
import Rejilla from './Rejilla';
import './Lengua.css';

const DURACION_PINTADO = 800; // ms para pintar toda la rejilla

// Visor: Entrada → Tu resultado (se pinta celda a celda) → Esperado, con las diferencias marcadas
const VisorLengua: React.FC<PropsVisor> = ({ escena, fotogramas, exito, idVuelo }) => {
  const final = fotogramas[fotogramas.length - 1];
  const salida: number[][] | undefined = final?.salida;
  const total = salida ? salida.length * (salida[0]?.length || 0) : 0;
  const [pintadas, setPintadas] = useState(0);
  const [numeros, setNumeros] = useState(false);
  const movimientoReducido = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useEffect(() => {
    if (movimientoReducido || !total) {
      setPintadas(total);
      return;
    }
    setPintadas(0);
    const inicio = performance.now();
    let marco = 0;
    const paso = (ahora: number) => {
      const n = Math.min(total, Math.ceil(((ahora - inicio) / DURACION_PINTADO) * total));
      setPintadas(n);
      if (n < total) marco = requestAnimationFrame(paso);
    };
    marco = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(marco);
  }, [idVuelo, total, movimientoReducido]);

  const errores = useMemo(
    () => new Set<string>((final?.diferencias || []).map(([f, c]: number[]) => `${f},${c}`)),
    [final]
  );
  const terminado = pintadas >= total;
  const mismoTamano = salida && salida.length === escena.esperado.length && salida[0]?.length === escena.esperado[0].length;

  return (
    <div className={`lengua-visor ${terminado ? (exito ? 'exito' : 'fallo') : ''}`}>
      <div className="lengua-barra">
        <strong>{terminado ? (exito ? '🛸 Los alienígenas te entienden' : '👾 Los alienígenas no entienden tu respuesta') : 'Traduciendo…'}</strong>
        <label>
          <input type="checkbox" checked={numeros} onChange={(e) => setNumeros(e.target.checked)} /> 🔢 Ver números
        </label>
      </div>
      <div className="lengua-trio">
        <Rejilla celdas={escena.entrada} titulo="1 · Entrada" numeros={numeros} maximo={130} />
        {salida ? (
          <Rejilla celdas={salida} titulo="2 · Tu resultado" numeros={numeros} errores={errores} visibles={pintadas} maximo={130} />
        ) : (
          <div className="lengua-sin-salida">Tu función no devolvió una rejilla</div>
        )}
        <Rejilla celdas={escena.esperado} titulo="3 · Esperado" numeros={numeros} maximo={130} />
      </div>
      {terminado && salida && !exito && (
        <p className="lengua-resumen" role="status">
          {mismoTamano
            ? `${errores.size} celda${errores.size === 1 ? '' : 's'} distinta${errores.size === 1 ? '' : 's'} (con borde magenta).`
            : `Tu rejilla tiene otro tamaño: ${salida.length}×${salida[0]?.length} en lugar de ${escena.esperado.length}×${escena.esperado[0].length}.`}
        </p>
      )}
    </div>
  );
};

export default VisorLengua;
