import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import Perfil, { GET_NIVEL, GET_PERFIL, calcularHitos } from './Perfil';
import { GET_BARRA } from '../comun/PaginaAlumno';

const ME = { id: '7', nombre_usuario: 'ana_23', correo_electronico: 'ana@correo.com', nombre_completo: 'Ana Pérez', puntos: 620, rol: 'alumno', creado_el: '2026-10-01T10:00:00.000Z' };

test('los hitos salen de lo hecho de verdad', () => {
  const ninguno = calcularHitos([], 0, 0);
  expect(ninguno.every((h) => !h.conseguido)).toBe(true);
  const algunos = calcularHitos([{ tipo: 'codigo' }, { tipo: 'pilotaje' }], 620, 0);
  const conseguidos = algunos.filter((h) => h.conseguido).map((h) => h.id);
  expect(conseguidos).toEqual(['despegue', 'piloto', 'marte']);
  expect(calcularHitos([{ tipo: 'sabotaje' }, { tipo: 'reto' }], 1500, 1).filter((h) => h.conseguido).map((h) => h.id))
    .toEqual(['despegue', 'sabotajes', 'insolito', 'marte', 'constelacion', 'saturno']);
});

test('el perfil enseña los datos, el rumbo al siguiente planeta y los planetas cerrados', async () => {
  const nivel = (id: string, tareas: any[]) => ({ request: { query: GET_NIVEL, variables: { nivelId: id } }, result: { data: { tareasPorNivel: tareas } } });
  render(
    <MockedProvider addTypename={false} mocks={[
      { request: { query: GET_PERFIL }, result: { data: { me: ME, tareasCompletadas: [{ id: '1', tipo: 'codigo' }, { id: '4', tipo: 'pilotaje' }] } } },
      { request: { query: GET_BARRA }, result: { data: { me: { id: '7', nombre_usuario: 'ana_23', nombre_completo: 'Ana Pérez', puntos: 620, rol: 'alumno' } } } },
      nivel('1', [{ id: '1', tipo: 'codigo', titulo: 'Uno' }, { id: '2', tipo: 'codigo', titulo: 'Dos' }, { id: '3', tipo: 'codigo', titulo: 'Tres' }, { id: '4', tipo: 'pilotaje', titulo: 'Aterrizaje' }]),
      nivel('2', [{ id: '10', tipo: 'codigo', titulo: 'Diez' }, { id: '11', tipo: 'codigo', titulo: 'Once' }]),
    ]}>
      <MemoryRouter><Perfil /></MemoryRouter>
    </MockedProvider>,
  );

  expect(await screen.findByRole('heading', { level: 2, name: 'Ana Pérez' })).toBeInTheDocument();
  expect(screen.getByText(/@ana_23/)).toBeInTheDocument();
  expect(screen.getByRole('progressbar', { name: 'Camino a Júpiter' })).toHaveAttribute('aria-valuenow', '24');
  expect(screen.getByText(/380 puntos/)).toBeInTheDocument();

  const planetas = screen.getByRole('heading', { name: 'Tus constelaciones' }).parentElement!;
  expect(within(planetas).getByText(/Se abre al llegar a 1.?500 puntos/)).toBeInTheDocument();
  expect(within(planetas).getAllByRole('heading', { level: 3 })).toHaveLength(6);

  // Hitos conseguidos y pendientes, con su estado para lectores de pantalla
  expect(screen.getByText('Piloto').textContent).toContain('(conseguido)');
  expect(screen.getByText('Cazasabotajes').textContent).toContain('(pendiente)');
  expect(screen.queryByText(/Racha de 7 días/)).toBeNull();
});
