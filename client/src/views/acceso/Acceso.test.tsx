import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import Acceso, { CREAR_USUARIO, LOGIN, validarRegistro } from './Acceso';
import Bienvenida from './Bienvenida';

// El fondo de estrellas es un lienzo animado: en jsdom no hace falta
jest.mock('../../components/solar-system/Starfield', () => () => null);

const USUARIO = { id: '9', nombre_usuario: 'ana_23', correo_electronico: 'ana@correo.com', nombre_completo: null, puntos: 0 };
const loginOk = (contrasena = 'secreta123'): MockedResponse => ({
  request: { query: LOGIN, variables: { input: { correo_electronico: 'ana@correo.com', contrasena } } },
  result: { data: { login: { token: 'cabecera.cuerpo.firma', usuario: USUARIO } } },
});

const montar = (mocks: MockedResponse[], alEntrar = jest.fn()) => {
  render(<MockedProvider mocks={mocks} addTypename={false}><Acceso onLoginSuccess={alEntrar} /></MockedProvider>);
  return alEntrar;
};

const escribir = (etiqueta: string | RegExp, valor: string) =>
  fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });

beforeEach(() => localStorage.clear());

test('entrar: sin datos marca los campos y no llama a la API', async () => {
  const alEntrar = montar([]);
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(await screen.findByText(/Escribe tu correo/)).toBeInTheDocument();
  expect(screen.getByText('Escribe tu contraseña.')).toBeInTheDocument();
  expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
  expect(alEntrar).not.toHaveBeenCalled();
});

test('entrar: con datos buenos guarda la sesión y avisa', async () => {
  const alEntrar = montar([loginOk()]);
  escribir('Correo electrónico', 'ana@correo.com');
  escribir('Contraseña', 'secreta123');
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  await waitFor(() => expect(alEntrar).toHaveBeenCalled());
  expect(localStorage.getItem('token')).toBe('cabecera.cuerpo.firma');
  expect(JSON.parse(localStorage.getItem('usuario') || '{}').nombre_usuario).toBe('ana_23');
});

test('entrar: credenciales malas da un mensaje claro', async () => {
  montar([{
    request: { query: LOGIN, variables: { input: { correo_electronico: 'ana@correo.com', contrasena: 'mala12345' } } },
    result: { errors: [new GraphQLError('Credenciales inválidas')] },
  }]);
  escribir('Correo electrónico', 'ana@correo.com');
  escribir('Contraseña', 'mala12345');
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(await screen.findByText('El correo o la contraseña no son correctos.')).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
});

test('mostrar la contraseña cambia el tipo del campo', () => {
  montar([]);
  const campo = screen.getByLabelText('Contraseña');
  expect(campo).toHaveAttribute('type', 'password');
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar la contraseña' }));
  expect(campo).toHaveAttribute('type', 'text');
});

test('las reglas del registro son las de la API', () => {
  const base = { usuario: 'ana_23', correo: 'ana@correo.com', nombre: '', contrasena: 'secreta123', repetir: 'secreta123' };
  expect(validarRegistro(base)).toEqual({});
  expect(validarRegistro({ ...base, usuario: 'a' }).usuario).toBeTruthy();
  expect(validarRegistro({ ...base, usuario: 'ana pérez' }).usuario).toBeTruthy();
  expect(validarRegistro({ ...base, correo: 'ana@' }).correo).toBeTruthy();
  expect(validarRegistro({ ...base, contrasena: 'corta', repetir: 'corta' }).contrasena).toBeTruthy();
  expect(validarRegistro({ ...base, repetir: 'otra12345' }).repetir).toBe('Las contraseñas no coinciden.');
});

test('crear cuenta: entra al momento, enseña la bienvenida y nunca guarda la contraseña', async () => {
  const alEntrar = montar([
    {
      request: { query: CREAR_USUARIO, variables: { input: { nombre_usuario: 'ana_23', correo_electronico: 'ana@correo.com', contrasena: 'secreta123' } } },
      result: { data: { crearUsuario: { id: '9', nombre_usuario: 'ana_23' } } },
    },
    loginOk(),
  ]);
  fireEvent.click(screen.getByRole('tab', { name: 'Crear cuenta' }));
  expect(screen.getByRole('tab', { name: 'Crear cuenta' })).toHaveAttribute('aria-selected', 'true');
  escribir('Nombre de usuario', 'ana_23');
  escribir('Correo electrónico', 'ana@correo.com');
  escribir('Contraseña', 'secreta123');
  escribir('Repite la contraseña', 'secreta123');
  fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

  expect(await screen.findByText('ana_23')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1, name: 'Tu mapa es el sistema solar' })).toBeInTheDocument();
  for (let i = 0; i < localStorage.length; i++) {
    expect(localStorage.getItem(localStorage.key(i)!)).not.toContain('secreta123');
  }
  expect(alEntrar).not.toHaveBeenCalled();
});

test('bienvenida: tres pasos, se puede saltar y acaba en el mapa', () => {
  const alTerminar = jest.fn();
  render(<Bienvenida nombre="ana_23" alTerminar={alTerminar} />);
  expect(screen.getByRole('button', { name: /Paso 1 de 3/ })).toHaveAttribute('aria-current', 'step');
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  expect(screen.getByRole('heading', { level: 1, name: 'Cada ejercicio enciende una estrella' })).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  expect(screen.queryByRole('button', { name: 'Saltar' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Ir al mapa' }));
  expect(alTerminar).toHaveBeenCalledTimes(1);
});
