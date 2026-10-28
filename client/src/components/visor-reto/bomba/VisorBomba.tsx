import React, { useEffect, useMemo, useState } from 'react';
import { PropsVisor } from '../VisorGenerico';
import { Cable, BotonBomba, TeclaBomba } from './piezas';
import './Bomba.css';

const MS_POR_PASO = 750;

// Pasos de la animación: cada corte, luego el botón y las teclas (B2), y al final el resultado
interface Paso {
  modulo: 'cables' | 'boton' | 'teclado';
  valor: any;
}

const pasosDe = (respuesta: any, variante: string): Paso[] => {
  if (!respuesta) return [];
  if (variante === 'cables') return (respuesta as number[]).map((c) => ({ modulo: 'cables', valor: c }));
  return [
    ...respuesta.cables.map((c: number) => ({ modulo: 'cables' as const, valor: c })),
    { modulo: 'boton', valor: respuesta.boton },
    ...respuesta.teclado.map((s: string) => ({ modulo: 'teclado' as const, valor: s })),
  ];
};

const VisorBomba: React.FC<PropsVisor> = ({ escena, fotogramas, exito, idVuelo }) => {
  const { bomba, variante } = escena;
  const final = fotogramas[fotogramas.length - 1];
  const pasos = useMemo(() => pasosDe(final?.respuesta, variante), [final, variante]);
  const movimientoReducido = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );
  // Cuántos pasos se han mostrado ya (pasos.length + 1 = resultado visible)
  const [hechos, setHechos] = useState(0);

  useEffect(() => {
    if (movimientoReducido) {
      setHechos(pasos.length + 1);
      return;
    }
    setHechos(0);
    const temporizadores = Array.from({ length: pasos.length + 1 }, (_, i) =>
      setTimeout(() => setHechos(i + 1), 600 + i * MS_POR_PASO)
    );
    return () => temporizadores.forEach(clearTimeout);
  }, [idVuelo, pasos, movimientoReducido]);

  const terminado = hechos > pasos.length;
  const vistos = pasos.slice(0, hechos);
  const cortados = vistos.filter((p) => p.modulo === 'cables').map((p) => p.valor as number);
  const boton = vistos.find((p) => p.modulo === 'boton')?.valor as string | undefined;
  const teclas = vistos.filter((p) => p.modulo === 'teclado').map((p) => p.valor as string);
  const segundos = Math.max(30 - hechos * 3, 0);
  const esperado = final?.esperado;
  const cortesEsperados: number[] = esperado ? (variante === 'cables' ? esperado : esperado.cables) : [];

  return (
    <div className={`bomba-visor ${terminado ? (exito ? 'desactivada' : 'explotada') : ''}`}>
      {terminado && !exito && !movimientoReducido && <div className="bomba-destello" aria-hidden="true" />}
      <div className="bomba-caja">
        <div className="bomba-panel">
          <span className={`bomba-lcd ${terminado && exito ? 'parada' : ''}`} aria-label="Cuenta atrás">
            00:{String(segundos).padStart(2, '0')}
          </span>
          <span className="bomba-serie">SERIE <strong>{bomba.serie}</strong></span>
          {variante === 'modulos' && (
            <span className="bomba-baterias" aria-label={`${bomba.baterias} baterías`}>
              {bomba.baterias === 0 ? 'sin baterías' : '🔋'.repeat(bomba.baterias)}
            </span>
          )}
          <span className={`bomba-led ${terminado ? (exito ? 'verde' : 'rojo') : 'parpadeo'}`} aria-hidden="true" />
        </div>

        <div className={variante === 'modulos' ? 'bomba-modulos' : ''}>
          <section className="bomba-modulo" aria-label="Módulo de cables">
            {variante === 'modulos' && <h4>Cables</h4>}
            <svg className="bomba-cables" viewBox={`0 0 320 ${bomba.cables.length * 34 + 10}`} role="img"
              aria-label={`Cables: ${bomba.cables.join(', ')}`}>
              {bomba.cables.map((color: string, i: number) => (
                <Cable key={i} indice={i} color={color} y={22 + i * 34}
                  cortado={cortados.includes(i)}
                  ultimoCorte={cortados[cortados.length - 1] === i && !terminado}
                  debiaCortarse={terminado && !exito && cortesEsperados.includes(i) && !cortados.includes(i)} />
              ))}
            </svg>
          </section>

          {variante === 'modulos' && (
            <>
              <section className="bomba-modulo" aria-label="Módulo del botón">
                <h4>Botón</h4>
                <BotonBomba boton={bomba.boton} accion={boton} />
              </section>
              <section className="bomba-modulo" aria-label="Módulo del teclado">
                <h4>Teclado</h4>
                <div className="bomba-teclado">
                  {bomba.teclado.map((s: string) => (
                    <TeclaBomba key={s} simbolo={s} orden={teclas.indexOf(s)} />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {terminado && (
        <div className={`bomba-resultado ${exito ? 'ok' : 'error'}`} role="status">
          <strong>{exito ? '💚 Bomba desactivada' : '💥 ¡BOOM!'}</strong>
          {!exito && final?.explicacion && <p>{final.explicacion}</p>}
          {!exito && final?.fase !== 'fin' && <p>Tu función falló antes de cortar nada: mira el motivo en la lista de escenarios.</p>}
        </div>
      )}
    </div>
  );
};

export default VisorBomba;
