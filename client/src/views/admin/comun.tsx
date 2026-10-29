import React from 'react';
import { Aviso } from '../../components/ui';

export type Mensaje = { tipo: 'ok' | 'error'; texto: string };

export const errorDe = (error: any) => error?.graphQLErrors?.[0]?.message || error?.message || 'Algo ha fallado';

// Aviso con el resultado de una acción del panel
export const AvisoMensaje: React.FC<{ mensaje: Mensaje | null }> = ({ mensaje }) =>
  mensaje ? (
    <Aviso tono={mensaje.tipo === 'ok' ? 'exito' : 'error'} titulo={mensaje.tipo === 'ok' ? 'Hecho' : 'No se pudo completar'}>
      {mensaje.texto}
    </Aviso>
  ) : null;
