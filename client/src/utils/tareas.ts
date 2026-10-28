import { gql } from '@apollo/client';

// Convierte una tarea de la API al formato que usa la vista de ejercicio
export const mapTareaToExercise = (tarea: any) => ({
  id: tarea.id,
  tipo: tarea.tipo || 'codigo',
  formato: tarea.formato || null,
  contexto: tarea.contexto || null,
  title: tarea.titulo,
  difficulty: tarea.nivel?.nombre || 'Desconocido',
  points: tarea.puntosBase || tarea.puntos || 0,
  description: tarea.descripcion,
  codigoBase: tarea.codigoBase,
  resultadoEsperado: tarea.resultadoEsperado,
  categoria: tarea.categoria?.nombre || 'General'
});

// Para abrir un ejercicio directamente por URL (/ejercicio/:id)
export const GET_TAREA = gql`
  query TareaPorId($id: ID!) {
    tarea(id: $id) {
      id
      tipo
      formato
      contexto
      titulo
      descripcion
      puntosBase
      codigoBase
      resultadoEsperado
      categoria {
        nombre
      }
      nivel {
        nombre
      }
    }
  }
`;
