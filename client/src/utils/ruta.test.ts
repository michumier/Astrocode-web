import { ejerciciosDe, estrellasDe, motivoBloqueo, planetaEnCurso, proximoPlaneta } from './ruta';
import type { PlanetaRuta } from './ruta';

const tarea = (id: string, titulo: string) => ({ id, titulo, tipo: 'codigo', puntosBase: 50, nivel: { nombre: 'Fácil' } });
const planeta = (clave: string, estado: PlanetaRuta['estado'], pasos: [string, PlanetaRuta['pasos'][number]['estado']][]): PlanetaRuta => ({
  clave, nombre: clave[0].toUpperCase() + clave.slice(1), tema: '', orden: 0, bonus: 100, estado,
  hechos: pasos.filter(([, e]) => e === 'hecho').length, total: pasos.length,
  pasos: pasos.map(([id, e], i) => ({ orden: i + 1, tipo: 'tarea', estado: e, tarea: tarea(id, `🚀 Paso ${id}`) })),
});

const RUTA = [
  planeta('mercurio', 'conquistado', [['1', 'hecho'], ['19', 'hecho']]),
  planeta('venus', 'abierto', [['25', 'hecho'], ['16', 'siguiente'], ['8', 'bloqueado']]),
  planeta('tierra', 'bloqueado', [['10', 'bloqueado']]),
];

test('los ejercicios de un planeta llevan su estado y el título limpio', () => {
  expect(ejerciciosDe(RUTA[1]).map((e) => [e.id, e.estado, e.title])).toEqual([
    ['25', 'hecho', 'Paso 25'], ['16', 'siguiente', 'Paso 16'], ['8', 'bloqueado', 'Paso 8'],
  ]);
});

test('las estrellas: hecha, siguiente y el resto pendientes', () => {
  expect(estrellasDe(RUTA[1]).map((e) => e.estado)).toEqual(['hecha', 'siguiente', 'pendiente']);
});

test('el planeta en curso es el primero abierto sin conquistar', () => {
  expect(planetaEnCurso(RUTA)?.clave).toBe('venus');
  expect(proximoPlaneta(RUTA)?.clave).toBe('tierra');
});

test('con todo conquistado, el planeta en curso es el último', () => {
  const todo = RUTA.map((p) => ({ ...p, estado: 'conquistado' as const }));
  expect(planetaEnCurso(todo)?.clave).toBe('tierra');
  expect(proximoPlaneta(todo)).toBeUndefined();
});

test('el motivo de un candado nombra el planeta que hay que conquistar', () => {
  expect(motivoBloqueo(RUTA, 'tierra')).toBe('Conquista Venus para abrir Tierra.');
  expect(motivoBloqueo(RUTA, 'mercurio')).toBe('');
});

test('las lecciones salen como pasos con su id de lección y los puntos que pueden dar', () => {
  const conLeccion: PlanetaRuta = {
    ...RUTA[1],
    pasos: [{ orden: 1, tipo: 'leccion', estado: 'siguiente', tarea: null, leccion: { id: '7', titulo: 'if y else' } }, ...RUTA[1].pasos],
  };
  const [leccion, primero] = ejerciciosDe(conLeccion);
  expect(leccion).toEqual({ id: 'leccion-7', leccionId: '7', tipo: 'leccion', title: 'if y else', points: 15, estado: 'siguiente' });
  expect(primero.id).toBe('25');
  expect(estrellasDe(conLeccion)).toHaveLength(4);
});
