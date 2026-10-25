import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import './SalaDeMaquinas.css';

const GET_SALA = gql`
  query SalaDeMaquinas {
    salaDeMaquinas {
      bloqueados
      disponibles {
        tareaId
        titulo
        dificultad
        completada
        tareaOriginalTitulo
      }
    }
  }
`;

const ETIQUETA: Record<string, string> = { facil: 'Fácil', media: 'Media', dificil: 'Difícil' };

// Tarjeta del dashboard con los sabotajes desbloqueados (fase 1)
const SalaDeMaquinas: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading } = useQuery(GET_SALA, { fetchPolicy: 'cache-and-network' });
  const sala = data?.salaDeMaquinas;
  const pendientes = sala?.disponibles.filter((s: any) => !s.completada) || [];
  const resueltos = (sala?.disponibles.length || 0) - pendientes.length;

  // Si aún no se ha publicado ningún sabotaje, la tarjeta no aparece
  if (!loading && sala && sala.disponibles.length === 0 && sala.bloqueados === 0) return null;

  return (
    <div className="sala-maquinas-container">
      <div className="sala-maquinas">
        <h2 className="sala-titulo">🕵️ Sala de máquinas</h2>
        {loading && !sala ? (
          <p className="sala-descripcion">Comprobando los sistemas...</p>
        ) : (
          <>
            <p className="sala-descripcion">
              {pendientes.length > 0
                ? `¡Alerta! ${pendientes.length} sistema(s) saboteado(s). Encuentra el fallo y repáralo.`
                : 'Todos los sistemas desbloqueados funcionan. Completa más ejercicios para desbloquear sabotajes.'}
            </p>
            <ul className="sala-lista">
              {pendientes.slice(0, 4).map((s: any) => (
                <li key={s.tareaId}>
                  <button className="sala-item" onClick={() => navigate(`/ejercicio/${s.tareaId}`)}>
                    <span className="sala-item-titulo">{s.tareaOriginalTitulo}</span>
                    <span className={`sala-dificultad ${s.dificultad}`}>{ETIQUETA[s.dificultad] || s.dificultad}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="sala-resumen">
              {resueltos > 0 && <span>✅ {resueltos} reparado(s)</span>}
              {sala?.bloqueados > 0 && <span>🔒 {sala.bloqueados} bloqueado(s)</span>}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SalaDeMaquinas;
