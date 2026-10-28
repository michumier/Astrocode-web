import React from 'react';
import VisorGenerico, { PropsVisor } from '../../components/visor-reto/VisorGenerico';
import MaterialGenerico, { PropsMaterial } from '../../components/visor-reto/MaterialGenerico';
import { etiquetaFormato } from '../../components/visor-reto/etiquetas';
import VisorBomba from '../../components/visor-reto/bomba/VisorBomba';
import MaterialBomba from '../../components/visor-reto/bomba/MaterialBomba';
import VisorLengua from '../../components/visor-reto/lengua/VisorLengua';
import MaterialLengua from '../../components/visor-reto/lengua/MaterialLengua';
import VisorCamara from '../../components/visor-reto/camara/VisorCamara';
import MaterialCamara from '../../components/visor-reto/camara/MaterialCamara';
import VisorImpostor from '../../components/visor-reto/impostor/VisorImpostor';
import MaterialImpostor from '../../components/visor-reto/impostor/MaterialImpostor';
import VisorNebulosa from '../../components/visor-reto/nebulosa/VisorNebulosa';
import MaterialNebulosa from '../../components/visor-reto/nebulosa/MaterialNebulosa';

// Registro de formatos de reto (fase 5). Cada formato aporta su visor y su pestaña de material;
// los que no tienen aún los suyos usan los genéricos. Las misiones de pilotaje usan VisorMision.
export interface Formato {
  etiqueta: string;
  // Texto del botón que ejecuta un escenario visible
  probar: string;
  // Título de la pestaña con el material (manual, ejemplos, expediente...)
  tituloMaterial: string;
  // Título del modal al superarlo
  exito: string;
  Visor: React.FC<PropsVisor>;
  Material: React.FC<PropsMaterial>;
}

const GENERICO: Omit<Formato, 'etiqueta'> = {
  probar: '▶ Probar',
  tituloMaterial: '📎 Material',
  exito: '🎉 ¡Reto superado!',
  Visor: VisorGenerico,
  Material: MaterialGenerico,
};

const FORMATOS: Record<string, Partial<Formato>> = {
  pilotaje: { probar: '🚀 Lanzar', exito: '🎉 ¡Misión cumplida!' },
  diagnostico: { tituloMaterial: '🧪 Datos de calibración' },
  bomba: { probar: '✂️ Desactivar', tituloMaterial: '📕 Manual', exito: '💚 ¡Bomba desactivada!', Visor: VisorBomba, Material: MaterialBomba },
  lengua: { probar: '🛸 Traducir', tituloMaterial: '🛸 Ejemplos', exito: '🛸 ¡Los alienígenas te entienden!', Visor: VisorLengua, Material: MaterialLengua },
  camara: { probar: '🔓 Intentar abrir', tituloMaterial: '🏦 Cámaras', exito: '🔓 ¡Cámara abierta!', Visor: VisorCamara, Material: MaterialCamara },
  impostor: { probar: '🔍 Acusar', tituloMaterial: '📁 Expediente', exito: '🔍 ¡Impostor desenmascarado!', Visor: VisorImpostor, Material: MaterialImpostor },
  nebulosa: { probar: '🖌️ Pintar', tituloMaterial: '🎯 Objetivos', exito: '🎨 ¡Nebulosa pintada!', Visor: VisorNebulosa, Material: MaterialNebulosa },
};

export const formatoDe = (id: string): Formato => ({
  ...GENERICO,
  etiqueta: etiquetaFormato(id),
  ...FORMATOS[id],
});
