import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import Biblioteca from './Biblioteca';
import { PARA_IR_MAS_ALLA, RECURSOS } from './contenido';
import { GET_BARRA } from '../comun/PaginaAlumno';
import { GET_RUTA } from '../../utils/ruta';

const BARRA = { request: { query: GET_BARRA }, result: { data: { me: { id: '7', nombre_usuario: 'ana_23', nombre_completo: null, puntos: 0, rol: 'alumno' } } } };

const tarea = (id: string) => ({
  id, tipo: 'codigo', formato: null, titulo: `Tarea ${id}`, descripcion: '', puntosBase: 50, codigoBase: '', resultadoEsperado: '',
  categoria: { nombre: 'Variables' }, nivel: { nombre: 'Fácil' },
});
const leccion = (id: string, titulo: string, estado: string) => ({ orden: Number(id), tipo: 'leccion', estado, tarea: null, leccion: { id, titulo } });
const RUTA = [
  { clave: 'mercurio', nombre: 'Mercurio', tema: 'Primer contacto', orden: 1, bonus: 100, estado: 'abierto', hechos: 2, total: 4, pasos: [
    leccion('1', 'Tu primer programa', 'hecho'),
    leccion('2', 'Variables', 'siguiente'),
    { orden: 3, tipo: 'tarea', estado: 'bloqueado', tarea: tarea('1'), leccion: null },
    leccion('3', 'Tipos de datos', 'bloqueado'),
  ] },
  { clave: 'venus', nombre: 'Venus', tema: 'Tomar decisiones', orden: 2, bonus: 150, estado: 'bloqueado', hechos: 0, total: 1, pasos: [
    leccion('6', 'Comparar', 'bloqueado'),
  ] },
];

const montar = () =>
  render(
    <MockedProvider addTypename={false} mocks={[BARRA, { request: { query: GET_RUTA }, result: { data: { ruta: RUTA } } }]}>
      <MemoryRouter><Biblioteca /></MemoryRouter>
    </MockedProvider>,
  );

test('las lecciones se agrupan por planeta: las vistas se repasan, la siguiente se empieza y el resto espera', async () => {
  montar();
  expect(await screen.findByText('1 de 4 vistas')).toBeInTheDocument();
  const mercurio = screen.getByRole('heading', { name: 'Mercurio' }).closest('section')!;
  expect(within(mercurio).getByText('Primer contacto')).toBeInTheDocument();
  expect(within(mercurio).getByText('1 de 3')).toBeInTheDocument();
  expect(within(mercurio).getByRole('link', { name: 'Repasar Tu primer programa' })).toHaveAttribute('href', '/leccion/1');
  expect(within(mercurio).getByRole('link', { name: 'Empezar Variables' })).toHaveAttribute('href', '/leccion/2');
  expect(within(mercurio).queryByRole('link', { name: /Tipos de datos/ })).toBeNull();
  // Los ejercicios no salen en la biblioteca, solo las lecciones
  expect(screen.queryByText('Tarea 1')).toBeNull();
  const venus = screen.getByRole('heading', { name: 'Venus' }).closest('section')!;
  expect(within(venus).getByText('Aún no has llegado')).toBeInTheDocument();
});

test('«Para ir más allá» tiene los temas que no entran en la ruta, con su ejemplo y su índice', async () => {
  montar();
  expect(PARA_IR_MAS_ALLA.map((c) => c.id)).toEqual(['excepciones', 'archivos', 'modulos', 'generadores', 'decoradores', 'asincrona']);
  for (const c of PARA_IR_MAS_ALLA) {
    expect(c.cuando.length).toBeGreaterThan(20);
    expect(c.codigo.trim().length).toBeGreaterThan(40);
  }
  const indice = await screen.findByRole('navigation', { name: 'Índice: para ir más allá' });
  expect(within(indice).getByRole('link', { name: 'Decoradores: @' })).toHaveAttribute('href', '#biblioteca-decoradores');
  expect(document.getElementById('biblioteca-decoradores')).not.toBeNull();
  // El código sale coloreado (spans con el color del editor), no como texto plano
  expect(document.querySelector('.biblioteca__codigo span[style]')).not.toBeNull();
});

test('los recursos se abren aparte y de forma segura', async () => {
  montar();
  const enlaces = await screen.findAllByRole('link', { name: /se abre en otra pestaña/ });
  expect(enlaces).toHaveLength(RECURSOS.length);
  for (const a of enlaces) {
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel', 'noopener noreferrer');
  }
});
