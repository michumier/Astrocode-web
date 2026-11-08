import React, { useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { ArrowRight, BookOpen, CircleCheck, CircleX, Lightbulb, Play, Wrench } from 'lucide-react';
import { Aviso, Boton, Conquista } from '../../components/ui';
import type { PlanetaConquistado } from '../../components/ui';
import Enunciado, { enLinea } from '../../components/enunciado/Enunciado';
import CodeEditor from '../../components/code-editor/CodeEditor';
import CodigoResaltado from '../../components/code-editor/CodigoResaltado';
import PaginaAlumno, { GET_BARRA } from '../comun/PaginaAlumno';
import { limpiarTitulo } from '../../utils/tareas';
import './VistaLeccion.css';

// Lección de la ruta (fase 12): explicación, ejemplos que se pueden ejecutar, el error típico
// y una pregunta «¿qué imprime?». La respuesta la corrige el servidor y da los puntos una vez.
export const GET_LECCION = gql`
  query Leccion($id: ID!) {
    leccion(id: $id) {
      id
      titulo
      planeta
      completada
      bloques {
        tipo
        texto
        codigo
        pista
      }
      pregunta {
        codigo
        opciones
      }
      siguiente {
        tipo
        id
        titulo
      }
    }
  }
`;

export const RESPONDER = gql`
  mutation ResponderLeccion($leccionId: ID!, $opcion: Int!) {
    responderLeccion(leccionId: $leccionId, opcion: $opcion) {
      correcta
      explicacion
      puntos
      yaCompletada
      planetaConquistado {
        nombre
        puntos
      }
    }
  }
`;

export const EJECUTAR = gql`
  mutation EjecutarEjemplo($codigo: String!) {
    executeCode(input: { sourceCode: $codigo }) {
      stdout
      stderr
    }
  }
`;

// Un ejemplo de la lección: se puede editar y ejecutar («Pruébalo»)
const Ejemplo: React.FC<{ codigo: string; pista?: string | null; numero: number }> = ({ codigo, pista, numero }) => {
  const [texto, setTexto] = useState(codigo);
  const [salida, setSalida] = useState<{ stdout: string; stderr: string } | null>(null);
  const [ejecutar, { loading }] = useMutation(EJECUTAR);

  const probar = async () => {
    try {
      const { data } = await ejecutar({ variables: { codigo: texto } });
      setSalida(data?.executeCode || { stdout: '', stderr: 'Sin respuesta del servidor' });
    } catch {
      setSalida({ stdout: '', stderr: 'No se ha podido ejecutar. Revisa la conexión e inténtalo de nuevo.' });
    }
  };

  return (
    <section className="leccion__ejemplo" aria-label={`Ejemplo ${numero}`}>
      {pista && (
        <p className="leccion__pista">
          <Lightbulb size={16} aria-hidden="true" />
          <span><strong>Pruébalo:</strong> {enLinea(pista)}</span>
        </p>
      )}
      <div className="leccion__editor">
        <CodeEditor value={texto} onChange={setTexto} onRun={probar} />
        <div className="leccion__editor-barra">
          {texto !== codigo && (
            <Boton variante="fantasma" tamano="peq" onClick={() => { setTexto(codigo); setSalida(null); }}>Volver al original</Boton>
          )}
          <Boton variante="secundario" tamano="peq" cargando={loading} onClick={probar}
            icono={<Play size={14} fill="currentColor" aria-hidden="true" />}>
            Ejecutar
          </Boton>
        </div>
      </div>
      {salida && (
        <pre className={`leccion__salida ${salida.stderr ? 'mal' : ''}`} aria-live="polite" tabIndex={0} aria-label="Salida del ejemplo">
          {salida.stdout}{salida.stderr}
          {!salida.stdout && !salida.stderr && '(el programa no ha imprimido nada)'}
        </pre>
      )}
    </section>
  );
};

interface PropsLeccion {
  leccionId: string;
  onLogout?: () => void;
  // Ir al paso siguiente de la ruta (tarea o lección) o volver al mapa
  alSiguiente: (paso: { tipo: string; id: string } | null) => void;
}

const VistaLeccion: React.FC<PropsLeccion> = ({ leccionId, onLogout, alSiguiente }) => {
  const { data, loading, error } = useQuery(GET_LECCION, { variables: { id: leccionId }, fetchPolicy: 'network-only' });
  // Al acertar cambian los puntos: la barra de arriba los vuelve a pedir
  const [responder, { loading: respondiendo }] = useMutation(RESPONDER, { refetchQueries: [GET_BARRA] });
  const [elegida, setElegida] = useState<number | null>(null);
  const [falladas, setFalladas] = useState<number[]>([]);
  const [resultado, setResultado] = useState<{
    correcta: boolean; explicacion: string; puntos: number; yaCompletada: boolean; planetaConquistado: PlanetaConquistado | null;
  } | null>(null);

  const l = data?.leccion;
  if (loading && !l) return <PaginaAlumno titulo="Lección" onLogout={onLogout}><p className="leccion__nota">Cargando la lección…</p></PaginaAlumno>;
  if (error || !l) {
    const bloqueo = error?.graphQLErrors?.find((e) => e.extensions?.code === 'FORBIDDEN');
    return (
      <PaginaAlumno titulo="Lección" onLogout={onLogout}>
        <Aviso tono={bloqueo ? 'atencion' : 'error'} titulo={bloqueo ? `${bloqueo.message}.` : 'No se ha podido cargar la lección'} />
        <div className="leccion__acciones"><Boton variante="primario" onClick={() => alSiguiente(null)}>Volver al mapa</Boton></div>
      </PaginaAlumno>
    );
  }

  const acertada = resultado?.correcta || false;
  const completada = l.completada || acertada;

  const elegir = async (opcion: number) => {
    if (respondiendo || acertada) return;
    setElegida(opcion);
    try {
      const { data: r } = await responder({ variables: { leccionId: l.id, opcion } });
      const res = r.responderLeccion;
      setResultado(res);
      if (!res.correcta) setFalladas((f) => (f.includes(opcion) ? f : [...f, opcion]));
    } catch {
      setResultado({ correcta: false, explicacion: 'No se ha podido comprobar la respuesta. Inténtalo de nuevo.', puntos: 0, yaCompletada: false, planetaConquistado: null });
    }
  };

  const siguiente = l.siguiente;
  let ejemplos = 0;

  return (
    <PaginaAlumno titulo={l.titulo} onLogout={onLogout} className="leccion"
      subtitulo={<span className="leccion__kicker"><BookOpen size={16} aria-hidden="true" />Lección{l.planeta ? ` · ${l.planeta}` : ''}{l.completada ? ' · completada' : ''}</span>}>
      <article className="leccion__cuerpo">
        {l.bloques.map((b: any, i: number) => {
          if (b.tipo === 'codigo') return <Ejemplo key={i} codigo={b.codigo} pista={b.pista} numero={++ejemplos} />;
          if (b.tipo === 'error') {
            return (
              <section key={i} className="leccion__error" aria-labelledby={`leccion-error-${i}`}>
                <h2 id={`leccion-error-${i}`}><Wrench size={18} aria-hidden="true" />El error típico</h2>
                <Enunciado texto={b.texto} />
                <CodigoResaltado codigo={b.codigo} etiqueta="Código con el error típico" className="leccion__codigo" />
              </section>
            );
          }
          return <Enunciado key={i} texto={b.texto} className="leccion__texto" />;
        })}

        <section className="leccion__pregunta" aria-labelledby="leccion-pregunta">
          <h2 id="leccion-pregunta">Comprueba que lo has entendido</h2>
          <p className="leccion__nota">
            {l.completada
              ? 'Ya completaste esta lección. Puedes volver a responder para repasar (ya no suma puntos).'
              : 'Acierta a la primera y ganas 15 puntos; si fallas, te explicamos por qué y puedes volver a intentarlo (10 puntos).'}
          </p>
          <CodigoResaltado codigo={l.pregunta.codigo} etiqueta="Código de la pregunta" className="leccion__codigo" />
          <p className="leccion__enunciado-pregunta">¿Qué imprime?</p>
          <div className="leccion__opciones" role="group" aria-label="Opciones">
            {l.pregunta.opciones.map((o: string, i: number) => {
              const fallada = falladas.includes(i);
              const buena = acertada && elegida === i;
              return (
                <button key={i} type="button"
                  className={`leccion__opcion ${fallada ? 'mal' : ''} ${buena ? 'bien' : ''}`}
                  onClick={() => elegir(i)} disabled={respondiendo || fallada || acertada}
                  aria-label={`Opción ${String.fromCharCode(65 + i)}${fallada ? ' (incorrecta)' : buena ? ' (correcta)' : ''}`}>
                  <span className="leccion__letra" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                  <pre>{o}</pre>
                  {fallada && <CircleX size={18} aria-hidden="true" />}
                  {buena && <CircleCheck size={18} aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          {resultado && (
            <div className="leccion__resultado" aria-live="polite">
              <Aviso tono={resultado.correcta ? 'exito' : 'error'}
                titulo={resultado.correcta
                  ? (resultado.puntos > 0 ? `¡Correcto! +${resultado.puntos} pts` : '¡Correcto!')
                  : 'No es esa'}>
                <Enunciado texto={resultado.explicacion} />
              </Aviso>
              {resultado.planetaConquistado && <Conquista planeta={resultado.planetaConquistado} />}
            </div>
          )}
        </section>

        <div className="leccion__acciones">
          {completada && siguiente ? (
            <Boton variante="primario" tamano="grande" onClick={() => alSiguiente(siguiente)}
              icono={<ArrowRight size={18} aria-hidden="true" />}>
              Siguiente: {limpiarTitulo(siguiente.titulo)}
            </Boton>
          ) : (
            <Boton variante={completada ? 'primario' : 'fantasma'} onClick={() => alSiguiente(null)}>Volver al mapa</Boton>
          )}
        </div>
      </article>
    </PaginaAlumno>
  );
};

export default VistaLeccion;
