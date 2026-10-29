import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import CodeEditor, { lineaDeError } from '../../components/code-editor/CodeEditor';
import VisorMision from '../../components/visor-mision/VisorMision';
import { Bot, ChevronLeft, CircleCheck, CircleX, Lightbulb, Lock, RotateCcw, Send, X } from 'lucide-react';
import TextoIA from '../../components/texto-ia/TextoIA';
import Enunciado from '../../components/enunciado/Enunciado';
import { Aviso, Boton, Calificacion, Enhorabuena, Etiqueta } from '../../components/ui';
import { formatoDe } from './formatos';
import { limpiarTitulo } from '../../utils/tareas';
import './VistaReto.css';

export const GET_MISION = gql`
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
  pixeles: 'Píxeles en total',
  porcentaje: 'Coincidencia (%)',
  generacion: 'Generación en que se cubrió',
};

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
  // ok: superado · mal: corregido pero no pasa · error: no se pudo ejecutar
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'mal' | 'error'; texto: string } | null>(null);
  const [completado, setCompletado] = useState<{ puntos: number; estrellas: number } | null>(null);
  const [pista, setPista] = useState<{ texto: string; nivel: number } | null>(null);
  const [nivelPista, setNivelPista] = useState(1);
  const [inicio] = useState(() => Date.now());
  const accionesRef = useRef<HTMLDivElement>(null);

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
        setMensaje({ tipo: 'mal', texto: r.mensaje });
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

  // Al cerrar la enhorabuena el foco vuelve a «Enviar»
  const cerrarPremio = () => {
    setCompletado(null);
    setTimeout(() => accionesRef.current?.querySelector<HTMLButtonElement>('.ui-boton--primario')?.focus(), 0);
  };

  if (loading) return <div className="reto reto--vacio"><p>Preparando la simulación…</p></div>;
  if (error || !tarea?.mision) {
    return (
      <div className="reto reto--vacio">
        <h1>No se pudo cargar {tarea?.tipo === 'reto' ? 'el reto' : 'la misión'}</h1>
        <Boton variante="primario" onClick={onBack}>Volver al mapa</Boton>
      </div>
    );
  }

  const totalEscenarios = tarea.mision.escenarios.length + tarea.mision.ocultos;
  const conMaterial = !esPilotaje && !!material;
  const verMaterial = conMaterial && pestana === 'material';
  const funcion = esPilotaje ? 'piloto(sensores)' : `${tarea.mision.funcion}()`;
  const { IconoProbar, IconoMaterial } = formato;

  return (
    <div className="reto">
      <header className="reto__barra">
        <Boton variante="fantasma" onClick={onBack} icono={<ChevronLeft size={18} aria-hidden="true" />} className="reto__volver">Mapa</Boton>
        <span className="reto__miga">{esPilotaje ? 'Misión de pilotaje' : `Reto · ${formato.etiqueta}`}</span>
        <Etiqueta>{tarea.puntosBase} pts</Etiqueta>
        <Etiqueta tono="turquesa">{totalEscenarios} escenarios</Etiqueta>
        {data.iaDisponible && (
          <div className="reto__barra-der">
            <Boton variante="secundario" onClick={pedir} cargando={pidiendo}
              icono={<Lightbulb size={18} aria-hidden="true" />} title="El tutor de IA te da una pista sin decirte la solución">
              {pidiendo ? 'Pensando…' : `Pista ${nivelPista} de 3`}
            </Boton>
          </div>
        )}
      </header>

      <main className="reto__cuerpo">
        <section className="reto__izq">
          <article className="reto__enunciado" tabIndex={0} aria-label="Enunciado">
            <h1>{limpiarTitulo(tarea.titulo)}</h1>
            {conMaterial && (
              <div className="reto__pestanas" role="tablist" aria-label="Información del reto">
                <button role="tab" id="reto-pestana-enunciado" aria-selected={!verMaterial} aria-controls="reto-panel"
                  onClick={() => setPestana('enunciado')}>Reto</button>
                <button role="tab" id="reto-pestana-material" aria-selected={verMaterial} aria-controls="reto-panel"
                  onClick={() => { setFocoMaterial(null); setPestana('material'); }}>
                  <IconoMaterial size={16} aria-hidden="true" />{formato.tituloMaterial}
                </button>
              </div>
            )}
            <div id="reto-panel" role={conMaterial ? 'tabpanel' : undefined}
              aria-labelledby={conMaterial ? (verMaterial ? 'reto-pestana-material' : 'reto-pestana-enunciado') : undefined}>
              {verMaterial ? (
                <div className="reto__material">
                  <h2 className="ac-oculto">{formato.tituloMaterial}</h2>
                  <formato.Material material={material} foco={focoMaterial} />
                </div>
              ) : (
                <>
                  {tarea.descripcion && <Enunciado texto={tarea.descripcion} />}
                  {tarea.resultadoEsperado && (
                    <section className="reto__objetivo">
                      <h2>Objetivo</h2>
                      <p>{tarea.resultadoEsperado}</p>
                    </section>
                  )}
                </>
              )}
            </div>
            {pista && (
              <section className="reto__tutor" aria-live="polite">
                <span className="reto__tutor-icono"><Bot size={20} aria-hidden="true" /></span>
                <div>
                  <strong>AstroTutor{pista.nivel ? ` · pista ${pista.nivel} de 3` : ''}</strong>
                  <TextoIA texto={pista.texto} />
                </div>
                <Boton variante="fantasma" tamano="peq" soloIcono aria-label="Cerrar la pista" onClick={() => setPista(null)} icono={<X size={16} aria-hidden="true" />} />
              </section>
            )}
          </article>

          <div className="reto__editor">
            <div className="reto__editor-barra">
              <span className="reto__pestana">{funcion}</span>
              <div className="reto__acciones" ref={accionesRef}>
                <Boton variante="fantasma" soloIcono onClick={() => cambiarCodigo(tarea.codigoBase)} icono={<RotateCcw size={18} aria-hidden="true" />}
                  aria-label="Volver al código inicial" title="Volver al código inicial" />
                <label className="reto__escenario">
                  <span className="ac-oculto">Escenario que se prueba</span>
                  <select value={escenario} onChange={(e) => setEscenario(Number(e.target.value))}>
                    {tarea.mision.escenarios.map((nombre: string, i: number) => (
                      <option key={nombre} value={i}>{nombre}</option>
                    ))}
                  </select>
                </label>
                <Boton variante="secundario" onClick={lanzar} disabled={!!modo && modo !== 'probar'} cargando={modo === 'probar'}
                  icono={<IconoProbar size={18} aria-hidden="true" />} title="Prueba el escenario elegido (Ctrl+Enter)">
                  {modo === 'probar' ? 'Simulando…' : formato.probar}
                </Boton>
                <Boton variante="primario" onClick={enviarSolucion} disabled={!!modo && modo !== 'enviar'} cargando={modo === 'enviar'}
                  icono={<Send size={16} aria-hidden="true" />} title={`Corrige tu código en los ${totalEscenarios} escenarios, también los ocultos`}>
                  {modo === 'enviar' ? 'Corrigiendo…' : 'Enviar'}
                </Boton>
              </div>
            </div>
            <div className="reto__codigo">
              <CodeEditor value={codigo} onChange={cambiarCodigo} onRun={() => !modo && lanzar()} lineaError={lineaError} />
            </div>
          </div>

          <div aria-live="polite">
            {mensaje && (
              mensaje.tipo === 'ok' ? <Aviso tono="exito" titulo={formato.exito}>{mensaje.texto}</Aviso>
                : mensaje.tipo === 'mal' ? <Aviso tono="atencion" titulo="Todavía no">{mensaje.texto}</Aviso>
                  : <Aviso tono="error" titulo="No se pudo completar">{mensaje.texto}</Aviso>
            )}
          </div>
        </section>

        <section className="reto__der" aria-labelledby="reto-simulacion">
          <h2 id="reto-simulacion" className="ac-oculto">Simulación</h2>
          <div className="reto__visor">
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
              <div className={`reto__espera${escenarioVisto ? ' mal' : ''}`}>
                {escenarioVisto ? (
                  <><CircleX size={28} aria-hidden="true" /><p>{escenarioVisto.motivo}</p></>
                ) : (
                  <>
                    <IconoProbar size={32} aria-hidden="true" />
                    <p>
                      Escribe tu función <code>{funcion}</code> y pulsa <strong>{formato.probar}</strong> para {esPilotaje ? 'ver el vuelo' : 'ver qué hace'}.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {resultado && (
            <div className="reto__resultados">
              <div className="reto__resultados-cabecera">
                <h2>Escenarios</h2>
                <span className={`reto__marcador ${resultado.superados === resultado.total ? 'ok' : 'mal'}`}>
                  {resultado.superados === resultado.total ? <CircleCheck size={16} aria-hidden="true" /> : <CircleX size={16} aria-hidden="true" />}
                  {resultado.superados} de {resultado.total} superados
                </span>
                {resultado.superados === resultado.total && <Calificacion estrellas={resultado.estrellas} />}
              </div>
              <ul className="reto__escenarios">
                {resultado.escenarios.map((e: any, i: number) => (
                  <li key={i}>
                    <button
                      className={`reto__escenario-item ${e.exito ? 'ok' : 'mal'}${i === vista ? ' activo' : ''}`}
                      onClick={() => { if (!e.oculto) { setVista(i); setIdVuelo((v) => v + 1); } }}
                      disabled={e.oculto}
                      aria-pressed={e.oculto ? undefined : i === vista}
                      title={e.oculto ? 'Escenario oculto: no se puede ver' : 'Ver este escenario'}
                    >
                      {e.exito ? <CircleCheck size={16} aria-hidden="true" /> : <CircleX size={16} aria-hidden="true" />}
                      <span className="reto__escenario-texto">
                        <span className="reto__escenario-nombre">
                          {e.oculto ? <><Lock size={14} aria-hidden="true" />Escenario oculto</> : e.nombre}
                          <span className="ac-oculto">{e.exito ? ': superado' : ': no superado'}</span>
                        </span>
                        <span className="reto__motivo">{e.motivo}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {metricas && (
                <dl className="reto__metricas">
                  {Object.entries(metricas).map(([k, v]) => (
                    <div key={k}><dt>{NOMBRES_METRICAS[k] || k}</dt><dd>{String(v)}</dd></div>
                  ))}
                </dl>
              )}
              {escenarioVisto?.registro?.length > 0 && (
                <div className="reto__registro">
                  <h3>{esPilotaje ? 'Registro de vuelo' : 'Registro'} <span>(tus print)</span></h3>
                  <ol tabIndex={0} aria-label="Registro de tus print">
                    {escenarioVisto.registro.map((r: any, i: number) => (
                      <li key={i} className={r.t <= tickActual ? 'pasado' : ''}>
                        <span className="reto__registro-tick">t={r.t}</span> {r.texto.trimEnd()}
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
        <Enhorabuena
          titulo={formato.exito}
          subtitulo={limpiarTitulo(tarea.titulo)}
          datos={[
            { valor: `+${completado.puntos}`, etiqueta: 'puntos' },
            { valor: <Calificacion estrellas={completado.estrellas} tamano={24} />, etiqueta: 'estrellas' },
          ]}
          alVolver={onBack}
          alCerrar={cerrarPremio}
          textoCerrar={esPilotaje ? 'Ver los vuelos' : 'Ver los escenarios'}
        >
          {completado.estrellas < 3 && (
            <p className="ui-premio__mensaje">Puedes seguir mejorando tu código para conseguir más estrellas (volver a enviarlo ya no suma puntos).</p>
          )}
        </Enhorabuena>
      )}
    </div>
  );
};

export default VistaReto;
