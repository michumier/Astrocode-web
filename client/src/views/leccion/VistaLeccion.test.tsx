import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import VistaLeccion, { GET_LECCION, RESPONDER } from './VistaLeccion';
import { GET_BARRA } from '../comun/PaginaAlumno';

// CodeMirror se publica como módulos ES que el Jest de CRA no transforma: aquí basta un editor falso
jest.mock('../../components/code-editor/CodeEditor', () => ({ __esModule: true, default: () => null }));

const LECCION = {
  id: '3', titulo: 'if y else: la nave decide', planeta: 'Venus', completada: false,
  bloques: [
    { tipo: 'texto', texto: 'Para eso está `if`: **ejecuta un bloque solo si se cumple una condición**.', codigo: null, pista: null },
    { tipo: 'codigo', texto: null, codigo: 'combustible = 18\nif combustible < 20:\n    print("Reserva")', pista: 'Cambia `18` por `50`.' },
    { tipo: 'error', texto: 'Olvidar los dos puntos da `SyntaxError`.', codigo: 'if combustible < 20\n    print("Reserva")', pista: null },
  ],
  pregunta: { codigo: 'print("Normal")', opciones: ['Normal', 'Revisado', 'Nada'] },
  siguiente: { tipo: 'tarea', id: '25', titulo: '🛰️ Recuento de satélites' },
};

const respuesta = (opcion: number, r: any) => ({
  request: { query: RESPONDER, variables: { leccionId: '3', opcion } },
  result: { data: { responderLeccion: { yaCompletada: false, planetaConquistado: null, ...r } } },
});

const montar = (mocks: any[] = [], leccion = LECCION) => {
  const alSiguiente = jest.fn();
  render(
    <MockedProvider addTypename={false} mocks={[
      { request: { query: GET_LECCION, variables: { id: '3' } }, result: { data: { leccion } } },
      { request: { query: GET_BARRA }, result: { data: { me: { id: '7', nombre_usuario: 'ana', nombre_completo: null, puntos: 100, rol: 'alumno' } } } },
      ...mocks,
    ]}>
      <MemoryRouter><VistaLeccion leccionId="3" alSiguiente={alSiguiente} /></MemoryRouter>
    </MockedProvider>,
  );
  return { alSiguiente };
};

test('enseña el texto, el ejemplo con su pista, el error típico y la pregunta con sus opciones', async () => {
  montar();
  expect(await screen.findByRole('heading', { level: 1, name: 'if y else: la nave decide' })).toBeInTheDocument();
  expect(screen.getByText(/Lección · Venus/)).toBeInTheDocument();
  expect(screen.getByText('Pruébalo:')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Ejecutar/ })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'El error típico' })).toBeInTheDocument();
  expect(screen.getByText('¿Qué imprime?')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /^Opción [ABC]/ })).toHaveLength(3);
  // Sin completar: solo se puede volver al mapa, y no es la acción principal
  expect(screen.queryByRole('button', { name: /Siguiente/ })).toBeNull();
});

test('fallar explica por qué y bloquea esa opción; acertar da los puntos y lleva al siguiente paso', async () => {
  const { alSiguiente } = montar([
    respuesta(1, { correcta: false, explicacion: 'Revisado no depende del if.', puntos: 0 }),
    respuesta(0, { correcta: true, explicacion: 'Exacto, se cumple la condición.', puntos: 10 }),
  ]);
  fireEvent.click(await screen.findByRole('button', { name: 'Opción B' }));
  expect(await screen.findByText('No es esa')).toBeInTheDocument();
  expect(screen.getByText('Revisado no depende del if.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Opción B (incorrecta)' })).toBeDisabled();

  fireEvent.click(screen.getByRole('button', { name: 'Opción A' }));
  expect(await screen.findByText('¡Correcto! +10 pts')).toBeInTheDocument();
  const siguiente = screen.getByRole('button', { name: /Siguiente: Recuento de satélites/ });
  expect(siguiente).toHaveClass('ui-boton--primario');
  fireEvent.click(siguiente);
  expect(alSiguiente).toHaveBeenCalledWith(LECCION.siguiente);
});

test('una lección ya completada lo dice y deja seguir desde el principio', async () => {
  montar([], { ...LECCION, completada: true });
  expect(await screen.findByText(/Ya completaste esta lección/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Siguiente: Recuento de satélites/ })).toBeInTheDocument();
});

test('si la lección está cerrada por la ruta, enseña el motivo', async () => {
  render(
    <MockedProvider addTypename={false} mocks={[
      { request: { query: GET_LECCION, variables: { id: '3' } }, result: { errors: [{ message: 'Completa antes los pasos anteriores de Venus', extensions: { code: 'FORBIDDEN' } } as any] } },
      { request: { query: GET_BARRA }, result: { data: { me: { id: '7', nombre_usuario: 'ana', nombre_completo: null, puntos: 100, rol: 'alumno' } } } },
    ]}>
      <MemoryRouter><VistaLeccion leccionId="3" alSiguiente={jest.fn()} /></MemoryRouter>
    </MockedProvider>,
  );
  expect(await screen.findByText('Completa antes los pasos anteriores de Venus.')).toBeInTheDocument();
});
