import { gql } from '@apollo/client';
import { mapTareaToExercise } from './tareas';
import type { Estrella } from '../components/ui';

// Ruta de aprendizaje (fase 11): la API decide el orden de cada planeta y qué está abierto.
// La web solo lo pinta; los candados se comprueban también en el servidor.
export const GET_RUTA = gql`
  query Ruta {
    ruta {
      clave
      nombre
      tema
      orden
      bonus
      estado
      hechos
      total
      pasos {
        orden
        tipo
        estado
        leccion {
          id
          titulo
        }
        tarea {
          id
          tipo
          formato
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
    }
  }
`;

export type EstadoPaso = 'hecho' | 'siguiente' | 'pendiente' | 'bloqueado';
export type EstadoPlaneta = 'conquistado' | 'abierto' | 'bloqueado';

export interface PasoRuta {
  orden: number;
  // tarea | leccion
  tipo: string;
  estado: EstadoPaso;
  tarea: any;
  leccion?: { id: string; titulo: string } | null;
}

export interface PlanetaRuta {
  clave: string;
  nombre: string;
  tema: string;
  orden: number;
  bonus: number;
  estado: EstadoPlaneta;
  hechos: number;
  total: number;
  pasos: PasoRuta[];
}

// Puntos de una lección: 10 al completarla y 5 más si se acierta a la primera
export const PUNTOS_LECCION = 15;

// Cada paso listo para el panel: los ejercicios como para el editor, y las lecciones con
// tipo 'leccion' (su id lleva prefijo para no chocar con el de una tarea)
export const ejerciciosDe = (planeta?: PlanetaRuta): any[] =>
  (planeta?.pasos || []).flatMap((s): any[] => {
    if (s.tipo === 'leccion' && s.leccion) {
      return [{ id: `leccion-${s.leccion.id}`, leccionId: s.leccion.id, tipo: 'leccion', title: s.leccion.titulo, points: PUNTOS_LECCION, estado: s.estado }];
    }
    return s.tarea ? [{ ...mapTareaToExercise(s.tarea), estado: s.estado }] : [];
  });

export const estrellasDe = (planeta?: PlanetaRuta): Estrella[] => ejerciciosDe(planeta).map((e) => ({
  id: e.id,
  titulo: e.title,
  estado: e.estado === 'hecho' ? 'hecha' : e.estado === 'siguiente' ? 'siguiente' : 'pendiente',
}));

// El planeta en curso: el primero abierto sin conquistar; si están todos conquistados, el último
export const planetaEnCurso = (ruta: PlanetaRuta[]): PlanetaRuta | undefined =>
  ruta.find((p) => p.estado === 'abierto') || [...ruta].reverse().find((p) => p.estado !== 'bloqueado') || ruta[0];

// El siguiente planeta por abrir (el primero bloqueado)
export const proximoPlaneta = (ruta: PlanetaRuta[]) => ruta.find((p) => p.estado === 'bloqueado');

// Por qué está cerrado un planeta: hay que conquistar el anterior
export const motivoBloqueo = (ruta: PlanetaRuta[], clave: string) => {
  const i = ruta.findIndex((p) => p.clave === clave);
  return i > 0 ? `Conquista ${ruta[i - 1].nombre} para abrir ${ruta[i].nombre}.` : '';
};
