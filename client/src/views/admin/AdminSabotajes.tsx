import React, { useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import DiffSabotaje from '../../components/diff-sabotaje/DiffSabotaje';

const GET_SABOTEABLES = gql`
  query TareasSaboteables {
    iaDisponible
    tareasSaboteables {
      id
      titulo
      tests
      sabotajes
      publicados
    }
  }
`;

const CAMPOS = `
  id tareaId operador descripcion linea lineasCambiadas diff contexto dificultad testsFallidos testsTotales origen
`;

const GET_SABOTAJES = gql`
  query SabotajesDeTarea($tareaId: ID!) {
    sabotajesDeTarea(tareaId: $tareaId) { ${CAMPOS} }
  }
`;

const GENERAR = gql`
  mutation GenerarSabotajes($tareaId: ID!, $cantidad: Int, $usarIa: Boolean) {
    generarSabotajes(tareaId: $tareaId, cantidad: $cantidad, usarIa: $usarIa) { id }
  }
`;

const PUBLICAR = gql`
  mutation PublicarSabotaje($id: ID!, $contexto: String) {
    publicarSabotaje(id: $id, contexto: $contexto) { id titulo }
  }
`;

const DESCARTAR = gql`
  mutation DescartarSabotaje($id: ID!) {
    descartarSabotaje(id: $id)
  }
`;

const ETIQUETA_DIFICULTAD: Record<string, string> = { facil: 'Fácil', media: 'Media', dificil: 'Difícil' };

const errorDe = (error: any) => error.graphQLErrors?.[0]?.message || error.message;

const TarjetaSabotaje: React.FC<{ s: any; onCambio: () => void; onMensaje: (m: { tipo: 'ok' | 'error'; texto: string }) => void }> = ({ s, onCambio, onMensaje }) => {
  const [contexto, setContexto] = useState(s.contexto || '');
  const [publicar, { loading: publicando }] = useMutation(PUBLICAR);
  const [descartar, { loading: descartando }] = useMutation(DESCARTAR);

  const handlePublicar = async () => {
    try {
      const { data } = await publicar({ variables: { id: s.id, contexto } });
      onMensaje({ tipo: 'ok', texto: `Publicado: «${data.publicarSabotaje.titulo}» (tarea ${data.publicarSabotaje.id}).` });
      onCambio();
    } catch (error) {
      onMensaje({ tipo: 'error', texto: errorDe(error) });
    }
  };

  const handleDescartar = async () => {
    try {
      await descartar({ variables: { id: s.id } });
      onCambio();
    } catch (error) {
      onMensaje({ tipo: 'error', texto: errorDe(error) });
    }
  };

  return (
    <li className={`sabotaje-card ${s.tareaId ? 'publicado' : ''}`} data-testid="sabotaje-card">
      <div className="sabotaje-cabecera">
        <span className={`badge dificultad-${s.dificultad}`}>{ETIQUETA_DIFICULTAD[s.dificultad] || s.dificultad}</span>
        <span className="badge visible">{s.origen === 'ia' ? '🤖 IA' : `🧬 ${s.operador}`}</span>
        <strong>{s.descripcion}</strong>
      </div>
      <p className="admin-nota">
        Falla {s.testsFallidos} de {s.testsTotales} tests · línea {s.linea ?? '?'} · {s.lineasCambiadas} línea(s) cambiada(s)
      </p>
      <DiffSabotaje diff={s.diff} />
      {s.tareaId ? (
        <p className="admin-mensaje ok">✅ Publicado como tarea {s.tareaId}</p>
      ) : (
        <>
          <label>
            Ambientación que verá el alumno (sin revelar el bug)
            <textarea rows={2} value={contexto} onChange={(e) => setContexto(e.target.value)} />
          </label>
          <div className="admin-row">
            <button className="admin-primary" onClick={handlePublicar} disabled={publicando}>
              {publicando ? 'Publicando...' : '🚀 Publicar'}
            </button>
            <button className="admin-secondary" onClick={handleDescartar} disabled={descartando}>
              Descartar
            </button>
          </div>
        </>
      )}
    </li>
  );
};

const AdminSabotajes: React.FC = () => {
  const { data, refetch: refetchTareas } = useQuery(GET_SABOTEABLES, { fetchPolicy: 'network-only' });
  const [tareaId, setTareaId] = useState('');
  const [usarIa, setUsarIa] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const { data: sabData, refetch } = useQuery(GET_SABOTAJES, { variables: { tareaId }, skip: !tareaId, fetchPolicy: 'network-only' });
  const [generar, { loading: generando }] = useMutation(GENERAR);

  const recargar = () => {
    refetch();
    refetchTareas();
  };

  const handleGenerar = async () => {
    setMensaje(null);
    try {
      const { data: res } = await generar({ variables: { tareaId, cantidad: 5, usarIa } });
      const n = res.generarSabotajes.length;
      setMensaje(n > 0
        ? { tipo: 'ok', texto: `${n} sabotaje(s) nuevo(s) verificados en el sandbox.` }
        : { tipo: 'error', texto: 'No quedan sabotajes nuevos para esta tarea: el mutador ya ha agotado sus variantes.' });
      recargar();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: errorDe(error) });
    }
  };

  const sabotajes = sabData?.sabotajesDeTarea || [];

  return (
    <section className="admin-card">
      <h2>🕵️ Sabotajes</h2>
      <p className="admin-nota">
        Elige un ejercicio con solución y tests. El sistema introduce un bug en la solución y comprueba en el sandbox
        que de verdad rompe algún test. Publica los que te gusten: se desbloquean al completar el ejercicio original.
      </p>
      <div className="admin-row">
        <label>
          Ejercicio
          <select value={tareaId} onChange={(e) => { setTareaId(e.target.value); setMensaje(null); }}>
            <option value="">Elige...</option>
            {(data?.tareasSaboteables || []).map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.titulo} (#{t.id}) · {t.tests} tests · {t.publicados}/{t.sabotajes} publicados
              </option>
            ))}
          </select>
        </label>
      </div>
      {tareaId && (
        <div className="admin-row admin-row-centrada">
          <button className="admin-primary" onClick={handleGenerar} disabled={generando}>
            {generando ? 'Generando y verificando...' : '🧬 Generar 5 sabotajes'}
          </button>
          {data?.iaDisponible && (
            <label className="admin-check">
              <input type="checkbox" checked={usarIa} onChange={(e) => setUsarIa(e.target.checked)} />
              Incluir uno inventado por la IA
            </label>
          )}
        </div>
      )}
      {mensaje && <p className={`admin-mensaje ${mensaje.tipo}`}>{mensaje.texto}</p>}
      {tareaId && sabotajes.length === 0 && <p className="admin-nota">Todavía no hay sabotajes para este ejercicio.</p>}
      <ul className="admin-tests">
        {sabotajes.map((s: any) => (
          <TarjetaSabotaje key={s.id} s={s} onCambio={recargar} onMensaje={setMensaje} />
        ))}
      </ul>
    </section>
  );
};

export default AdminSabotajes;
