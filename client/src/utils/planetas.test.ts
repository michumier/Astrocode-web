import { ejerciciosDelPlaneta, planetasDelNivel } from './planetas';
import { limpiarTitulo } from './tareas';

const nivel = (codigos: number, retos: number, misiones: number) => [
  ...Array.from({ length: codigos }, (_, i) => ({ id: String(i + 1), tipo: 'codigo' })),
  ...Array.from({ length: retos }, (_, i) => ({ id: String(100 + i), tipo: 'reto' })),
  ...Array.from({ length: misiones }, (_, i) => ({ id: String(200 + i), tipo: 'pilotaje' })),
];

test('los planetas que comparten nivel se reparten todos sus ejercicios, sin repetir ninguno', () => {
  const ejercicios = nivel(7, 8, 1);
  const partes = planetasDelNivel(1).map((p) => ejerciciosDelPlaneta(p, ejercicios));
  expect(partes.map((p) => p.length)).toEqual([7, 5, 4]);
  const ids = partes.flat().map((e) => e.id);
  expect(new Set(ids).size).toBe(ejercicios.length);
});

test('cada planeta recibe su mezcla de tipos y el primero, lo más básico', () => {
  const ejercicios = nivel(7, 8, 1);
  const mercurio = ejerciciosDelPlaneta('mercurio', ejercicios);
  const tierra = ejerciciosDelPlaneta('tierra', ejercicios);
  expect(mercurio.map((e) => e.id)).toEqual(['1', '2', '3', '100', '101', '102', '200']);
  expect(tierra.filter((e) => e.tipo === 'reto')).toHaveLength(2);
  expect(tierra.filter((e) => e.tipo === 'codigo').map((e) => e.id)).toEqual(['6', '7']);
});

test('el orden de llegada no cambia el reparto y Saturno se queda su nivel entero', () => {
  const ejercicios = nivel(5, 3, 0);
  const alReves = [...ejercicios].reverse();
  expect(ejerciciosDelPlaneta('marte', alReves)).toEqual(ejerciciosDelPlaneta('marte', ejercicios));
  expect(ejerciciosDelPlaneta('saturno', ejercicios)).toHaveLength(8);
});

test('limpiarTitulo quita los emojis del principio y deja el resto', () => {
  expect(limpiarTitulo('🚀 Aterrizaje de emergencia')).toBe('Aterrizaje de emergencia');
  expect(limpiarTitulo('☄️ Cinturón de asteroides')).toBe('Cinturón de asteroides');
  expect(limpiarTitulo('🕵️ Sabotaje: Validar Paréntesis')).toBe('Sabotaje: Validar Paréntesis');
  expect(limpiarTitulo('Suma 2 + 2 🚀')).toBe('Suma 2 + 2 🚀');
  expect(limpiarTitulo(null)).toBe('');
});
