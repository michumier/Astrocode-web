import React, { useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Save, Sparkles } from 'lucide-react';
import { Aviso, Boton, Campo, CampoArea, CampoSelector, Etiqueta, Panel } from '../../components/ui';
import { AvisoMensaje, Mensaje, errorDe } from './comun';
import PaginaAlumno from '../comun/PaginaAlumno';
import AdminSabotajes from './AdminSabotajes';
import './AdminPanel.css';

export const GET_OPCIONES = gql`
  query OpcionesAdmin {
    iaDisponible
    categorias {
      id
      nombre
    }
    niveles {
      id
      nombre
    }
  }
`;

const GENERAR_EJERCICIO = gql`
  mutation GenerarEjercicio($tema: String!, $nivelId: ID!, $categoriaId: ID!) {
    generarEjercicio(tema: $tema, nivelId: $nivelId, categoriaId: $categoriaId) {
      titulo
      descripcion
      codigoBase
      solucion
      resultadoEsperado
      tests {
        descripcion
        codigoTest
        salidaEsperada
        oculto
      }
      testsGenerados
      avisos
    }
  }
`;

const CREAR_TAREA = gql`
  mutation CrearTarea($input: CrearTareaInput!) {
    crearTarea(input: $input) {
      id
      titulo
    }
  }
`;

const GenerarEjercicio: React.FC = () => {
  const { data, loading } = useQuery(GET_OPCIONES);
  const [generarEjercicio, { loading: generando }] = useMutation(GENERAR_EJERCICIO);
  const [crearTarea, { loading: guardando }] = useMutation(CREAR_TAREA, { refetchQueries: ['TareasPorNivel'] });

  const [tema, setTema] = useState('');
  const [nivelId, setNivelId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [borrador, setBorrador] = useState<any>(null);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  const generar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    setBorrador(null);
    try {
      const { data: res } = await generarEjercicio({ variables: { tema, nivelId, categoriaId } });
      setBorrador(res.generarEjercicio);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: errorDe(error) });
    }
  };

  const guardar = async () => {
    try {
      const { data: res } = await crearTarea({
        variables: {
          input: {
            categoriaId,
            nivelId,
            titulo: borrador.titulo,
            descripcion: borrador.descripcion,
            codigoBase: borrador.codigoBase,
            resultadoEsperado: borrador.resultadoEsperado,
            solucion: borrador.solucion,
            tests: borrador.tests.map(({ __typename, ...t }: any) => t),
          },
        },
      });
      setMensaje({ tipo: 'ok', texto: `Ejercicio «${res.crearTarea.titulo}» guardado (id ${res.crearTarea.id}).` });
      setBorrador(null);
      setTema('');
    } catch (error) {
      setMensaje({ tipo: 'error', texto: errorDe(error) });
    }
  };

  const editar = (campo: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setBorrador({ ...borrador, [campo]: e.target.value });

  return (
    <>
      <Panel titulo="Generar un ejercicio con IA">
        {loading ? (
          <p className="admin__nota">Cargando…</p>
        ) : !data?.iaDisponible ? (
          <Aviso tono="info" titulo="La IA no está activada">
            Añade <code>NVIDIA_API_KEY</code> al <code>.env</code> de la API y reiníciala.
          </Aviso>
        ) : (
          <form onSubmit={generar} className="admin__formulario">
            <Campo etiqueta="Tema" value={tema} onChange={(e) => setTema(e.target.value)} required maxLength={300}
              placeholder="p. ej. contar vocales en un mensaje de radio" ayuda="La IA escribe enunciado, código base, solución y tests; los tests se comprueban en el sandbox." />
            <div className="admin__fila">
              <CampoSelector etiqueta="Nivel" value={nivelId} onChange={(e) => setNivelId(e.target.value)} required>
                <option value="">Elige…</option>
                {data.niveles.map((n: any) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
              </CampoSelector>
              <CampoSelector etiqueta="Categoría" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required>
                <option value="">Elige…</option>
                {data.categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </CampoSelector>
            </div>
            <div>
              <Boton type="submit" variante="primario" cargando={generando} icono={<Sparkles size={18} aria-hidden="true" />}>
                {generando ? 'Generando y comprobando tests…' : 'Generar borrador'}
              </Boton>
            </div>
          </form>
        )}
        <AvisoMensaje mensaje={mensaje} />
      </Panel>

      {borrador && (
        <Panel titulo="Revisar el borrador"
          extra={<Etiqueta tono="turquesa">{borrador.tests.length} de {borrador.testsGenerados} tests verificados</Etiqueta>}>
          <div className="admin__formulario">
            {borrador.avisos.map((a: string) => <Aviso key={a} tono="atencion" titulo="Revísalo">{a}</Aviso>)}
            <Campo etiqueta="Título" value={borrador.titulo} onChange={editar('titulo')} />
            <CampoArea etiqueta="Enunciado" rows={6} value={borrador.descripcion} onChange={editar('descripcion')} />
            <CampoArea etiqueta="Código base (lo ve el alumno)" codigo rows={5} value={borrador.codigoBase} onChange={editar('codigoBase')} />
            <CampoArea etiqueta="Ejemplo que ve el alumno" codigo rows={2} value={borrador.resultadoEsperado} onChange={editar('resultadoEsperado')} />
            <details className="admin__solucion">
              <summary>Solución de referencia (no la ve el alumno)</summary>
              <pre>{borrador.solucion}</pre>
            </details>

            <h3 className="admin__subtitulo">Tests</h3>
            <ul className="admin__tests">
              {borrador.tests.map((t: any, i: number) => (
                <li key={i}>
                  <Etiqueta tono={t.oculto ? 'neutro' : 'turquesa'}>{t.oculto ? 'Oculto' : 'Visible'}</Etiqueta>
                  <div>
                    <strong>{t.descripcion}</strong>
                    <code>{t.codigoTest}</code> → <code>{t.salidaEsperada}</code>
                  </div>
                </li>
              ))}
            </ul>

            <div className="admin__acciones">
              <Boton variante="primario" onClick={guardar} cargando={guardando} icono={<Save size={18} aria-hidden="true" />}>
                {guardando ? 'Guardando…' : 'Guardar ejercicio'}
              </Boton>
              <Boton variante="fantasma" onClick={() => setBorrador(null)}>Descartar</Boton>
            </div>
          </div>
        </Panel>
      )}
    </>
  );
};

interface AdminPanelProps {
  onLogout?: () => void;
}

type Seccion = 'ejercicios' | 'sabotajes';

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [seccion, setSeccion] = useState<Seccion>('ejercicios');
  const pestana = (id: Seccion, texto: string) => (
    <button type="button" role="tab" id={`admin-tab-${id}`} aria-selected={seccion === id} aria-controls="admin-panel"
      onClick={() => setSeccion(id)}>{texto}</button>
  );

  return (
    <PaginaAlumno titulo="Panel de administración" onLogout={onLogout}
      subtitulo="Crea ejercicios con IA y prepara sabotajes. Todo se comprueba en el sandbox antes de que lo vea un alumno.">
      <div className="admin__secciones" role="tablist" aria-label="Secciones">
        {pestana('ejercicios', 'Ejercicios con IA')}
        {pestana('sabotajes', 'Sabotajes')}
      </div>
      <div id="admin-panel" role="tabpanel" aria-labelledby={`admin-tab-${seccion}`} className="admin__contenido">
        {seccion === 'ejercicios' ? <GenerarEjercicio /> : <AdminSabotajes />}
      </div>
    </PaginaAlumno>
  );
};

export default AdminPanel;
