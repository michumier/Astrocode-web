import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { BookOpen, Lightbulb, Target } from 'lucide-react';
import { Boton } from '../ui';
import { enLinea } from '../enunciado/Enunciado';
import './PorQue.css';

// Encima del enunciado (fase 13): qué se practica en este ejercicio, por qué importa y la lección
// que lo explica. Si la tarea no está en la ruta (retos diarios, sabotajes) o falla la consulta, no sale nada.
export const GET_POR_QUE = gql`
  query PorQue($id: ID!) {
    tarea(id: $id) {
      id
      practica
      porque
      leccionRepaso {
        id
        titulo
      }
    }
  }
`;

const PorQue: React.FC<{ tareaId: string }> = ({ tareaId }) => {
  const { data } = useQuery(GET_POR_QUE, { variables: { id: tareaId }, errorPolicy: 'ignore' });
  const t = data?.tarea;
  if (!t?.practica && !t?.porque) return null;

  return (
    <aside className="por-que" aria-label="Qué practicas y por qué">
      {t.practica && (
        <p className="por-que__fila">
          <Target size={16} aria-hidden="true" />
          <span><strong>Practicas:</strong> {enLinea(t.practica)}</span>
        </p>
      )}
      {t.porque && (
        <p className="por-que__fila">
          <Lightbulb size={16} aria-hidden="true" />
          <span><strong>Por qué:</strong> {enLinea(t.porque)}</span>
        </p>
      )}
      {t.leccionRepaso && (
        <Boton a={`/leccion/${t.leccionRepaso.id}`} variante="fantasma" tamano="peq" className="por-que__leccion"
          icono={<BookOpen size={15} aria-hidden="true" />}>
          Repasar la lección: {t.leccionRepaso.titulo}
        </Boton>
      )}
    </aside>
  );
};

export default PorQue;
