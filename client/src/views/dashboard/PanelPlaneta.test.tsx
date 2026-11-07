import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import PanelPlaneta from './PanelPlaneta';
import type { PlanetaRuta } from '../../utils/ruta';

const tarea = (id: string, titulo: string, tipo: string, puntosBase: number, extra: any = {}) =>
  ({ id, titulo, tipo, puntosBase, nivel: { nombre: 'Fácil' }, categoria: { nombre: 'Variables' }, ...extra });

const venus = (estados: PlanetaRuta['pasos'][number]['estado'][], estado: PlanetaRuta['estado'] = 'abierto'): PlanetaRuta => ({
  clave: 'venus', nombre: 'Venus', tema: 'Tomar decisiones', orden: 2, bonus: 150, estado,
  hechos: estados.filter((e) => e === 'hecho').length, total: 4,
  pasos: [
    tarea('1', 'Variables espaciales', 'codigo', 50),
    tarea('2', 'Cuenta regresiva', 'codigo', 100),
    tarea('3', 'La huella del PIN', 'reto', 150, { formato: 'camara' }),
    tarea('4', 'Aterrizaje lunar', 'pilotaje', 200),
  ].map((t, i) => ({ orden: i + 1, tipo: 'tarea', estado: estados[i], tarea: t })),
});

const montar = (planeta = venus(['hecho', 'siguiente', 'bloqueado', 'bloqueado'])) => {
  const alCerrar = jest.fn();
  const alAbrir = jest.fn();
  render(<PanelPlaneta planeta={planeta} cargando={false} alCerrar={alCerrar} alAbrir={alAbrir} />);
  return { alCerrar, alAbrir };
};

test('los pasos van numerados; solo el siguiente se empieza, los hechos se repiten y los demás están bloqueados', () => {
  const { alAbrir } = montar();
  expect(screen.getByRole('button', { name: 'Empezar Cuenta regresiva' })).toHaveClass('ui-boton--primario');
  expect(screen.queryByRole('button', { name: 'Empezar La huella del PIN' })).toBeNull();
  expect(screen.getAllByText('Bloqueado: completa antes los pasos anteriores')).toHaveLength(2);
  expect(screen.getByLabelText('Paso 3')).toHaveTextContent('3');
  fireEvent.click(screen.getByRole('button', { name: 'Repetir Variables espaciales' }));
  expect(alAbrir).toHaveBeenCalledWith(expect.objectContaining({ id: '1', estado: 'hecho' }));
  expect(screen.getByText('1 de 4 hechos · +150 pts al conquistarlo')).toBeInTheDocument();
  expect(screen.getByText('Tomar decisiones')).toBeInTheDocument();
});

test('un planeta conquistado lo dice en la cabecera', () => {
  montar(venus(['hecho', 'hecho', 'hecho', 'hecho'], 'conquistado'));
  expect(screen.getByText(/Conquistado · 4 de 4/)).toBeInTheDocument();
});

test('la constelación del planeta sale en la cabecera', () => {
  montar(venus(['hecho', 'hecho', 'siguiente', 'bloqueado']));
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
