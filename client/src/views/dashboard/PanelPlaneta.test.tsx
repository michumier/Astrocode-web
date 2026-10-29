import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import PanelPlaneta from './PanelPlaneta';

const ejercicios = [
  { id: '1', title: 'Variables espaciales', difficulty: 'Fácil', points: 50, tipo: 'codigo', categoria: 'Variables' },
  { id: '2', title: 'Cuenta regresiva', difficulty: 'Fácil', points: 100, tipo: 'codigo', categoria: 'Bucles' },
  { id: '3', title: 'La huella del PIN', difficulty: 'Fácil', points: 150, tipo: 'reto', formato: 'camara' },
  { id: '4', title: 'Aterrizaje lunar', difficulty: 'Intermedio', points: 200, tipo: 'pilotaje' },
];

const montar = (hechos: string[] = ['1']) => {
  const alCerrar = jest.fn();
  const alAbrir = jest.fn();
  render(<PanelPlaneta planeta="Venus" ejercicios={ejercicios} cargando={false}
    completado={(id) => hechos.includes(id)} alCerrar={alCerrar} alAbrir={alAbrir} />);
  return { alCerrar, alAbrir };
};

test('el primero sin hacer es la acción principal; los hechos se pueden repetir', () => {
  const { alAbrir } = montar();
  const siguiente = screen.getByRole('button', { name: 'Empezar Cuenta regresiva' });
  expect(siguiente).toHaveClass('ui-boton--primario');
  expect(screen.getByRole('button', { name: 'Empezar La huella del PIN' })).toHaveClass('ui-boton--secundario');
  fireEvent.click(screen.getByRole('button', { name: 'Repetir Variables espaciales' }));
  expect(alAbrir).toHaveBeenCalledWith(ejercicios[0]);
  expect(screen.getByText('1 de 4 hechos')).toBeInTheDocument();
});

test('la constelación del planeta sale en la cabecera', () => {
  montar(['1', '2']);
  expect(screen.getByRole('img')).toHaveAccessibleName(
    'Constelación de Venus: 2 de 4 ejercicios hechos; el siguiente es La huella del PIN'
  );
});

test('los filtros enseñan solo los tipos que hay y filtran la lista', () => {
  montar();
  const filtros = screen.getByRole('group', { name: 'Filtrar por tipo' });
  expect(within(filtros).getAllByRole('button').map((b) => b.textContent)).toEqual(
    ['Todo · 4', 'Ejercicios · 2', 'Retos · 1', 'Misiones · 1']
  );
  fireEvent.click(within(filtros).getByRole('button', { name: 'Retos · 1' }));
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  expect(screen.getByText('Reto · Cámara acorazada')).toBeInTheDocument();
});

test('se cierra con Escape y con el botón', () => {
  const { alCerrar } = montar();
  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar y volver al mapa' }));
  expect(alCerrar).toHaveBeenCalledTimes(2);
});
