import React, { useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import AdminSabotajes from './AdminSabotajes';
import './AdminPanel.css';

const GET_OPCIONES = gql`
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

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const { data, loading } = useQuery(GET_OPCIONES);
  const [generarEjercicio, { loading: generando }] = useMutation(GENERAR_EJERCICIO);
  const [crearTarea, { loading: guardando }] = useMutation(CREAR_TAREA, { refetchQueries: ['TareasPorNivel'] });

  const [tema, setTema] = useState('');
  const [nivelId, setNivelId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [borrador, setBorrador] = useState<any>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const errorDe = (error: any) => error.graphQLErrors?.[0]?.message || error.message;

  const handleGenerar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    setBorrador(null);
    try {
      const { data: res } = await generarEjercicio({ variables: { tema, nivelId, categoriaId } });
      setBorrador(res.generarEjercicio);
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: errorDe(error) });
    }
  };

  const handleGuardar = async () => {
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
      setMensaje({ tipo: 'ok', texto: `Ejercicio "${res.crearTarea.titulo}" guardado (id ${res.crearTarea.id}).` });
      setBorrador(null);
      setTema('');
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: errorDe(error) });
    }
  };

  const editar = (campo: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setBorrador({ ...borrador, [campo]: e.target.value });

  return (
    <div className="admin-container">
      <header className="admin-header">
        <button onClick={onBack} className="admin-back">← Volver al perfil</button>
        <h1>🛠️ Panel de admin</h1>
      </header>

      <main className="admin-main">
        <section className="admin-card">
          <h2>Generar ejercicio con IA</h2>
          {loading ? (
            <p>Cargando...</p>
          ) : !data?.iaDisponible ? (
            <p className="admin-aviso">
              La IA no está activada. Añade <code>NVIDIA_API_KEY</code> al <code>.env</code> de la API y reinicia.
            </p>
          ) : (
            <form onSubmit={handleGenerar} className="admin-form">
              <label>
                Tema
                <input
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  placeholder="p. ej. contar vocales en un mensaje de radio"
                  required
                  maxLength={300}
                />
              </label>
              <div className="admin-row">
                <label>
                  Nivel
                  <select value={nivelId} onChange={(e) => setNivelId(e.target.value)} required>
                    <option value="">Elige...</option>
                    {data.niveles.map((n: any) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                  </select>
                </label>
                <label>
                  Categoría
                  <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required>
                    <option value="">Elige...</option>
                    {data.categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </label>
              </div>
              <button type="submit" className="admin-primary" disabled={generando}>
                {generando ? 'Generando y comprobando tests...' : '✨ Generar borrador'}
              </button>
            </form>
          )}

          {mensaje && <p className={`admin-mensaje ${mensaje.tipo}`}>{mensaje.texto}</p>}
        </section>

        {borrador && (
          <section className="admin-card">
            <h2>Revisar borrador</h2>
            <p className="admin-nota">
              {borrador.tests.length} de {borrador.testsGenerados} tests verificados en el sandbox con la solución de referencia.
            </p>
            {borrador.avisos.map((a: string) => <p key={a} className="admin-aviso">⚠️ {a}</p>)}

            <label>Título<input value={borrador.titulo} onChange={editar('titulo')} /></label>
            <label>Enunciado<textarea rows={6} value={borrador.descripcion} onChange={editar('descripcion')} /></label>
            <label>Código base (lo ve el alumno)<textarea rows={5} className="mono" value={borrador.codigoBase} onChange={editar('codigoBase')} /></label>
            <label>Ejemplo que ve el alumno<textarea rows={2} className="mono" value={borrador.resultadoEsperado} onChange={editar('resultadoEsperado')} /></label>
            <details>
              <summary>Solución de referencia (no la ve el alumno)</summary>
              <pre className="mono">{borrador.solucion}</pre>
            </details>

            <h3>Tests</h3>
            <ul className="admin-tests">
              {borrador.tests.map((t: any, i: number) => (
                <li key={i}>
                  <span className={`badge ${t.oculto ? 'oculto' : 'visible'}`}>{t.oculto ? 'oculto' : 'visible'}</span>
                  <strong>{t.descripcion}</strong>
                  <code>{t.codigoTest}</code> → <code>{t.salidaEsperada}</code>
                </li>
              ))}
            </ul>

            <div className="admin-row">
              <button className="admin-primary" onClick={handleGuardar} disabled={guardando}>
                {guardando ? 'Guardando...' : '💾 Guardar ejercicio'}
              </button>
              <button className="admin-secondary" onClick={() => setBorrador(null)}>Descartar</button>
            </div>
          </section>
        )}
        <AdminSabotajes />
      </main>
    </div>
  );
};

export default AdminPanel;
