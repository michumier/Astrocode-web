import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import Exercise from './Exercise';

// CodeMirror se publica como módulos ES que el Jest de CRA no transforma: aquí basta un editor falso
jest.mock('../../components/code-editor/CodeEditor', () => ({
  __esModule: true,
  default: () => null,
  lineaDeError: () => null,
}));

const base = {
  id: '7',
  title: 'Recuento de satélites',
  difficulty: 'Fácil',
  points: 100,
  categoria: 'Bucles',
  description: 'Cuenta los satélites.\n\n**Objetivos:**\n- Usa un bucle\n- Imprime el total',
  codigoBase: 'total = 0\n',
  resultadoEsperado: '3',
};

const montar = (datos: any) =>
  render(<MockedProvider mocks={[]} addTypename={false}><Exercise exerciseData={datos} onBackToDashboard={() => undefined} /></MockedProvider>);

test('un ejercicio normal: enunciado con formato, una sola acción principal y su salida vacía', () => {
  montar(base);
  expect(screen.getByRole('heading', { level: 1, name: 'Recuento de satélites' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Objetivos' })).toBeInTheDocument();
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(document.querySelectorAll('.ui-boton--primario')).toHaveLength(1);
  expect(screen.getByRole('button', { name: /Ejecutar/ })).toHaveClass('ui-boton--primario');
  expect(screen.getByText(/para probar y corregir tu código/)).toBeInTheDocument();
  expect(screen.queryByText('Alerta de sabotaje')).toBeNull();
});

test('un sabotaje enseña la alerta y reiniciar vuelve al código saboteado', () => {
  montar({ ...base, title: '🕵️ Sabotaje: Recuento de satélites', tipo: 'sabotaje', contexto: 'Alguien ha tocado el contador de satélites.' });
  expect(screen.getByText('Alerta de sabotaje')).toBeInTheDocument();
  expect(screen.getByText(/Alguien ha tocado el contador de satélites/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Volver al código saboteado original' })).toBeInTheDocument();
  expect(screen.getByText('Sabotaje')).toHaveClass('ui-etiqueta--dificil');
  expect(screen.getByRole('heading', { level: 1, name: 'Recuento de satélites' })).toBeInTheDocument();
});

test('sin ejercicio, ofrece volver al mapa', () => {
  montar(null);
  expect(screen.getByRole('heading', { name: 'No se ha encontrado el ejercicio' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Volver al mapa' })).toBeInTheDocument();
});
