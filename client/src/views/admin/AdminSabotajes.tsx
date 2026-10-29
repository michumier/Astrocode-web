import React, { useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Bot, Dna, Send } from 'lucide-react';
import DiffSabotaje from '../../components/diff-sabotaje/DiffSabotaje';
import { enLinea } from '../../components/enunciado/Enunciado';
import { Aviso, Boton, CampoArea, CampoSelector, Etiqueta, Panel } from '../../components/ui';
import { AvisoMensaje, Mensaje, errorDe } from './comun';

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

const DIFICULTAD: Record<string, { texto: string; tono: 'facil' | 'intermedio' | 'dificil' }> = {
  facil: { texto: 'Fácil', tono: 'facil' },
  media: { texto: 'Media', tono: 'intermedio' },
  dificil: { texto: 'Difícil', tono: 'dificil' },
};

const TarjetaSabotaje: React.FC<{ s: any; onCambio: () => void; onMensaje: (m: Mensaje) => void }> = ({ s, onCambio, onMensaje }) => {
  const [contexto, setContexto] = useState(s.contexto || '');
  const [publicar, { loading: publicando }] = useMutation(PUBLICAR);
  const [descartar, { loading: descartando }] = useMutation(DESCARTAR);
  const dificultad = DIFICULTAD[s.dificultad];

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
    <li className={`admin__sabotaje${s.tareaId ? ' publicado' : ''}`} data-testid="sabotaje-card">
      <div className="admin__sabotaje-cabecera">
        <Etiqueta tono={dificultad?.tono || 'neutro'}>{dificultad?.texto || s.dificultad}</Etiqueta>
        <Etiqueta icono={s.origen === 'ia' ? <Bot size={13} aria-hidden="true" /> : <Dna size={13} aria-hidden="true" />}>
          {s.origen === 'ia' ? 'IA' : s.operador}
        </Etiqueta>
        <strong className="admin__descripcion">{enLinea(s.descripcion)}</strong>
      </div>
      <p className="admin__nota">
        Falla {s.testsFallidos} de {s.testsTotales} tests · línea {s.linea ?? '?'} · {s.lineasCambiadas} línea(s) cambiada(s)
      </p>
      <DiffSabotaje diff={s.diff} />
      {s.tareaId ? (
        <Aviso tono="exito" titulo="Publicado">Es la tarea {s.tareaId}.</Aviso>
      ) : (
        <>
          <CampoArea etiqueta="Ambientación que verá el alumno" ayuda="Sin revelar dónde está el fallo." rows={2}
            value={contexto} onChange={(e) => setContexto(e.target.value)} />
          <div className="admin__acciones">
            <Boton variante="primario" onClick={handlePublicar} cargando={publicando} icono={<Send size={16} aria-hidden="true" />}>
              {publicando ? 'Publicando…' : 'Publicar'}
            </Boton>
            <Boton variante="fantasma" onClick={handleDescartar} cargando={descartando}>Descartar</Boton>
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
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
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
    <Panel titulo="Sabotajes">
      <p className="admin__nota">
        Elige un ejercicio con solución y tests. El sistema introduce un fallo en la solución y comprueba en el sandbox
        que de verdad rompe algún test. Publica los que te gusten: se desbloquean al completar el ejercicio original.
      </p>
      <CampoSelector etiqueta="Ejercicio" value={tareaId} onChange={(e) => { setTareaId(e.target.value); setMensaje(null); }}>
        <option value="">Elige…</option>
        {(data?.tareasSaboteables || []).map((t: any) => (
          <option key={t.id} value={t.id}>
            {t.titulo} (#{t.id}) · {t.tests} tests · {t.publicados}/{t.sabotajes} publicados
          </option>
        ))}
      </CampoSelector>
      {tareaId && (
        <div className="admin__acciones">
          <Boton variante="primario" onClick={handleGenerar} cargando={generando} icono={<Dna size={18} aria-hidden="true" />}>
            {generando ? 'Generando y verificando…' : 'Generar 5 sabotajes'}
          </Boton>
          {data?.iaDisponible && (
            <label className="admin__check">
              <input type="checkbox" checked={usarIa} onChange={(e) => setUsarIa(e.target.checked)} />
              Incluir uno inventado por la IA
            </label>
          )}
        </div>
      )}
      <AvisoMensaje mensaje={mensaje} />
      {tareaId && sabotajes.length === 0 && <p className="admin__nota">Todavía no hay sabotajes para este ejercicio.</p>}
      {sabotajes.length > 0 && (
        <ul className="admin__sabotajes">
          {sabotajes.map((s: any) => (
            <TarjetaSabotaje key={s.id} s={s} onCambio={recargar} onMensaje={setMensaje} />
          ))}
        </ul>
      )}
    </Panel>
  );
};

export default AdminSabotajes;
