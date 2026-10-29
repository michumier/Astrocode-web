import { gql } from '@apollo/client';

// Muchos títulos de la API empiezan con un emoji («🚀 Aterrizaje…»); en el rediseño el tipo lo dicen
// los iconos y las etiquetas, así que se quita
export const limpiarTitulo = (titulo?: string | null) =>
  (titulo || '').replace(/^(?:[\p{Extended_Pictographic}\u{FE0F}\u{200D}]+\s*)+/u, '');

// Convierte una tarea de la API al formato que usa la vista de ejercicio
export const mapTareaToExercise = (tarea: any) => ({
  id: tarea.id,
  tipo: tarea.tipo || 'codigo',
  formato: tarea.formato || null,
  contexto: tarea.contexto || null,
  title: limpiarTitulo(tarea.titulo),
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
