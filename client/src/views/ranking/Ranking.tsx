import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { Medal } from 'lucide-react';
import { Aviso, Etiqueta } from '../../components/ui';
import PaginaAlumno, { GET_BARRA } from '../comun/PaginaAlumno';
import './Ranking.css';

export const GET_RANKING = gql`
  query GetRanking {
    ranking(limite: 100) {
      id
      nombre_usuario
      puntos
      posicion
    }
  }
`;

interface Entrada {
  id: string;
  nombre_usuario: string;
  puntos: number;
  posicion: number;
}

const formatear = (n: number) => n.toLocaleString('es-ES');
const PUESTOS = ['oro', 'plata', 'bronce'];

interface PropsRanking {
  onLogout?: () => void;
}

const Ranking: React.FC<PropsRanking> = ({ onLogout }) => {
  const { data, loading, error } = useQuery(GET_RANKING, { fetchPolicy: 'network-only', errorPolicy: 'all' });
  const { data: barra } = useQuery(GET_BARRA, { fetchPolicy: 'cache-first', errorPolicy: 'all' });
  const yoId: string | undefined = barra?.me?.id;
  const lista: Entrada[] = data?.ranking || [];
  const podio = lista.filter((e) => e.posicion <= 3).slice(0, 3);
  const resto = lista.filter((e) => !podio.includes(e));
  const estoy = lista.some((e) => e.id === yoId);

  const nombre = (e: Entrada) => (
    <>
      <span className="ranking__nombre">{e.nombre_usuario}</span>
      {e.id === yoId && <Etiqueta tono="turquesa">Tú</Etiqueta>}
    </>
  );

  return (
    <PaginaAlumno titulo="Ranking" subtitulo="Los 100 pilotos con más puntos. Cada ejercicio, misión o reto que superas suma." onLogout={onLogout}>
      {loading && !data && <p className="ranking__vacio">Cargando el ranking…</p>}
      {error && !data && <Aviso tono="error" titulo="No se pudo cargar el ranking">Inténtalo de nuevo en un momento.</Aviso>}
      {data && lista.length === 0 && <p className="ranking__vacio">Todavía no hay nadie con puntos. ¡Estrena tú el ranking!</p>}

      {podio.length > 0 && (
        <ol className="ranking__podio" aria-label="Podio">
          {podio.map((e) => (
            <li key={e.id} className={`ranking__puesto ranking__puesto--${PUESTOS[e.posicion - 1]}${e.id === yoId ? ' yo' : ''}`}>
              <Medal size={30} aria-hidden="true" />
              <span className="ranking__posicion">{e.posicion}.º</span>
              <span className="ranking__quien">{nombre(e)}</span>
              <span className="ranking__puntos"><b>{formatear(e.puntos)}</b> pts</span>
            </li>
          ))}
        </ol>
      )}

      {resto.length > 0 && (
        <ol className="ranking__lista" aria-label="Resto del ranking">
          {resto.map((e) => (
            <li key={e.id} className={e.id === yoId ? 'yo' : ''}>
              <span className="ranking__posicion">{e.posicion}</span>
              <span className="ranking__inicial" aria-hidden="true">{e.nombre_usuario.charAt(0).toUpperCase()}</span>
              <span className="ranking__quien">{nombre(e)}</span>
              <span className="ranking__puntos"><b>{formatear(e.puntos)}</b> pts</span>
            </li>
          ))}
        </ol>
      )}

      {data && lista.length > 0 && barra?.me && !estoy && (
        <p className="ranking__fuera">
          Aún no estás entre los 100 primeros: llevas <strong>{formatear(barra.me.puntos ?? 0)} puntos</strong>. ¡Sigue sumando!
        </p>
      )}
    </PaginaAlumno>
  );
};

export default Ranking;
