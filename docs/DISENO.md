# Sistema de diseño de AstroCode

El sistema nace del rediseño de la fase 6 (octubre de 2026): la dirección A, «parches de misión», con el progreso como **constelación**.

Este documento explica **cómo está hecho y cómo seguir construyendo sin romperlo**.

Otros recursos:
- El muestrario vivo está en `/diseno`, solo en desarrollo (`views/diseno/GuiaDiseno.tsx`).
- El prediseño aprobado está en <https://claude.ai/artifact/EhzYLRtiZoSsgY135Ff24G>.

---

## 1. Principios

1. **El código del alumno es el protagonista.** Cada pantalla de trabajo deja claro qué escribir, qué ha pasado y qué hacer después.
2. **El espacio organiza, no decora.** Los planetas son niveles, las constelaciones son progreso y las órbitas giran.
   - Intocable: el sistema solar con los planetas girando en órbitas planas.
   - Intocable de momento: el logo.
3. **Una acción principal en oro por pantalla:** «Ejecutar», «Enviar», «Entrar», «Volver al mapa»… Todo lo demás es secundario o fantasma.
4. **Progreso visible y honesto.** Solo se enseñan datos reales: los hitos del perfil se calculan de lo hecho y nada es inventado.
5. **Accesible por defecto:**
   - contraste AA;
   - foco visible;
   - pestañas y diálogos con su semántica;
   - todo se mueve menos con «reducir movimiento».

Público: estudiantes de 18 a 23 años que empiezan con Python, en español.

---

## 2. Tokens (`client/src/estilos/base.css`)

Todos los colores, fuentes y curvas son variables `--ac-*`. **No se escriben colores a mano** en las vistas. Las excepciones son los visores de los retos, que tienen colores de juego (cables, píxeles, luces).

### Superficies (de abajo arriba)

| Token | Valor | Uso |
|---|---|---|
| `--ac-noche` | `#0e1c2b` | Fondo de página |
| `--ac-sarga` | `#15263a` | Paneles y tarjetas |
| `--ac-relieve` | `#1c3149` | Elementos dentro de un panel (filas, botón secundario) |
| `--ac-relieve-2` | `#233b57` | Pestaña activa, hover sobre relieve |
| `--ac-linea` | `#2a4260` | Bordes y separadores |
| `--ac-codigo` | `#0a1521` | Editor, salida y bloques de código |

### Texto

| Token | Valor | Contraste |
|---|---|---|
| `--ac-texto` | `#eef3f7` | 15,4:1 sobre noche |
| `--ac-texto-2` | `#d5e0ea` | Texto de cuerpo secundario |
| `--ac-suave` | `#a9bccf` | 7,9:1 sobre sarga. Subtítulos y metadatos |
| `--ac-tenue` | `#7f95ab` | 5,0:1 sobre sarga. Lo menos importante; nunca para texto que haya que leer para actuar |

### Papeles del color

| Token | Papel | Regla |
|---|---|---|
| `--ac-oro` `#f4b942` | **Acción principal y puntos** | Botón primario (texto `--ac-tinta-oro`, 9,4:1), puntos y la siguiente estrella |
| `--ac-turquesa` `#5cc8c2` | **Progreso y lo hecho** | Estrellas encendidas, «superado», enlaces y botón fantasma |
| `--ac-coral` `#ff7a59` | **Solo «Difícil»** | No se usa para nada más |
| `--ac-error` `#ff6b7d` | Errores | Avisos de error, prueba fallida, línea del error |

Cada color tiene su `*-fondo` (16 % de opacidad) para etiquetas y avisos.

En las etiquetas, el texto va un punto más claro (`#86dcd7`, `--ac-oro-claro`, `#ffa58f`) para pasar AA también sobre `relieve` y `relieve-2` (≥4,9:1).

### Tipografía (alojada en la propia web con `@fontsource-variable`)

| Token | Fuente | Uso |
|---|---|---|
| `--ac-display` | Bricolage Grotesque | Títulos (800, `letter-spacing` negativo). Cifras grandes |
| `--ac-ui` | Onest | Todo el texto de interfaz (15 px de base) |
| `--ac-mono` | JetBrains Mono | Código, métricas y registros |

Los títulos van en **mayúscula solo al principio** («Variables y tipos de datos»), nunca en tipo título.

### Formas y movimiento

| Token | Valor |
|---|---|
| `--ac-radio` | 12 px (campos, botones, filas) |
| `--ac-radio-panel` | 18 px (paneles) |
| `--ac-sombra` | Sombra de tarjetas flotantes y diálogos |
| `--ac-ease-out` | `cubic-bezier(.23, 1, .32, 1)`: entradas y respuestas |
| `--ac-pulsar` | 140 ms: al pulsar, `scale(0.97)` |

Reglas del movimiento (Emil Kowalski):
- nada rebota;
- las entradas duran 200–320 ms;
- se anima `transform` y `opacity`, no el tamaño;
- **cada CSS que anima algo tiene su bloque `@media (prefers-reduced-motion: reduce)`**. Los planetas se paran donde están; no desaparecen.

---

## 3. Componentes (`client/src/components/ui`)

| Componente | Para qué | Notas |
|---|---|---|
| `Boton` | Todas las acciones | Variantes `primario` (oro), `secundario`, `fantasma`, `peligro` y `oscuro`; tamaños `peq`, `normal` y `grande`. `cargando` pone `aria-busy` y lo desactiva. Con `a="/ruta"` es un enlace. `soloIcono` exige `aria-label`. **No reenvía `ref`**: para enfocarlo, usa un contenedor |
| `Etiqueta` | Datos cortos (dificultad, puntos, «Tú») | Tonos `neutro`, `facil`, `intermedio`, `dificil`, `turquesa` y `oro`; `icono` opcional. `tonoDeNivel(nivel)` traduce la dificultad |
| `Panel` | Bloque con título | El título es un `h2` enlazado con `aria-labelledby` |
| `Campo` | Input con etiqueta visible | Errores con `aria-invalid` y `aria-describedby`. `accesorio` mete algo dentro, como el ojo de la contraseña |
| `CampoArea` | Textarea | `codigo` lo pone en monoespaciada sobre `--ac-codigo` |
| `CampoSelector` | Desplegable | Flecha propia, que la del sistema no se ve en oscuro |
| `Aviso` | Mensajes | Tonos `exito`, `info`, `atencion` y `error` (`role="alert"` en error, `status` en el resto) |
| `BarraSuperior` | Navegación del alumno | Mapa · Guía · Ranking, puntos y menú de cuenta. Escape cierra el menú y devuelve el foco |
| `Constelacion` | Progreso de un planeta | Misma figura siempre para el mismo planeta (semilla). La siguiente estrella va en oro y titila |
| `Enhorabuena` | Ventana al superar algo | Foco en «Volver al mapa»; Escape y el fondo la cierran. Quien la abre decide adónde vuelve el foco (`alCerrar`) |
| `Calificacion` | 0–3 estrellas | `role="img"` con «N de 3 estrellas» |

Otras piezas compartidas:
- `views/comun/PaginaAlumno`: la barra más un título. Es el marco de perfil, ranking, guía y administración.
- `components/solar-system/SistemaDecorativo`: los planetas del mapa, solo para mirar (acceso y bienvenida).
- `components/code-editor/CodigoResaltado`: código de solo lectura con los colores del editor. Las reglas de color están **solo** en `code-editor/colores.ts`; las usan el editor (`tema.ts`) y este componente.
- `components/enunciado/Enunciado`: enunciados con párrafos, etiquetas («Objetivos:»), listas, **negrita** y `código`, siempre como texto (sin `innerHTML`). `enLinea()` hace lo mismo en una línea.
- `utils/tareas.limpiarTitulo`: quita el emoji del principio de los títulos de la API.

---

## 4. Patrones

- **Pestañas:** `role="tablist"` con botones `role="tab"`, `aria-selected` y `aria-controls`, y un **contenedor** con `role="tabpanel"`. Nunca se pone en un `<form>`: axe lo rechaza.

  Se ve como una cápsula `--ac-sarga` y la pestaña activa en `--ac-relieve-2`. Ejemplos: acceso, retos, guía y administración.
- **Diálogos:** `role="dialog"`, `aria-modal` y `aria-labelledby`. El foco entra al abrir y vuelve a quien lo abrió al cerrar.
- **Zonas con scroll** (enunciado, salida, código de la guía): `tabIndex={0}` y un nombre, para poder desplazarlas con el teclado.
- **Títulos sin saltos:** `h1` por página, `h2` por bloque y `h3` dentro. Si una columna no tiene título visible, lleva un `h2` con la clase `ac-oculto`.
- **Sin emojis en el marco.** Los iconos son de `lucide-react`, con `aria-hidden` si van con texto. Los emojis que traen los datos (enunciados, motivos) se dejan.
- **Números:** `toLocaleString('es-ES')`. Las cifras de 4 dígitos van sin punto («1500»), como manda la RAE.
- **Textos:** en español, de tú y neutros: «Te damos la bienvenida», no «Bienvenido».
- **Carga diferida:** el primer paquete solo lleva el acceso y el mapa. Ejercicio, retos, guía, perfil, ranking y administración se cargan al entrar en ellos (CodeMirror solo con el editor).

---

## 5. Cómo comprobar que algo nuevo respeta el sistema

```bash
cd client
npx tsc --noEmit && npm run test:ci && npm run build      # build sin avisos
../.claude/skills/impeccable/scripts/impeccable detect --json src   # 0 hallazgos
```

En el navegador, sobre la pila aislada:
- axe-core en la página (sin infracciones; el único falso positivo conocido es `.cm-scroller` de CodeMirror, cuya zona editable sí recibe el foco);
- 375 px sin scroll horizontal;
- probar con el teclado.

El repaso final de la fase 6 está en `astrocode-api/docs/pruebas/fase-6.6.md`.
