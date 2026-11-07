import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import Perfil, { GET_PERFIL, calcularHitos } from './Perfil';
import { GET_BARRA } from '../comun/PaginaAlumno';
import { GET_RUTA } from '../../utils/ruta';

const ME = { id: '7', nombre_usuario: 'ana_23', correo_electronico: 'ana@correo.com', nombre_completo: 'Ana Pérez', puntos: 620, rol: 'alumno', creado_el: '2026-10-01T10:00:00.000Z' };

const tarea = (id: string) => ({
  id, tipo: 'codigo', formato: null, titulo: `Tarea ${id}`, descripcion: '', puntosBase: 50, codigoBase: '', resultadoEsperado: '',
  categoria: { nombre: 'Variables' }, nivel: { nombre: 'Fácil' },
});
const planeta = (clave: string, nombre: string, orden: number, estado: string, pasos: [string, string][]) => ({
  clave, nombre, tema: `Tema de ${nombre}`, orden, bonus: 100 * orden, estado,
  hechos: pasos.filter(([, e]) => e === 'hecho').length, total: pasos.length,
  pasos: pasos.map(([id, e], i) => ({ orden: i + 1, tipo: 'tarea', estado: e, tarea: tarea(id) })),
});

const RUTA = [
  planeta('mercurio', 'Mercurio', 1, 'conquistado', [['1', 'hecho'], ['2', 'hecho']]),
  planeta('venus', 'Venus', 2, 'abierto', [['3', 'hecho'], ['4', 'siguiente'], ['5', 'bloqueado'], ['6', 'bloqueado']]),
  planeta('tierra', 'Tierra', 3, 'bloqueado', [['7', 'bloqueado']]),
  planeta('marte', 'Marte', 4, 'bloqueado', [['8', 'bloqueado']]),
  planeta('jupiter', 'Júpiter', 5, 'bloqueado', [['9', 'bloqueado']]),
  planeta('saturno', 'Saturno', 6, 'bloqueado', [['10', 'bloqueado']]),
];

test('los hitos salen de lo hecho de verdad', () => {
  const ninguno = calcularHitos([], new Set(['mercurio']), 0);
  expect(ninguno.every((h) => !h.conseguido)).toBe(true);
  const algunos = calcularHitos([{ tipo: 'codigo' }, { tipo: 'pilotaje' }], new Set(['mercurio', 'venus']), 1);
  expect(algunos.filter((h) => h.conseguido).map((h) => h.id)).toEqual(['despegue', 'piloto', 'constelacion']);
  const todo = calcularHitos([{ tipo: 'sabotaje' }, { tipo: 'reto' }], new Set(['mercurio', 'venus', 'tierra', 'marte', 'jupiter', 'saturno']), 5);
  expect(todo.filter((h) => h.conseguido).map((h) => h.id)).toEqual(['despegue', 'sabotajes', 'insolito', 'constelacion', 'marte', 'saturno']);
});

test('el perfil enseña los datos, el rumbo a la conquista del planeta en curso y los planetas cerrados', async () => {
  render(
    <MockedProvider addTypename={false} mocks={[
      { request: { query: GET_PERFIL }, result: { data: { me: ME, tareasCompletadas: [{ id: '1', tipo: 'codigo' }, { id: '2', tipo: 'codigo' }, { id: '3', tipo: 'pilotaje' }] } } },
      { request: { query: GET_BARRA }, result: { data: { me: { id: '7', nombre_usuario: 'ana_23', nombre_completo: 'Ana Pérez', puntos: 620, rol: 'alumno' } } } },
      { request: { query: GET_RUTA }, result: { data: { ruta: RUTA } } },
    ]}>
      <MemoryRouter><Perfil /></MemoryRouter>
    </MockedProvider>,
  );

  expect(await screen.findByRole('heading', { level: 2, name: 'Ana Pérez' })).toBeInTheDocument();
  expect(screen.getByText(/@ana_23/)).toBeInTheDocument();
  expect(await screen.findByRole('progressbar', { name: 'Conquista de Venus' })).toHaveAttribute('aria-valuenow', '25');
  expect(screen.getByText(/3 pasos/)).toBeInTheDocument();

  const planetas = screen.getByRole('heading', { name: 'Tus constelaciones' }).parentElement!;
  expect(within(planetas).getAllByRole('heading', { level: 3 })).toHaveLength(6);
  expect(within(planetas).getByText('Conquistado')).toBeInTheDocument();
  expect(within(planetas).getByText('Conquista Venus para abrir Tierra.')).toBeInTheDocument();

  // Hitos conseguidos y pendientes, con su estado para lectores de pantalla
  expect(screen.getByText('Piloto').textContent).toContain('(conseguido)');
  expect(screen.getByText('Cazasabotajes').textContent).toContain('(pendiente)');
});
