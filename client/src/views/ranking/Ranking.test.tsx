import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import Ranking, { GET_RANKING } from './Ranking';
import { GET_BARRA } from '../comun/PaginaAlumno';

const entrada = (id: string, posicion: number, puntos: number) => ({ id, nombre_usuario: `piloto${id}`, puntos, posicion });

const montar = (lista: any[], yo: { id: string; puntos: number }) =>
  render(
    <MockedProvider addTypename={false} mocks={[
      { request: { query: GET_RANKING }, result: { data: { ranking: lista } } },
      { request: { query: GET_BARRA }, result: { data: { me: { id: yo.id, nombre_usuario: `piloto${yo.id}`, nombre_completo: null, puntos: yo.puntos, rol: 'alumno' } } } },
    ]}>
      <MemoryRouter><Ranking /></MemoryRouter>
    </MockedProvider>,
  );

test('podio con los tres primeros, el resto en lista y «Tú» marcado', async () => {
  montar([entrada('1', 1, 3200), entrada('2', 2, 2100), entrada('3', 3, 1400), entrada('4', 4, 900), entrada('5', 5, 300)], { id: '4', puntos: 900 });
  const podio = await screen.findByRole('list', { name: 'Podio' });
  expect(within(podio).getAllByRole('listitem')).toHaveLength(3);
  expect(within(podio).getByText(/^3.?200$/)).toBeInTheDocument();
  const resto = screen.getByRole('list', { name: 'Resto del ranking' });
  expect(within(resto).getAllByRole('listitem')).toHaveLength(2);
  expect(await within(resto).findByText('Tú')).toBeInTheDocument();
  expect(screen.queryByText(/Aún no estás entre los 100/)).toBeNull();
});

test('si no estás en la lista, te dice tus puntos', async () => {
  montar([entrada('1', 1, 3200)], { id: '9', puntos: 40 });
  expect(await screen.findByText(/Aún no estás entre los 100 primeros/)).toBeInTheDocument();
  expect(screen.getByText('40 puntos')).toBeInTheDocument();
});
