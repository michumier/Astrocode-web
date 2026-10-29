import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CircleCheck, Lock } from 'lucide-react';
import { Etiqueta, Panel } from '../../components/ui';
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
const TONO: Record<string, 'facil' | 'intermedio' | 'dificil'> = { facil: 'facil', media: 'intermedio', dificil: 'dificil' };
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

// Tarjeta del mapa con los sabotajes desbloqueados (fase 1)
const SalaDeMaquinas: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading } = useQuery(GET_SALA, { fetchPolicy: 'cache-and-network' });
  const sala = data?.salaDeMaquinas;
  const pendientes = sala?.disponibles.filter((s: any) => !s.completada) || [];
  const resueltos = (sala?.disponibles.length || 0) - pendientes.length;

  // Si aún no se ha publicado ningún sabotaje, la tarjeta no aparece
  if (!loading && sala && sala.disponibles.length === 0 && sala.bloqueados === 0) return null;

  return (
    <Panel titulo="Sala de máquinas" className="sala">
      {loading && !sala ? (
        <p className="sala__texto">Comprobando los sistemas…</p>
      ) : (
        <>
          <p className="sala__texto">
            {pendientes.length > 0
              ? `${plural(pendientes.length, 'sistema saboteado', 'sistemas saboteados')}. Encuentra el fallo y repáralo.`
              : 'Todo funciona. Completa más ejercicios para desbloquear sabotajes.'}
          </p>
          {pendientes.length > 0 && (
            <ul className="sala__lista">
              {pendientes.slice(0, 4).map((s: any) => (
                <li key={s.tareaId}>
                  <button className="sala__item" onClick={() => navigate(`/ejercicio/${s.tareaId}`)}>
                    <span className="sala__titulo">{s.tareaOriginalTitulo}</span>
                    <Etiqueta tono={TONO[s.dificultad] || 'neutro'}>{ETIQUETA[s.dificultad] || s.dificultad}</Etiqueta>
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {(resueltos > 0 || sala?.bloqueados > 0) && (
            <p className="sala__resumen">
              {resueltos > 0 && <span><CircleCheck size={15} aria-hidden="true" />{plural(resueltos, 'reparado', 'reparados')}</span>}
              {sala?.bloqueados > 0 && <span><Lock size={15} aria-hidden="true" />{plural(sala.bloqueados, 'bloqueado', 'bloqueados')}</span>}
            </p>
          )}
        </>
      )}
    </Panel>
  );
};

export default SalaDeMaquinas;
