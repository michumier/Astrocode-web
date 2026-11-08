import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import PorQue, { GET_POR_QUE } from './PorQue';

const montar = (tarea: any) =>
  render(
    <MockedProvider addTypename={false} mocks={[{ request: { query: GET_POR_QUE, variables: { id: '25' } }, result: { data: { tarea } } }]}>
      <MemoryRouter><PorQue tareaId="25" /></MemoryRouter>
    </MockedProvider>,
  );

test('dice qué practicas, por qué importa y enlaza la lección para repasar', async () => {
  montar({ id: '25', practica: '`if` y `else` con una comparación.', porque: 'Un programa útil no hace siempre lo mismo: reacciona a los datos.', leccionRepaso: { id: '7', titulo: 'if y else: la nave decide' } });
  expect(await screen.findByText('Practicas:')).toBeInTheDocument();
  expect(screen.getByText('if', { selector: 'code' })).toBeInTheDocument();
  expect(screen.getByText(/reacciona a los datos/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Repasar la lección: if y else: la nave decide/ })).toHaveAttribute('href', '/leccion/7');
});

test('si la tarea no tiene «por qué» (retos diarios, sabotajes), no sale nada', async () => {
  const { container } = montar({ id: '25', practica: null, porque: null, leccionRepaso: null });
  await new Promise((r) => setTimeout(r, 0));
  expect(container).toBeEmptyDOMElement();
});
