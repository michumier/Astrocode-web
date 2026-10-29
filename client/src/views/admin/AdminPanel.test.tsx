import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import AdminPanel, { GET_OPCIONES } from './AdminPanel';
import { GET_BARRA } from '../comun/PaginaAlumno';

const BARRA = { request: { query: GET_BARRA }, result: { data: { me: { id: '1', nombre_usuario: 'admin', nombre_completo: null, puntos: 0, rol: 'admin' } } } };
const opciones = (ia: boolean) => ({
  request: { query: GET_OPCIONES },
  result: { data: { iaDisponible: ia, categorias: [{ id: '3', nombre: 'Bucles' }], niveles: [{ id: '1', nombre: 'Fácil' }] } },
});

const montar = (ia: boolean) =>
  render(
    <MockedProvider addTypename={false} mocks={[BARRA, opciones(ia)]}>
      <MemoryRouter><AdminPanel /></MemoryRouter>
    </MockedProvider>,
  );

test('sin IA lo explica; con IA enseña el formulario con sus campos etiquetados', async () => {
  const { unmount } = montar(false);
  expect(await screen.findByText('La IA no está activada')).toBeInTheDocument();
  unmount();
  montar(true);
  expect(await screen.findByLabelText('Tema')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Nivel' })).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Categoría' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Generar borrador/ })).toHaveClass('ui-boton--primario');
});

test('las pestañas cambian entre ejercicios y sabotajes', async () => {
  montar(true);
  expect(screen.getByRole('tab', { name: 'Ejercicios con IA' })).toHaveAttribute('aria-selected', 'true');
  fireEvent.click(screen.getByRole('tab', { name: 'Sabotajes' }));
  expect(screen.getByRole('tab', { name: 'Sabotajes' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('heading', { name: 'Sabotajes' })).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Ejercicio' })).toBeInTheDocument();
});
