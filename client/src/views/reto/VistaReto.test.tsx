import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import VistaReto, { GET_MISION } from './VistaReto';

// CodeMirror se publica como módulos ES que el Jest de CRA no transforma: aquí basta un editor falso
jest.mock('../../components/code-editor/CodeEditor', () => ({
  __esModule: true,
  default: () => null,
  lineaDeError: () => null,
}));

const tarea = (mision: any, extra: any = {}) => ({
  id: '40',
  tipo: 'reto',
  titulo: 'Calibrar los sensores',
  descripcion: 'Los sensores de la nave miden mal.\n\nObjetivos:\n- Corrige la lectura\n- Devuelve un número',
  codigoBase: 'def calibrar(lectura):\n    return lectura\n',
  resultadoEsperado: 'Las tres lecturas calibradas',
  puntosBase: 300,
  mision: { id: 'calibrar', funcion: 'calibrar', escenarios: ['Sensor A', 'Sensor B'], ocultos: 2, material: null, ...mision },
  ...extra,
});

const montar = (datos: any, error = false) =>
  render(
    <MockedProvider addTypename={false} mocks={[{
      request: { query: GET_MISION, variables: { id: '40' } },
      ...(error ? { error: new Error('Sin conexión') } : { result: { data: { iaDisponible: false, tarea: datos } } }),
    }]}>
      <VistaReto tareaId="40" onBack={() => undefined} />
    </MockedProvider>,
  );

test('un reto con material: título, pestañas, una sola acción principal y su botón de probar', async () => {
  const material = JSON.stringify([{ nombre: 'Sensor A', material: { explicacion: 'Lecturas de calibración' } }]);
  montar(tarea({ formato: 'diagnostico', material }));

  expect(await screen.findByRole('heading', { level: 1, name: 'Calibrar los sensores' })).toBeInTheDocument();
  expect(screen.getByText('Reto · Calibración')).toBeInTheDocument();
  expect(screen.getByText('4 escenarios')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Objetivos' })).toBeInTheDocument();

  const pestanas = screen.getAllByRole('tab');
  expect(pestanas.map((p) => p.textContent)).toEqual(['Reto', 'Datos de calibración']);
  expect(pestanas[0]).toHaveAttribute('aria-selected', 'true');
  fireEvent.click(pestanas[1]);
  expect(screen.getByRole('tab', { name: 'Datos de calibración' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Lecturas de calibración');

  expect(document.querySelectorAll('.ui-boton--primario')).toHaveLength(1);
  expect(screen.getByRole('button', { name: /Enviar/ })).toHaveClass('ui-boton--primario');
  expect(screen.getByRole('button', { name: /^Probar$/ })).toHaveClass('ui-boton--secundario');
  expect(screen.getByRole('combobox', { name: 'Escenario que se prueba' })).toHaveValue('0');
});

test('una misión de pilotaje: sin pestañas, «Lanzar» y la función piloto', async () => {
  montar(tarea({ formato: 'pilotaje' }, { tipo: 'pilotaje' }));

  expect(await screen.findByText('Misión de pilotaje')).toBeInTheDocument();
  expect(screen.queryByRole('tablist')).toBeNull();
  expect(screen.getByRole('button', { name: /^Lanzar$/ })).toBeInTheDocument();
  expect(screen.getAllByText('piloto(sensores)').length).toBeGreaterThan(0);
  // Sin emojis en el marco: los iconos son SVG
  expect(document.querySelector('.reto__barra')?.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
});

test('si no se puede cargar, ofrece volver al mapa', async () => {
  montar(null, true);
  expect(await screen.findByRole('heading', { name: 'No se pudo cargar la misión' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Volver al mapa' })).toBeInTheDocument();
});
