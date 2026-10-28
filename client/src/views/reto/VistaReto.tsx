import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import CodeEditor, { lineaDeError } from '../../components/code-editor/CodeEditor';
import VisorMision from '../../components/visor-mision/VisorMision';
import TextoIA from '../../components/texto-ia/TextoIA';
import { formatoDe } from './formatos';
import './VistaReto.css';

const GET_MISION = gql`
  query MisionPorId($id: ID!) {
    iaDisponible
    tarea(id: $id) {
      id
      tipo
      titulo
      descripcion
      codigoBase
      resultadoEsperado
      puntosBase
      mision {
        id
        formato
        funcion
        escenarios
        ocultos
        material
      }
    }
  }
`;

const CAMPOS_RESULTADO = `
  estrellas
  superados
  total
  escenarios {
    nombre
    oculto
    exito
    motivo
    ticks
    estrellas
    metricas
    fotogramas
    escena
    registro {
      t
      texto
    }
  }
`;

const PROBAR = gql`
  mutation ProbarMision($tareaId: ID!, $codigo: String!, $escenario: Int) {
    probarMision(tareaId: $tareaId, codigo: $codigo, escenario: $escenario) { ${CAMPOS_RESULTADO} }
  }
`;

const ENVIAR = gql`
  mutation EnviarMision($tareaId: ID!, $codigo: String!, $tiempoCompletado: Int!) {
    enviarSolucion(tareaId: $tareaId, codigo: $codigo, tiempoCompletado: $tiempoCompletado) {
      correcto
      yaCompletada
      puntos
      mensaje
      mision { ${CAMPOS_RESULTADO} }
    }
  }
`;

const PEDIR_PISTA = gql`
  mutation PistaMision($tareaId: ID!, $codigo: String!, $salida: String, $nivel: Int) {
    pedirPista(tareaId: $tareaId, codigo: $codigo, salida: $salida, nivel: $nivel) {
      pista
      nivel
      restantesHoy
    }
  }
`;

interface VistaRetoProps {
  tareaId: string;
  onBack: () => void;
}

const NOMBRES_METRICAS: Record<string, string> = {
  velocidad_impacto: 'Impacto (m/s)',
  combustible_restante: 'Combustible restante (%)',
  segundos: 'Segundos',
  maniobras: 'Maniobras',
  minimo_maniobras: 'Mínimo posible',
  movimientos: 'Movimientos',
  optimo: 'Óptimo',
  limite: 'Límite',
  choques: 'Choques',
  intentos: 'Intentos',
  aciertos: 'Aciertos',
  total: 'Total',
  celdas_bien: 'Celdas correctas',
  celdas: 'Celdas en total',
};

const estrellasTexto = (n: number) => '⭐'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));

// Borrador del código por misión o reto (comodidad del navegador: si falla, no pasa nada).
// Se guarda con una firma de la tarea (título + código base): si con el mismo id aparece otra
// tarea (base de datos recreada, reto cambiado), el borrador viejo se ignora.
interface TareaBorrador { id: string; titulo: string; codigoBase?: string | null }
const claveBorrador = (id: string) => `astrocode-mision-${id}`;
const firmaTarea = (tarea: TareaBorrador) => {
  const texto = `${tarea.titulo}\n${tarea.codigoBase || ''}`;
  let hash = 5381;
  for (let i = 0; i < texto.length; i++) hash = ((hash * 33) ^ texto.charCodeAt(i)) >>> 0;
  return hash.toString(36);
};
const leerBorrador = (tarea: TareaBorrador): string | null => {
  try {
    const guardado = localStorage.getItem(claveBorrador(tarea.id));
    if (!guardado) return null;
    const { firma, codigo } = JSON.parse(guardado);
    return firma === firmaTarea(tarea) && typeof codigo === 'string' ? codigo : null;
  } catch {
    // Sin almacenamiento o borrador antiguo (texto sin firma): se descarta
    return null;
  }
};
const guardarBorrador = (tarea: TareaBorrador, codigo: string) => {
  try {
    localStorage.setItem(claveBorrador(tarea.id), JSON.stringify({ firma: firmaTarea(tarea), codigo }));
  } catch { /* sin almacenamiento */ }
};

// Vista de las tareas que se corrigen simulando escenarios: misiones de pilotaje (fase 2)
// y retos (fase 5). Cada formato aporta su visor y su material (ver formatos.tsx).
const VistaReto: React.FC<VistaRetoProps> = ({ tareaId, onBack }) => {
  const { data, loading, error } = useQuery(GET_MISION, { variables: { id: tareaId } });
  const tarea = data?.tarea;
  const esPilotaje = !tarea?.mision || tarea.mision.formato === 'pilotaje';
  const formato = formatoDe(tarea?.mision?.formato || 'pilotaje');
  const material = useMemo(() => (tarea?.mision?.material ? JSON.parse(tarea.mision.material) : null), [tarea]);
  const [pestana, setPestana] = useState<'enunciado' | 'material'>('enunciado');
  // Línea del material a la que pide saltar el visor (el impostor enlaza con su línea del registro)
  const [focoMaterial, setFocoMaterial] = useState<{ escenario: string; linea: number; n: number } | null>(null);
  const [codigo, setCodigo] = useState('');
  const [escenario, setEscenario] = useState(0);
  const [resultado, setResultado] = useState<any>(null);
  const [vista, setVista] = useState(0);              // escenario del resultado que se ve en el visor
  const [idVuelo, setIdVuelo] = useState(0);
  const [tickActual, setTickActual] = useState(0);
  const [modo, setModo] = useState<'probar' | 'enviar' | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [completado, setCompletado] = useState<{ puntos: number; estrellas: number } | null>(null);
  const [pista, setPista] = useState<{ texto: string; nivel: number } | null>(null);
  const [nivelPista, setNivelPista] = useState(1);
  const [inicio] = useState(() => Date.now());

  const [probar] = useMutation(PROBAR);
  const [enviar] = useMutation(ENVIAR, { refetchQueries: ['GetUserStats', 'TareasCompletadas', 'GetTopUsers', 'GetCurrentUser'] });
  const [pedirPista, { loading: pidiendo }] = useMutation(PEDIR_PISTA);

  useEffect(() => {
    if (tarea) setCodigo(leerBorrador(tarea) ?? tarea.codigoBase ?? '');
  }, [tarea]);

  const cambiarCodigo = (nuevo: string) => {
    setCodigo(nuevo);
    if (tarea) guardarBorrador(tarea, nuevo);
  };

  const errorDe = (e: any) => e.graphQLErrors?.[0]?.message || e.message;

  const mostrar = (r: any) => {
    setResultado(r);
    const primeroVisible = r.escenarios.findIndex((e: any) => !e.oculto);
    setVista(Math.max(primeroVisible, 0));
    setIdVuelo((v) => v + 1);
    setTickActual(0);
  };

  const lanzar = async () => {
    setModo('probar');
    setMensaje(null);
    try {
      const { data: res } = await probar({ variables: { tareaId, codigo, escenario } });
      mostrar(res.probarMision);
    } catch (e) {
      setMensaje({ tipo: 'error', texto: errorDe(e) });
    } finally {
      setModo(null);
    }
  };

  const enviarSolucion = async () => {
    setModo('enviar');
    setMensaje(null);
    try {
      const { data: res } = await enviar({
        variables: { tareaId, codigo, tiempoCompletado: Math.round((Date.now() - inicio) / 1000) },
      });
      const r = res.enviarSolucion;
      mostrar(r.mision);
      if (r.correcto) {
        setMensaje({ tipo: 'ok', texto: r.yaCompletada ? '¡Misión superada otra vez! (ya la tenías completada, no suma puntos)' : r.mensaje });
        if (!r.yaCompletada) setCompletado({ puntos: r.puntos, estrellas: r.mision.estrellas });
      } else {
        setMensaje({ tipo: 'error', texto: r.mensaje });
      }
    } catch (e) {
      setMensaje({ tipo: 'error', texto: errorDe(e) });
    } finally {
      setModo(null);
    }
  };

  const escenarioVisto = resultado?.escenarios[vista];
  const fotogramas = useMemo(() => (escenarioVisto?.fotogramas ? JSON.parse(escenarioVisto.fotogramas) : null), [escenarioVisto]);
  const escena = useMemo(() => (escenarioVisto?.escena ? JSON.parse(escenarioVisto.escena) : null), [escenarioVisto]);
  const metricas = useMemo(() => (escenarioVisto?.metricas ? JSON.parse(escenarioVisto.metricas) : null), [escenarioVisto]);
  const lineaError = escenarioVisto && !escenarioVisto.exito ? lineaDeError(escenarioVisto.motivo) : null;
  const alCambiarTick = useCallback((t: number) => setTickActual(t), []);
  const irAMaterial = useCallback((linea: number) => {
    if (!escenarioVisto) return;
    setFocoMaterial({ escenario: escenarioVisto.nombre, linea, n: Date.now() });
    setPestana('material');
  }, [escenarioVisto]);

  const pedir = async () => {
    try {
      const salida = resultado?.escenarios.map((e: any) => `${e.nombre}: ${e.motivo}`).join('\n') || null;
      const { data: res } = await pedirPista({ variables: { tareaId, codigo, salida, nivel: nivelPista } });
      setPista({ texto: res.pedirPista.pista, nivel: res.pedirPista.nivel });
      setNivelPista(Math.min(res.pedirPista.nivel + 1, 3));
    } catch (e) {
      setPista({ texto: errorDe(e), nivel: 0 });
    }
  };

  if (loading) return <div className="mision-cargando">Preparando la simulación...</div>;
  if (error || !tarea?.mision) {
    return (
      <div className="mision-cargando">
        <p>No se pudo cargar {tarea?.tipo === 'reto' ? 'el reto' : 'la misión'}.</p>
        <button className="mision-boton" onClick={onBack}>Volver</button>
      </div>
    );
  }

  return (
    <div className="mision-pagina">
      <header className="mision-cabecera">
        <button className="mision-boton secundario" onClick={onBack}>← Volver</button>
        <h1>{tarea.titulo}</h1>
        {!esPilotaje && <span className="mision-formato">{formato.etiqueta}</span>}
        <span className="mision-puntos">{tarea.puntosBase} pts</span>
      </header>

      <main className="mision-cuerpo">
        <section className="mision-izquierda">
          {esPilotaje ? (
            <details className="mision-enunciado" open>
              <summary>📋 Briefing de la misión</summary>
              <p>{tarea.descripcion}</p>
              {tarea.resultadoEsperado && <p className="mision-objetivo">🎯 {tarea.resultadoEsperado}</p>}
            </details>
          ) : (
            <div className="mision-enunciado reto">
              <div className="mision-pestanas" role="tablist">
                <button role="tab" aria-selected={pestana === 'enunciado'} className={pestana === 'enunciado' ? 'activa' : ''}
                  onClick={() => setPestana('enunciado')}>📜 Reto</button>
                {material && (
                  <button role="tab" aria-selected={pestana === 'material'} className={pestana === 'material' ? 'activa' : ''}
                    onClick={() => { setFocoMaterial(null); setPestana('material'); }}>{formato.tituloMaterial}</button>
                )}
              </div>
              {pestana === 'material' && material ? (
                <div className="mision-material" role="tabpanel"><formato.Material material={material} foco={focoMaterial} /></div>
              ) : (
                <div role="tabpanel">
                  <p>{tarea.descripcion}</p>
                  {tarea.resultadoEsperado && <p className="mision-objetivo">🎯 {tarea.resultadoEsperado}</p>}
                </div>
              )}
            </div>
          )}

          <div className="mision-editor">
            <CodeEditor value={codigo} onChange={cambiarCodigo} onRun={() => !modo && lanzar()} lineaError={lineaError} />
          </div>

          <div className="mision-acciones">
            <label className="mision-escenario">
              Escenario
              <select value={escenario} onChange={(e) => setEscenario(Number(e.target.value))}>
                {tarea.mision.escenarios.map((nombre: string, i: number) => (
                  <option key={nombre} value={i}>{nombre}</option>
                ))}
              </select>
            </label>
            <button className="mision-boton lanzar" onClick={lanzar} disabled={!!modo} title="Ctrl+Enter">
              {modo === 'probar' ? 'Simulando...' : formato.probar}
            </button>
            <button className="mision-boton enviar" onClick={enviarSolucion} disabled={!!modo}>
              {modo === 'enviar' ? 'Corrigiendo...' : `📡 Enviar (${tarea.mision.escenarios.length + tarea.mision.ocultos} escenarios)`}
            </button>
            {data.iaDisponible && (
              <button className="mision-boton pista" onClick={pedir} disabled={pidiendo}>
                {pidiendo ? 'Pensando...' : `💡 Pista ${nivelPista}/3`}
              </button>
            )}
            <button className="mision-boton secundario" onClick={() => cambiarCodigo(tarea.codigoBase)} title="Volver al código inicial">
              Reiniciar código
            </button>
          </div>

          {mensaje && <p className={`mision-mensaje ${mensaje.tipo}`} role="status">{mensaje.texto}</p>}
          {pista && (
            <div className="mision-pista">
              <strong>🤖 AstroTutor{pista.nivel ? ` · pista ${pista.nivel}/3` : ''}</strong>
              <TextoIA texto={pista.texto} />
            </div>
          )}
        </section>

        <section className="mision-derecha">
          {fotogramas && escena && esPilotaje ? (
            <VisorMision
              mision={tarea.mision.id}
              escena={escena}
              fotogramas={fotogramas}
              exito={escenarioVisto.exito}
              idVuelo={idVuelo * 100 + vista}
              onTick={alCambiarTick}
            />
          ) : fotogramas && escena ? (
            <formato.Visor
              escena={escena}
              fotogramas={fotogramas}
              exito={escenarioVisto.exito}
              idVuelo={idVuelo * 100 + vista}
              onTick={alCambiarTick}
              escenario={escenarioVisto.nombre}
              irAMaterial={irAMaterial}
            />
          ) : (
            <div className="mision-espera">
              {escenarioVisto
                ? <p>❌ {escenarioVisto.motivo}</p>
                : esPilotaje
                  ? <p>Escribe tu función <code>piloto(sensores)</code> y pulsa <strong>🚀 Lanzar</strong> para ver el vuelo.</p>
                  : <p>Escribe tu función <code>{tarea.mision.funcion}()</code> y pulsa <strong>{formato.probar}</strong> para ver qué hace.</p>}
            </div>
          )}

          {resultado && (
            <div className="mision-resultados">
              <div className="mision-resumen">
                <span>{resultado.superados}/{resultado.total} escenarios superados</span>
                {resultado.superados === resultado.total && <span className="mision-estrellas" aria-label={`${resultado.estrellas} estrellas`}>{estrellasTexto(resultado.estrellas)}</span>}
              </div>
              <ul className="mision-escenarios">
                {resultado.escenarios.map((e: any, i: number) => (
                  <li key={i}>
                    <button
                      className={`mision-escenario-item ${i === vista ? 'activo' : ''}`}
                      onClick={() => { if (!e.oculto) { setVista(i); setIdVuelo((v) => v + 1); } }}
                      disabled={e.oculto}
                      title={e.oculto ? 'Escenario oculto: no se puede ver' : 'Ver este escenario'}
                    >
                      <span>{e.exito ? '✅' : '❌'} {e.oculto ? '🔒 Escenario oculto' : e.nombre}</span>
                      <span className="mision-motivo">{e.motivo}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {metricas && (
                <dl className="mision-metricas">
                  {Object.entries(metricas).map(([k, v]) => (
                    <div key={k}><dt>{NOMBRES_METRICAS[k] || k}</dt><dd>{String(v)}</dd></div>
                  ))}
                </dl>
              )}
              {escenarioVisto?.registro?.length > 0 && (
                <div className="mision-registro">
                  <h3>{esPilotaje ? '📟 Registro de vuelo (tus print)' : '📟 Registro (tus print)'}</h3>
                  <ol>
                    {escenarioVisto.registro.map((r: any, i: number) => (
                      <li key={i} className={r.t <= tickActual ? 'pasado' : ''}>
                        <span className="mision-registro-tick">t={r.t}</span> {r.texto.trimEnd()}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {completado && (
        <div className="mision-modal" role="dialog" aria-modal="true" aria-labelledby="mision-modal-titulo">
          <div className="mision-modal-caja">
            <h2 id="mision-modal-titulo">{formato.exito}</h2>
            <p className="mision-estrellas grande">{estrellasTexto(completado.estrellas)}</p>
            <p>Has ganado <strong>{completado.puntos} puntos</strong>.</p>
            {completado.estrellas < 3 && <p className="mision-nota">Puedes seguir mejorando tu código para conseguir más estrellas (volver a enviarlo ya no suma puntos).</p>}
            <div className="mision-modal-botones">
              <button className="mision-boton secundario" onClick={() => setCompletado(null)}>{esPilotaje ? 'Ver los vuelos' : 'Ver los escenarios'}</button>
              <button className="mision-boton lanzar" onClick={onBack}>Volver al mapa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaReto;
