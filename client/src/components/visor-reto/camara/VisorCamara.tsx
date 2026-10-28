import React, { useEffect, useMemo, useState } from 'react';
import { PropsVisor } from '../VisorGenerico';
import './Camara.css';

const MS_POR_INTENTO = 550;
const MS_RODILLO = 1600;

const formatear = (n: number) => n.toLocaleString('es-ES');

// Cuántos pasos de la animación se han mostrado (con prefers-reduced-motion, todos de golpe)
function useAvance(total: number, msPorPaso: number, idVuelo: number) {
  const reducido = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );
  const [hechos, setHechos] = useState(0);
  useEffect(() => {
    if (reducido || total === 0) {
      setHechos(total);
      return;
    }
    setHechos(0);
    const t: ReturnType<typeof setInterval> = setInterval(() => {
      setHechos((h) => {
        if (h + 1 >= total) clearInterval(t);
        return Math.min(h + 1, total);
      });
    }, msPorPaso);
    return () => clearInterval(t);
  }, [total, msPorPaso, idVuelo, reducido]);
  return hechos;
}

const Puerta: React.FC<{ abierta: boolean; terminado: boolean }> = ({ abierta, terminado }) => (
  <div className={`camara-puerta ${terminado ? (abierta ? 'abierta' : 'alarma') : ''}`} aria-hidden="true">
    <div className="camara-hoja">
      <div className="camara-volante">✦</div>
    </div>
    {terminado && abierta && <div className="camara-oro">💰💎🪙</div>}
  </div>
);

// ---------- C1: fuerza bruta con huellas ----------
const Rodillo: React.FC<{ escena: any; final: any; idVuelo: number }> = ({ escena, final, idVuelo }) => {
  // El rodillo solo recorre los candidatos si el alumno dio con el PIN: si no, enseña su respuesta fallida
  const acierto = !!final?.pin && final?.respuesta === final?.pin;
  const total: number = acierto ? final.probados : 0;
  const pasos = acierto ? 40 : 1;
  const hechos = useAvance(pasos, MS_RODILLO / pasos, idVuelo);
  // Avanza deprisa al principio y frena al llegar al PIN
  const actual = Math.round(total * (1 - Math.pow(1 - hechos / pasos, 3)));
  const candidato = (i: number): string =>
    escena.candidatos ? escena.candidatos[i] : String(i).padStart(escena.cifras, '0');
  const terminado = hechos >= pasos;
  const filas = [];
  for (let i = Math.max(0, actual - 4); i < actual; i++) filas.push(i);
  const universo = escena.candidatos ? escena.candidatos.length : 10 ** escena.cifras;
  const abierta = terminado && final?.respuesta === final?.pin;

  return (
    <div className="camara-rodillo-zona">
      <Puerta abierta={abierta} terminado={terminado} />
      <div className="camara-rodillo">
        <div className="camara-objetivo">🔒 Huella buscada: <code>{escena.huella.slice(0, 8)}…{escena.huella.slice(-4)}</code></div>
        <ol>
          {!acierto && (
            <li>
              <span className="camara-pin">{final?.respuesta ?? '—'}</span>
              <span>→ huella distinta</span>
              <span>✗ tu respuesta</span>
            </li>
          )}
          {filas.map((i) => {
            const coincide = terminado && i === total - 1 && candidato(i) === final?.pin;
            return (
              <li key={i} className={coincide ? 'coincide' : ''}>
                <span className="camara-pin">{candidato(i)}</span>
                <span>→ {coincide ? <code>{escena.huella.slice(0, 8)}…</code> : 'huella distinta'}</span>
                <span>{coincide ? '✓ COINCIDE' : '✗'}</span>
              </li>
            );
          })}
        </ol>
        <div className="camara-contador">Probados: <strong>{formatear(actual)}</strong> / {formatear(universo)}</div>
      </div>
    </div>
  );
};

// ---------- C2: búsqueda binaria ----------
const Dial: React.FC<{ escena: any; final: any; idVuelo: number }> = ({ escena, final, idVuelo }) => {
  const historial: any[] = final?.historial || [];
  const hechos = useAvance(historial.length, MS_POR_INTENTO, idVuelo);
  const actual = hechos > 0 ? historial[hechos - 1] : null;
  const terminado = hechos >= historial.length;
  const bajo = actual?.bajo ?? escena.minimo;
  const alto = actual?.alto ?? escena.maximo;
  const ancho = escena.maximo - escena.minimo;
  const izquierda = ((bajo - escena.minimo) / ancho) * 100;
  const derecha = ((alto - escena.minimo) / ancho) * 100;
  const flecha = actual?.respuesta === 'mayor' ? '▲ MAYOR' : actual?.respuesta === 'menor' ? '▼ MENOR'
    : actual?.respuesta === 'abierta' ? '🔓 ABIERTA' : actual?.respuesta === 'invalido' ? '⚠ NO VÁLIDO' : '·';

  return (
    <div className="camara-dial-zona">
      <Puerta abierta={terminado && !!final?.abierta} terminado={terminado} />
      <div className="camara-dial-panel">
        <div className="camara-dial" key={hechos}>
          <span className="camara-dial-numero">{actual ? (typeof actual.valor === 'number' ? formatear(actual.valor) : actual.valor) : '—'}</span>
          <span className={`camara-dial-flecha ${actual?.respuesta || ''}`}>{flecha}</span>
        </div>
        <div className="camara-bombillas" aria-label={`${hechos} de ${escena.intentos} intentos`}>
          {Array.from({ length: escena.intentos }, (_, i) => <span key={i} className={i < hechos ? 'usada' : ''} />)}
        </div>
        <div className="camara-rango">
          <div className="camara-rango-barra">
            <span style={{ left: `${izquierda}%`, width: `${Math.max(derecha - izquierda, 0.6)}%` }} />
          </div>
          <div className="camara-rango-texto">
            Rango posible: <strong>{formatear(bajo)} – {formatear(alto)}</strong>
            <small> ({formatear(Math.max(alto - bajo + 1, 0))} {alto === bajo ? 'número' : 'números'})</small>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- C3: combinación ----------
const Fichas: React.FC<{ respuesta: any }> = ({ respuesta }) => {
  if (respuesta === 'abierta') return <span className="camara-fichas">🔓</span>;
  if (respuesta === 'invalido') return <span className="camara-fichas">⚠ no válido</span>;
  return (
    <span className="camara-fichas" aria-label={`${respuesta.exactos} exactos, ${respuesta.descolocados} descolocados`}>
      {'●'.repeat(respuesta.exactos)}{'○'.repeat(respuesta.descolocados)}
      {respuesta.exactos + respuesta.descolocados === 0 && <span className="camara-nada">—</span>}
      <small> {respuesta.exactos} exacto{respuesta.exactos === 1 ? '' : 's'} · {respuesta.descolocados} descolocado{respuesta.descolocados === 1 ? '' : 's'}</small>
    </span>
  );
};

const Combinacion: React.FC<{ escena: any; final: any; idVuelo: number }> = ({ escena, final, idVuelo }) => {
  const historial: any[] = final?.historial || [];
  const hechos = useAvance(historial.length, MS_POR_INTENTO, idVuelo);
  const vistos = historial.slice(0, hechos);
  const terminado = hechos >= historial.length;
  const posibles = vistos.length ? vistos[vistos.length - 1].posibles : escena.combinaciones;

  return (
    <div className="camara-combinacion-zona">
      <Puerta abierta={terminado && !!final?.abierta} terminado={terminado} />
      <div className="camara-combinacion">
        <div className="camara-posibles">Combinaciones aún posibles: <strong>{formatear(posibles)}</strong></div>
        <ol>
          {vistos.map((h, i) => (
            <li key={i}>
              <span className="camara-n">{i + 1}</span>
              <span className="camara-tubos">
                {String(h.valor).replace(/^'|'$/g, '').split('').slice(0, 4).map((d, j) => <span key={j}>{d}</span>)}
              </span>
              <Fichas respuesta={h.respuesta} />
              {h.respuesta !== 'abierta' && <span className="camara-quedan">quedan {formatear(h.posibles)}</span>}
            </li>
          ))}
        </ol>
        <div className="camara-contador">Intentos: <strong>{hechos}</strong> / {escena.intentos}</div>
      </div>
    </div>
  );
};

const VisorCamara: React.FC<PropsVisor> = ({ escena, fotogramas, exito, idVuelo }) => {
  const final = fotogramas[fotogramas.length - 1];
  const secreto = final?.pin ?? final?.secreto;
  return (
    <div className={`camara-visor ${exito ? 'exito' : 'fallo'}`}>
      {escena.variante === 'huella' && <Rodillo escena={escena} final={final} idVuelo={idVuelo} />}
      {escena.variante === 'binaria' && <Dial escena={escena} final={final} idVuelo={idVuelo} />}
      {escena.variante === 'combinacion' && <Combinacion escena={escena} final={final} idVuelo={idVuelo} />}
      {!exito && secreto !== undefined && final?.fase === 'fin' && (
        <p className="camara-revelacion">El código de esta cámara era <strong>{escena.variante === 'binaria' ? formatear(secreto) : secreto}</strong>.</p>
      )}
    </div>
  );
};

export default VisorCamara;
