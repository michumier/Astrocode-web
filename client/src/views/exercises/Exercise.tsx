import React, { useEffect, useRef, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Award, Bot, ChevronLeft, CircleCheck, CircleX, Lightbulb, Play, RotateCcw, ScanEye, Timer, X } from 'lucide-react';
import CodeEditor, { lineaDeError } from '../../components/code-editor/CodeEditor';
import TextoIA from '../../components/texto-ia/TextoIA';
import DiffSabotaje from '../../components/diff-sabotaje/DiffSabotaje';
import CajaNegra, { Traza } from '../../components/caja-negra/CajaNegra';
import Enunciado from '../../components/enunciado/Enunciado';
import { Aviso, Boton, Etiqueta, tonoDeNivel } from '../../components/ui';
import './Ejercicio.css';

// El servidor ejecuta, corrige y suma los puntos
const ENVIAR_SOLUCION = gql`
  mutation EnviarSolucion($tareaId: ID!, $codigo: String!, $tiempoCompletado: Int!) {
    enviarSolucion(tareaId: $tareaId, codigo: $codigo, tiempoCompletado: $tiempoCompletado) {
      correcto
      yaCompletada
      insigniasNuevas
      revelacion {
        descripcion
        linea
        diff
      }
      tests {
        superados
        total
        resultados {
          descripcion
          oculto
          superado
          esperado
          obtenido
          error
        }
      }
      puntos
      tiempo
      mensaje
      ejecucion {
        stdout
        stderr
        compile_output
        status {
          id
          description
        }
        time
      }
    }
  }
`;

const IA_DISPONIBLE = gql`
  query IaDisponible {
    iaDisponible
  }
`;

const CAMPOS_TRAZA = 'pasos totalPasos salida error truncado';

const TRAZAR = gql`
  mutation TrazarEjecucion($codigo: String!) {
    trazarEjecucion(codigo: $codigo) { ${CAMPOS_TRAZA} }
  }
`;

const TRAZAR_TEST = gql`
  mutation TrazarTest($tareaId: ID!, $codigo: String!, $indiceTest: Int!) {
    trazarTest(tareaId: $tareaId, codigo: $codigo, indiceTest: $indiceTest) { ${CAMPOS_TRAZA} }
  }
`;

const PEDIR_PISTA = gql`
  mutation PedirPista($tareaId: ID!, $codigo: String!, $salida: String, $nivel: Int) {
    pedirPista(tareaId: $tareaId, codigo: $codigo, salida: $salida, nivel: $nivel) {
      pista
      nivel
      restantesHoy
    }
  }
`;

interface Prueba {
  descripcion: string;
  oculto: boolean;
  superado: boolean;
  esperado?: string | null;
  obtenido?: string | null;
  error?: string | null;
}

interface Resultado {
  stdout?: string | null;
  stderr?: string | null;
  compilacion?: string | null;
  tiempo?: string | null;
  pruebas?: { superados: number; total: number; resultados: Prueba[] } | null;
  correcto?: boolean;
  yaCompletada?: boolean;
  mensaje?: string | null;
  fallo?: string;
}

interface ExerciseProps {
  onBackToDashboard?: () => void;
  exerciseData?: any;
}

const formatearTiempo = (segundos: number) =>
  `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`;

const Exercise: React.FC<ExerciseProps> = ({ onBackToDashboard, exerciseData }) => {
  const [code, setCode] = useState<string>(exerciseData?.codigoBase || '');
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [ejecutando, setEjecutando] = useState(false);
  const [lineaError, setLineaError] = useState<number | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [relojEnMarcha, setRelojEnMarcha] = useState(true);
  const [premio, setPremio] = useState<{ puntos: number; tiempo: string; mensaje: string } | null>(null);
  // Sabotajes: qué había cambiado el saboteador (se revela al resolverlo) e insignias ganadas
  const esSabotaje = exerciseData?.tipo === 'sabotaje';
  // La API titula las copias «🕵️ Sabotaje: …»; aquí ya lo dice la etiqueta
  const titulo = (exerciseData?.title || '').replace(/^\P{L}*Sabotaje:\s*/u, '');
  const [revelacion, setRevelacion] = useState<{ descripcion: string; linea: number | null; diff: string } | null>(null);
  const [insigniasNuevas, setInsigniasNuevas] = useState<string[]>([]);
  // Pistas del tutor de IA: cada vez que se pide una, sube el nivel (1 → 3)
  const [pista, setPista] = useState<{ texto: string; nivel: number; restantes: number } | null>(null);
  const [pidiendoPista, setPidiendoPista] = useState(false);
  const [nivelPista, setNivelPista] = useState(1);
  // Caja negra (ejecución paso a paso)
  const [cajaNegra, setCajaNegra] = useState<{ titulo: string; codigo: string; traza: Traza } | null>(null);
  const [trazando, setTrazando] = useState(false);
  const dialogo = useRef<HTMLDivElement>(null);

  const ejecutarRef = useRef<HTMLDivElement>(null);
  // Al cerrar la enhorabuena, el foco vuelve a «Ejecutar»
  const cerrarPremio = () => {
    setPremio(null);
    setTimeout(() => ejecutarRef.current?.querySelector<HTMLButtonElement>('.ui-boton--primario')?.focus(), 0);
  };
  const { data: iaData } = useQuery(IA_DISPONIBLE);
  const [pedirPista] = useMutation(PEDIR_PISTA);
  const [trazar] = useMutation(TRAZAR);
  const [trazarTest] = useMutation(TRAZAR_TEST);
  const [enviarSolucion] = useMutation(ENVIAR_SOLUCION, {
    // Puntos, estrellas del mapa y sabotajes desbloqueados
    refetchQueries: ['GetUserStats', 'GetCompletedTasks', 'GetCurrentUser', 'SalaDeMaquinas'],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    if (exerciseData?.codigoBase) setCode(exerciseData.codigoBase);
  }, [exerciseData]);

  useEffect(() => {
    if (!relojEnMarcha) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [relojEnMarcha]);

  // La ventana de enhorabuena se cierra con Escape y lleva el foco a su botón
  useEffect(() => {
    if (!premio) return;
    dialogo.current?.querySelector('button')?.focus();
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrarPremio(); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [premio]);

  if (!exerciseData) {
    return (
      <div className="ejercicio ejercicio--vacio">
        <h1>No se ha encontrado el ejercicio</h1>
        <p>Vuelve al mapa y elige uno.</p>
        <Boton variante="primario" onClick={onBackToDashboard}>Volver al mapa</Boton>
      </div>
    );
  }

  const reiniciar = () => {
    setCode(exerciseData.codigoBase || '');
    setResultado(null);
    setLineaError(null);
  };

  const abrirCajaNegra = async (indiceTest?: number, descripcion?: string) => {
    setTrazando(true);
    try {
      const { data } = indiceTest === undefined
        ? await trazar({ variables: { codigo: code } })
        : await trazarTest({ variables: { tareaId: exerciseData.id, codigo: code, indiceTest } });
      const t = data.trazarEjecucion || data.trazarTest;
      setCajaNegra({
        titulo: indiceTest === undefined ? 'Caja negra: tu programa' : `Caja negra: ${descripcion}`,
        codigo: code,
        traza: { ...t, pasos: JSON.parse(t.pasos) },
      });
    } catch (error: any) {
      setResultado((r) => ({ ...(r || {}), fallo: `No se pudo abrir la caja negra: ${error.graphQLErrors?.[0]?.message || error.message}` }));
    } finally {
      setTrazando(false);
    }
  };

  const handlePista = async () => {
    setPidiendoPista(true);
    try {
      const salida = resultado ? [resultado.stdout, resultado.stderr, resultado.mensaje].filter(Boolean).join('\n') : null;
      const { data } = await pedirPista({ variables: { tareaId: exerciseData.id, codigo: code, salida, nivel: nivelPista } });
      const respuesta = data?.pedirPista;
      if (respuesta) {
        setPista({ texto: respuesta.pista, nivel: respuesta.nivel, restantes: respuesta.restantesHoy });
        setNivelPista(Math.min(respuesta.nivel + 1, 3));
      }
    } catch (error: any) {
      setPista({ texto: error.graphQLErrors?.[0]?.message || error.message, nivel: 0, restantes: 0 });
    } finally {
      setPidiendoPista(false);
    }
  };

  const ejecutar = async () => {
    if (ejecutando) return;
    setEjecutando(true);
    try {
      const { data } = await enviarSolucion({ variables: { tareaId: exerciseData.id, codigo: code, tiempoCompletado: segundos } });
      const r = data?.enviarSolucion;
      const ejecucion = r?.ejecucion;
      setResultado({
        stdout: ejecucion?.stdout,
        stderr: ejecucion?.stderr,
        compilacion: ejecucion?.compile_output,
        tiempo: ejecucion?.time,
        pruebas: r?.tests,
        correcto: r?.correcto,
        yaCompletada: r?.yaCompletada,
        mensaje: r?.mensaje,
      });
      setLineaError(lineaDeError(ejecucion?.stderr));
      if (r?.correcto) {
        if (r.revelacion) setRevelacion(r.revelacion);
        if (r.insigniasNuevas?.length) setInsigniasNuevas(r.insigniasNuevas);
        if (!r.yaCompletada) {
          setPremio({ puntos: r.puntos, tiempo: r.tiempo, mensaje: r.mensaje });
          setRelojEnMarcha(false);
        }
      }
    } catch (error: any) {
      setResultado({
        fallo: error.networkError
          ? 'No hay conexión con el servidor. Comprueba que está en marcha e inténtalo de nuevo.'
          : error.graphQLErrors?.[0]?.message || error.message || 'Error desconocido',
      });
    } finally {
      setEjecutando(false);
    }
  };

  // Índice de cada prueba entre las visibles: es el que necesita la caja negra («Ver qué pasó»)
  let visibles = -1;
  const pruebas = (resultado?.pruebas?.resultados || []).map((p) => ({ ...p, indiceVisible: p.oculto ? -1 : ++visibles }));
  const cirujano = insigniasNuevas.includes('Cirujano');

  return (
    <div className="ejercicio">
      <header className="ejercicio__barra">
        <Boton variante="fantasma" onClick={onBackToDashboard} icono={<ChevronLeft size={18} aria-hidden="true" />} className="ejercicio__volver">Mapa</Boton>
        <span className="ejercicio__miga">{exerciseData.categoria}</span>
        {tonoDeNivel(exerciseData.difficulty) !== 'neutro' && <Etiqueta tono={tonoDeNivel(exerciseData.difficulty)}>{exerciseData.difficulty}</Etiqueta>}
        <Etiqueta>{exerciseData.points} pts</Etiqueta>
        {esSabotaje && <Etiqueta tono="dificil">Sabotaje</Etiqueta>}
        <div className="ejercicio__barra-der">
          <span className="ejercicio__reloj" aria-label={`Tiempo: ${formatearTiempo(segundos)}`}>
            <Timer size={16} aria-hidden="true" />{formatearTiempo(segundos)}
          </span>
          {iaData?.iaDisponible && (
            <Boton variante="secundario" onClick={handlePista} cargando={pidiendoPista}
              icono={<Lightbulb size={18} aria-hidden="true" />} title="El tutor de IA te da una pista sin decirte la solución">
              {pidiendoPista ? 'Pensando…' : `Pista ${nivelPista} de 3`}
            </Boton>
          )}
        </div>
      </header>

      <main className="ejercicio__cuerpo">
        <article className="ejercicio__enunciado" tabIndex={0} aria-label="Enunciado">
          {esSabotaje && (
            <Aviso tono="error" titulo="Alerta de sabotaje">
              {exerciseData.contexto || 'Un saboteador ha alterado el código de la nave.'} El código del editor casi funciona:
              alguien ha introducido un único fallo. Encuéntralo y arréglalo cambiando lo mínimo posible.
            </Aviso>
          )}
          <h1>{titulo}</h1>
          {exerciseData.description && <Enunciado texto={exerciseData.description} />}
          {exerciseData.resultadoEsperado && (
            <section className="ejercicio__esperado">
              <h2>Resultado esperado</h2>
              <pre>{exerciseData.resultadoEsperado}</pre>
            </section>
          )}
          {pista && (
            <section className="ejercicio__tutor" aria-live="polite">
              <span className="ejercicio__tutor-icono"><Bot size={20} aria-hidden="true" /></span>
              <div>
                <strong>AstroTutor{pista.nivel > 0 ? ` · pista ${pista.nivel} de 3` : ''}</strong>
                <TextoIA texto={pista.texto} />
                {pista.nivel > 0 && <small>Te quedan {pista.restantes} pistas hoy</small>}
              </div>
              <Boton variante="fantasma" tamano="peq" soloIcono aria-label="Cerrar la pista" onClick={() => setPista(null)} icono={<X size={16} aria-hidden="true" />} />
            </section>
          )}
        </article>

        <section className="ejercicio__trabajo" aria-label="Tu código">
          <div className="ejercicio__editor">
            <div className="ejercicio__editor-barra">
              <span className="ejercicio__pestana">main.py</span>
              <div className="ejercicio__acciones" ref={ejecutarRef}>
                <Boton variante="fantasma" soloIcono onClick={reiniciar} icono={<RotateCcw size={18} aria-hidden="true" />}
                  aria-label={esSabotaje ? 'Volver al código saboteado original' : 'Volver al código inicial'}
                  title={esSabotaje ? 'Volver al código saboteado original' : 'Volver al código inicial'} />
                <Boton variante="secundario" onClick={() => abrirCajaNegra()} cargando={trazando}
                  icono={<ScanEye size={18} aria-hidden="true" />} title="Ver tu programa ejecutándose paso a paso, con sus variables">
                  {trazando ? 'Trazando…' : 'Paso a paso'}
                </Boton>
                <Boton variante="primario" onClick={ejecutar} cargando={ejecutando} title="Ejecuta y corrige tu código (Ctrl+Enter)"
                  icono={<Play size={16} fill="currentColor" aria-hidden="true" />}>
                  {ejecutando ? 'Ejecutando…' : 'Ejecutar'}
                </Boton>
              </div>
            </div>
            <div className="ejercicio__codigo">
              <CodeEditor value={code} onChange={(nuevo) => { setCode(nuevo); setLineaError(null); }} onRun={ejecutar}
                lineaError={lineaError} placeholder="Escribe tu código aquí…" />
            </div>
          </div>

          <div className="ejercicio__salida" aria-live="polite" aria-busy={ejecutando}>
            <div className="ejercicio__salida-cabecera">
              <h2>Salida</h2>
              {resultado?.pruebas && (
                <span className={`ejercicio__marcador ${resultado.correcto ? 'ok' : 'mal'}`}>
                  {resultado.correcto ? <CircleCheck size={16} aria-hidden="true" /> : <CircleX size={16} aria-hidden="true" />}
                  {resultado.pruebas.superados} de {resultado.pruebas.total} pruebas{resultado.tiempo ? ` · ${resultado.tiempo} s` : ''}
                </span>
              )}
            </div>
            <div className="ejercicio__consola" tabIndex={0} role="region" aria-label="Salida">
              {!resultado ? (
                <p className="ejercicio__vacio">Pulsa <strong>Ejecutar</strong> (o Ctrl+Enter) para probar y corregir tu código.</p>
              ) : (
                <>
                  {resultado.fallo && <Aviso tono="error" titulo="No se pudo completar">{resultado.fallo}</Aviso>}
                  {resultado.stdout && <pre className="ejercicio__stdout">{resultado.stdout}</pre>}
                  {resultado.stderr && <pre className="ejercicio__stderr">{resultado.stderr}</pre>}
                  {resultado.compilacion && <pre className="ejercicio__stderr">{resultado.compilacion}</pre>}
                  {!resultado.fallo && !resultado.stdout && !resultado.stderr && !resultado.compilacion && (
                    <p className="ejercicio__vacio">Tu programa no ha escrito nada.</p>
                  )}
                  {pruebas.length > 0 && (
                    <ul className="ejercicio__pruebas">
                      {pruebas.map((p, i) => (
                        <li key={i} className={p.superado ? 'ok' : 'mal'}>
                          {p.superado ? <CircleCheck size={16} aria-hidden="true" /> : <CircleX size={16} aria-hidden="true" />}
                          <div>
                            <span>{p.oculto ? 'Prueba oculta' : p.descripcion}</span>
                            {!p.superado && !p.oculto && (
                              <div className="ejercicio__detalle">
                                {p.error ? <span>Error: {p.error}</span> : (
                                  <>
                                    <span>Esperado: <code>{p.esperado}</code></span>
                                    <span>Obtenido: <code>{p.obtenido || '(nada)'}</code></span>
                                  </>
                                )}
                                <Boton variante="fantasma" tamano="peq" onClick={() => abrirCajaNegra(p.indiceVisible, p.descripcion)}
                                  disabled={trazando} icono={<ScanEye size={16} aria-hidden="true" />}>Ver qué pasó</Boton>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {resultado.mensaje && (
                    resultado.correcto
                      ? <Aviso tono="exito" titulo={esSabotaje ? '¡Sistema reparado!' : '¡Correcto!'}>{resultado.mensaje}</Aviso>
                      : <Aviso tono="atencion" titulo="Todavía no">{resultado.mensaje}</Aviso>
                  )}
                </>
              )}
              {revelacion && (
                <div className="ejercicio__revelacion" data-testid="revelacion">
                  <strong>Así era el sabotaje{revelacion.linea ? ` (línea ${revelacion.linea})` : ''}</strong>
                  <p>{revelacion.descripcion}</p>
                  <DiffSabotaje diff={revelacion.diff} />
                  {cirujano && <p className="ejercicio__insignia"><Award size={18} aria-hidden="true" /><span>Insignia nueva: <strong>Cirujano</strong>. Lo arreglaste tocando lo mínimo.</span></p>}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {premio && (
        <div className="ejercicio__fondo" onClick={(e) => { if (e.target === e.currentTarget) cerrarPremio(); }}>
          <div className="ejercicio__premio" role="dialog" aria-modal="true" aria-labelledby="premio-titulo" ref={dialogo}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10.5" stroke="var(--ac-turquesa)" strokeWidth="1.4" strokeDasharray="2.2 1.6" />
              <path d="M12 6.2l1.6 3.6 3.9.4-2.9 2.6.8 3.8L12 14.7l-3.4 1.9.8-3.8-2.9-2.6 3.9-.4z" fill="var(--ac-oro)" />
            </svg>
            <h2 id="premio-titulo">{esSabotaje ? '¡Sistema reparado!' : '¡Ejercicio superado!'}</h2>
            <p className="ejercicio__premio-sub">{titulo} · se ha encendido una estrella</p>
            <div className="ejercicio__premio-datos">
              <div><b>+{premio.puntos}</b><span>puntos</span></div>
              <div><b>{premio.tiempo}</b><span>tiempo</span></div>
            </div>
            {premio.mensaje && <p className="ejercicio__premio-mensaje">{premio.mensaje}</p>}
            {revelacion && (
              <div className="ejercicio__premio-revelacion">
                <p>Así era el sabotaje{revelacion.linea ? ` (línea ${revelacion.linea})` : ''}:</p>
                <DiffSabotaje diff={revelacion.diff} />
              </div>
            )}
            {cirujano && <p className="ejercicio__insignia"><Award size={18} aria-hidden="true" /><span>Insignia nueva: <strong>Cirujano</strong></span></p>}
            <div className="ejercicio__premio-botones">
              <Boton variante="primario" tamano="grande" onClick={onBackToDashboard}>Volver al mapa</Boton>
              <Boton variante="fantasma" onClick={cerrarPremio}>Quedarme aquí</Boton>
            </div>
          </div>
        </div>
      )}

      {cajaNegra && (
        <CajaNegra titulo={cajaNegra.titulo} codigo={cajaNegra.codigo} traza={cajaNegra.traza} onCerrar={() => setCajaNegra(null)} />
      )}
    </div>
  );
};

export default Exercise;
