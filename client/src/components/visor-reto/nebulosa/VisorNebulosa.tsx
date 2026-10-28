import React, { useEffect, useMemo, useState } from 'react';
import { PropsVisor } from '../VisorGenerico';
import { PALETA } from '../paleta';
import Lienzo from './Lienzo';
import './Nebulosa.css';

const MS_ESCANER = 1000;
const formatear = (n: number) => n.toLocaleString('es-ES', { maximumFractionDigits: 1 });
const nombre = (c?: string) => (c === undefined ? '—' : PALETA[Number(c)]?.nombre ?? c);

const VisorNebulosa: React.FC<PropsVisor> = ({ escena, fotogramas, exito, idVuelo }) => {
  const { ancho, alto, objetivo } = escena;
  const imagen: string = fotogramas[fotogramas.length - 1]?.imagen || '';
  const [filas, setFilas] = useState(alto);
  const [diferencias, setDiferencias] = useState(false);
  const [pixel, setPixel] = useState<{ x: number; y: number } | null>(null);

  // La imagen se imprime fila a fila, como un escáner (con «reducir movimiento», de golpe)
  useEffect(() => {
    setDiferencias(false);
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setFilas(alto);
      return;
    }
    const inicio = performance.now();
    let marco = 0;
    const paso = (ahora: number) => {
      const hechas = Math.min(alto, Math.ceil(((ahora - inicio) / MS_ESCANER) * alto));
      setFilas(hechas);
      if (hechas < alto) marco = requestAnimationFrame(paso);
    };
    setFilas(0);
    marco = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(marco);
  }, [idVuelo, alto]);

  const distintos = useMemo(() => Array.from(objetivo as string, (c, i) => imagen[i] !== c), [objetivo, imagen]);
  const malos = distintos.filter(Boolean).length;
  const completa = imagen.length === objetivo.length;
  const porcentaje = completa ? (100 * (objetivo.length - malos)) / objetivo.length : 0;
  const i = pixel ? pixel.y * ancho + pixel.x : -1;

  return (
    <div className={`nebulosa-visor ${exito ? 'exito' : 'fallo'}`}>
      <div className="nebulosa-lienzos">
        <Lienzo imagen={objetivo} ancho={ancho} alto={alto} titulo="🎯 Objetivo" onPixel={setPixel} />
        <Lienzo imagen={imagen} ancho={ancho} alto={alto} titulo="🖌️ Tu nebulosa" filas={filas}
          distintos={distintos} marcar={diferencias} onPixel={setPixel} />
      </div>

      <div className="nebulosa-panel">
        <div className="nebulosa-coincidencia" aria-label={`Coincidencia: ${formatear(porcentaje)} %`}>
          <span>Coincidencia</span>
          <div className="nebulosa-barra"><span style={{ width: `${filas >= alto ? porcentaje : 0}%` }} /></div>
          <strong>{completa ? `${formatear(porcentaje)} %` : 'incompleta'}</strong>
        </div>
        <button className="nebulosa-boton" onClick={() => setDiferencias((d) => !d)} disabled={!malos} aria-pressed={diferencias}>
          {diferencias ? '🙈 Ocultar diferencias' : `👁 Ver diferencias${malos ? ` (${malos})` : ''}`}
        </button>
        <p className="nebulosa-pixel" aria-live="polite">
          {pixel
            ? <>(x={pixel.x}, y={pixel.y}) · tú: <strong>{nombre(imagen[i])}</strong> · objetivo: <strong>{nombre(objetivo[i])}</strong></>
            : 'Pasa el ratón por un píxel para ver sus coordenadas y sus colores.'}
        </p>
      </div>
    </div>
  );
};

export default VisorNebulosa;
