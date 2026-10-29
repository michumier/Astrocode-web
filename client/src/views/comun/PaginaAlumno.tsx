import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { BarraSuperior } from '../../components/ui';
import './Pagina.css';

export const GET_BARRA = gql`
  query BarraAlumno {
    me {
      id
      nombre_usuario
      nombre_completo
      puntos
      rol
    }
  }
`;

interface PropsPagina {
  titulo: string;
  subtitulo?: React.ReactNode;
  // A la derecha del título (filtros, acciones…)
  extra?: React.ReactNode;
  onLogout?: () => void;
  className?: string;
  children: React.ReactNode;
}

// Marco de las páginas del alumno que no son el mapa (perfil, ranking, guía): la misma barra
// que el mapa y un título. Así se navega igual desde todas.
const PaginaAlumno: React.FC<PropsPagina> = ({ titulo, subtitulo, extra, onLogout, className, children }) => {
  const navigate = useNavigate();
  const { data } = useQuery(GET_BARRA, { fetchPolicy: 'cache-and-network', errorPolicy: 'all' });
  const me = data?.me;

  return (
    <div className="pagina">
      <BarraSuperior puntos={me ? me.puntos ?? 0 : null} nombre={me?.nombre_completo || me?.nombre_usuario}
        alPerfil={() => navigate('/perfil')} alSalir={onLogout} />
      <main className={`pagina__cuerpo${className ? ` ${className}` : ''}`}>
        <header className="pagina__cabecera">
          <div>
            <h1>{titulo}</h1>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          {extra}
        </header>
        {children}
      </main>
    </div>
  );
};

export default PaginaAlumno;
