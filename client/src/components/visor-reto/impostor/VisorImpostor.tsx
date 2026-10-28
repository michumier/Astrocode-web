import React, { useEffect, useMemo, useState } from 'react';
import { PropsVisor } from '../VisorGenerico';
import Plano from './Plano';
import './Impostor.css';

const MS_POR_TRIPULANTE = 1500;
const formatear = (n: number) => n.toLocaleString('es-ES');
const mismo = (a?: string | null, b?: string | null) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

const reducido = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// ---------- I1: quién estaba en la sala en la alerta ----------
const Reactor: React.FC<{ escena: any; final: any; exito: boolean; irAMaterial?: (linea: number) => void }> = ({
  escena, final, exito, irAMaterial,
}) => {
  const tripulantes: any[] = final.tripulantes || [];
  const acusado = tripulantes.find((t) => mismo(t.nombre, final.acusado));
  const ocupantes: Record<string, string[]> = {};
  tripulantes.forEach((t) => (ocupantes[t.sala] = [...(ocupantes[t.sala] || []), t.nombre]));

  return (
    <>
      <div className="impostor-cabecera">
        ⚠ <strong>[{final.hora}] ALERTA SABOTAJE {final.sala}</strong>
        <button className="impostor-enlace" onClick={() => irAMaterial?.(final.linea_alerta)}>línea {formatear(final.linea_alerta)}</button>
      </div>
      <Plano salas={escena.salas} pasillos={escena.pasillos} crimen={final.sala} foco={acusado?.sala ?? null}
        ocupantes={ocupantes} oscuro titulo={`Dónde estaba cada tripulante a las ${final.hora}`} />
      <div className="impostor-fichas">
        {tripulantes.map((t) => {
          const esAcusado = t === acusado;
          return (
            <div key={t.tarjeta} className={`impostor-ficha ${esAcusado ? 'acusada' : ''} ${t.sala === final.sala ? 'en-crimen' : ''}`}>
              <strong>{t.nombre}</strong>
              <small>{t.tarjeta}</small>
              <span>📍 {t.sala}</span>
              <button className="impostor-enlace" onClick={() => irAMaterial?.(t.linea)} title="Ver en el expediente">
                línea {formatear(t.linea)}
              </button>
              {esAcusado && <span className="impostor-sello">ACUSADO</span>}
            </div>
          );
        })}
      </div>
      {!exito && acusado && (
        <p className="impostor-veredicto mal">
          ❌ {acusado.nombre} estaba en el <strong>{acusado.sala}</strong> en la alerta{' '}
          <button className="impostor-enlace" onClick={() => irAMaterial?.(acusado.linea)}>(línea {formatear(acusado.linea)})</button>
        </p>
      )}
    </>
  );
};

// ---------- I2: quién pudo ir y volver durante el apagón ----------
const Apagon: React.FC<{ escena: any; final: any; idVuelo: number }> = ({ escena, final, idVuelo }) => {
  const tripulantes: any[] = useMemo(() => final.tripulantes || [], [final.tripulantes]);
  // Se repasa a cada tripulante y se termina en el culpable; luego se puede elegir a mano
  const orden = useMemo(() => {
    const otros = tripulantes.filter((t) => t.nombre !== final.culpable);
    return [...otros, ...tripulantes.filter((t) => t.nombre === final.culpable)];
  }, [tripulantes, final.culpable]);
  const [elegido, setElegido] = useState<string | null>(null);
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    setElegido(null);
    if (reducido()) {
      setPaso(orden.length - 1);
      return;
    }
    setPaso(0);
    const t: ReturnType<typeof setInterval> = setInterval(() => {
      setPaso((p) => {
        if (p + 1 >= orden.length - 1) clearInterval(t);
        return Math.min(p + 1, orden.length - 1);
      });
    }, MS_POR_TRIPULANTE);
    return () => clearInterval(t);
  }, [idVuelo, orden.length]);

  const actual = tripulantes.find((t) => t.nombre === elegido) || orden[paso];
  const idaOk = (t: any) => t.ida <= final.ida_max;
  const vueltaOk = (t: any) => t.vuelta <= final.vuelta_max;
  const rutas = actual ? [
    { salas: actual.ruta_ida, tipo: 'ida' as const, ok: idaOk(actual) },
    { salas: actual.ruta_vuelta, tipo: 'vuelta' as const, ok: vueltaOk(actual) },
  ] : [];

  return (
    <>
      <div className="impostor-linea-tiempo">
        <span>🔌 <strong>{final.apagado}</strong> apagón</span>
        <span className="impostor-tramo">ida ≤ {final.ida_max} min</span>
        <span>⚠ <strong>{final.crimen}</strong> {final.sala}</span>
        <span className="impostor-tramo">vuelta ≤ {final.vuelta_max} min</span>
        <span>💡 <strong>{final.restaurado}</strong> recuento</span>
      </div>
      <Plano key={`${idVuelo}-${actual?.nombre}`} salas={escena.salas} pasillos={escena.pasillos} crimen={final.sala}
        rutas={rutas} titulo="Estación deducida del registro"
        ocupantes={actual ? { [actual.antes]: [`${actual.nombre} (antes)`], ...(actual.despues !== actual.antes ? { [actual.despues]: ['(después)'] } : {}) } : {}} />
      <p className="impostor-leyenda">Cada pasillo son 2 minutos. <span className="ida">━ ida</span> · <span className="vuelta">━ vuelta</span></p>
      <table className="impostor-tabla">
        <thead>
          <tr><th>Tripulante</th><th>Antes → después</th><th>Ida</th><th>Vuelta</th><th>¿Pudo?</th></tr>
        </thead>
        <tbody>
          {tripulantes.map((t) => (
            <tr key={t.tarjeta} className={`${t === actual ? 'actual' : ''} ${t.pudo ? 'pudo' : ''} ${mismo(t.nombre, final.acusado) ? 'acusada' : ''}`}
              onClick={() => setElegido(t.nombre)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setElegido(t.nombre)}>
              <td><strong>{t.nombre}</strong>{mismo(t.nombre, final.acusado) && <span className="impostor-sello mini">ACUSADO</span>}</td>
              <td>{t.antes} → {t.despues}</td>
              <td className={idaOk(t) ? 'ok' : 'mal'}>{t.ida} min {idaOk(t) ? `≤ ${final.ida_max} ✓` : `> ${final.ida_max} ✗`}</td>
              <td className={vueltaOk(t) ? 'ok' : 'mal'}>{t.vuelta} min {vueltaOk(t) ? `≤ ${final.vuelta_max} ✓` : `> ${final.vuelta_max} ✗`}</td>
              <td>{t.pudo ? '✅ Sí' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

const VisorImpostor: React.FC<PropsVisor> = ({ escena, fotogramas, exito, idVuelo, irAMaterial }) => {
  const final = fotogramas[fotogramas.length - 1];
  if (!final || final.fase !== 'fin') {
    return <div className="impostor-visor fallo"><p>La investigación no llegó a terminar.</p></div>;
  }
  return (
    <div className={`impostor-visor ${exito ? 'exito' : 'fallo'}`}>
      {escena.variante === 'apagon'
        ? <Apagon escena={escena} final={final} idVuelo={idVuelo} />
        : <Reactor escena={escena} final={final} exito={exito} irAMaterial={irAMaterial} />}
      {exito ? (
        <p className="impostor-veredicto ok">✅ Confesión obtenida: <strong>{final.culpable}</strong> era el impostor.</p>
      ) : (
        <p className="impostor-veredicto revelacion">
          {final.acusado ? <>Acusaste a «{final.acusado}». </> : <>No acusaste a nadie. </>}
          El impostor era <strong>{final.culpable}</strong>.
        </p>
      )}
    </div>
  );
};

export default VisorImpostor;
