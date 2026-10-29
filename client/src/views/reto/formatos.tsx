import React from 'react';
import {
  BookOpen, FlaskConical, FolderOpen, Languages, LockOpen, LucideIcon, Map, MessagesSquare, Paintbrush, Paperclip,
  Play, Radio, RadioTower, Rocket, Scissors, Search, Sprout, Target, Vault,
} from 'lucide-react';
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
import VisorRadio from '../../components/visor-reto/radio/VisorRadio';
import MaterialRadio from '../../components/visor-reto/radio/MaterialRadio';
import VisorColonia from '../../components/visor-reto/colonia/VisorColonia';
import MaterialColonia from '../../components/visor-reto/colonia/MaterialColonia';

// Registro de formatos de reto (fase 5). Cada formato aporta su visor y su pestaña de material;
// los que no tienen aún los suyos usan los genéricos. Las misiones de pilotaje usan VisorMision.
export interface Formato {
  etiqueta: string;
  // Botón que ejecuta un escenario visible, con su icono
  probar: string;
  IconoProbar: LucideIcon;
  // Pestaña con el material (manual, ejemplos, expediente...)
  tituloMaterial: string;
  IconoMaterial: LucideIcon;
  // Título de la enhorabuena al superarlo
  exito: string;
  Visor: React.FC<PropsVisor>;
  Material: React.FC<PropsMaterial>;
}

const GENERICO: Omit<Formato, 'etiqueta'> = {
  probar: 'Probar',
  IconoProbar: Play,
  tituloMaterial: 'Material',
  IconoMaterial: Paperclip,
  exito: '¡Reto superado!',
  Visor: VisorGenerico,
  Material: MaterialGenerico,
};

const FORMATOS: Record<string, Partial<Formato>> = {
  pilotaje: { probar: 'Lanzar', IconoProbar: Rocket, exito: '¡Misión cumplida!' },
  diagnostico: { tituloMaterial: 'Datos de calibración', IconoMaterial: FlaskConical },
  bomba: { probar: 'Desactivar', IconoProbar: Scissors, tituloMaterial: 'Manual', IconoMaterial: BookOpen, exito: '¡Bomba desactivada!', Visor: VisorBomba, Material: MaterialBomba },
  lengua: { probar: 'Traducir', IconoProbar: Languages, tituloMaterial: 'Ejemplos', IconoMaterial: MessagesSquare, exito: '¡Los alienígenas te entienden!', Visor: VisorLengua, Material: MaterialLengua },
  camara: { probar: 'Intentar abrir', IconoProbar: LockOpen, tituloMaterial: 'Cámaras', IconoMaterial: Vault, exito: '¡Cámara abierta!', Visor: VisorCamara, Material: MaterialCamara },
  impostor: { probar: 'Acusar', IconoProbar: Search, tituloMaterial: 'Expediente', IconoMaterial: FolderOpen, exito: '¡Impostor desenmascarado!', Visor: VisorImpostor, Material: MaterialImpostor },
  nebulosa: { probar: 'Pintar', IconoProbar: Paintbrush, tituloMaterial: 'Objetivos', IconoMaterial: Target, exito: '¡Nebulosa pintada!', Visor: VisorNebulosa, Material: MaterialNebulosa },
  radio: { probar: 'Transmitir', IconoProbar: RadioTower, tituloMaterial: 'Frecuencias', IconoMaterial: Radio, exito: '¡Señal recibida!', Visor: VisorRadio, Material: MaterialRadio },
  colonia: { probar: 'Sembrar', IconoProbar: Sprout, tituloMaterial: 'Mapas', IconoMaterial: Map, exito: '¡Terraformación completada!', Visor: VisorColonia, Material: MaterialColonia },
};

export const formatoDe = (id: string): Formato => ({
  ...GENERICO,
  etiqueta: etiquetaFormato(id),
  ...FORMATOS[id],
});
