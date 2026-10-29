import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import Guia from './Guia';
import { NIVELES_GUIA, RECURSOS } from './contenido';
import { GET_BARRA } from '../comun/PaginaAlumno';

const BARRA = { request: { query: GET_BARRA }, result: { data: { me: { id: '7', nombre_usuario: 'ana_23', nombre_completo: null, puntos: 0, rol: 'alumno' } } } };

const montar = () =>
  render(<MockedProvider mocks={[BARRA]} addTypename={false}><MemoryRouter><Guia /></MemoryRouter></MockedProvider>);

test('el contenido de la guía se conserva: tres niveles con cuatro conceptos y código', () => {
  expect(NIVELES_GUIA.map((n) => n.conceptos.length)).toEqual([4, 4, 4]);
  for (const n of NIVELES_GUIA) for (const c of n.conceptos) {
    expect(c.texto.length).toBeGreaterThan(0);
    expect(c.codigo.trim().length).toBeGreaterThan(20);
  }
});

test('las pestañas cambian de nivel y el índice enlaza a cada concepto', () => {
  montar();
  expect(screen.getByRole('tab', { name: 'Básico' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('heading', { name: 'Variables y tipos de datos' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: 'Avanzado' }));
  expect(screen.getByRole('tab', { name: 'Avanzado' })).toHaveAttribute('aria-selected', 'true');
  const indice = screen.getByRole('navigation', { name: /Índice/ });
  const enlace = within(indice).getByRole('link', { name: 'Decoradores' });
  expect(enlace).toHaveAttribute('href', '#guia-decoradores');
  expect(document.getElementById('guia-decoradores')).not.toBeNull();
  // El código sale coloreado (spans con el color del editor), no como texto plano
  expect(document.querySelector('.guia__codigo span[style]')).not.toBeNull();
});

test('los recursos se abren aparte y de forma segura', () => {
  montar();
  const enlaces = screen.getAllByRole('link', { name: /se abre en otra pestaña/ });
  expect(enlaces).toHaveLength(RECURSOS.length);
  for (const a of enlaces) {
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel', 'noopener noreferrer');
  }
});
