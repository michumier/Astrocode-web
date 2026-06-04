# AstroCode — Propuesta de evolución

Basado en lo que me has pedido, aquí tienes una propuesta organizada por áreas.

---

## 1. 🎨 Visual — Sistema solar + interacciones

**Estado actual:** 3 planetas estáticos que orbitan con CSS. Al clickar, se abre un panel lateral con ejercicios.

**Propuesta:**

- **Explosión de partículas al seleccionar un planeta** — cuando haces click, el planeta se expande con una animación de partículas (como un portal abriéndose) y el panel de ejercicios aparece con una transición suave desde la explosión.

- **Zoom al planeta** — en vez de un panel lateral, la cámara "viaja" hacia el planeta seleccionado (efecto parallax). El planeta se agranda y los ejercicios aparecen como asteroides/satélites orbitando alrededor.

- **Cada planeta con estilo único:**
  - 🌍 **Tierra** — tonos verdes/azules, partículas de agua/electricidad
  - 🔴 **Marte** — tonos rojos/anaranjados, partículas de fuego
  - 🪐 **Saturno** — tonos dorados/púrpura, anillos que rotan con los ejercicios

- **Animaciones con Canvas o CSS avanzado:**
  - Fondo de estrellas que se mueven en profundidad (parallax)
  - Estelas de cometas cruzando la pantalla
  - Nebulosas de fondo generadas proceduralmente

- **Transiciones:**
  - Al completar un ejercicio: el planeta brilla + partículas de colores
  - Al subir de nivel: animación de "salto espacial" entre planetas
  - Al desbloquear un planeta: animación de "despertar" con ondas de choque

**Tecnologías:** Canvas API, CSS animations + transitions, keyframes, particle systems ligeros.

---

## 2. 🔗 Apollo Client — Unificación

**Problema actual:** Login, Register y FullRanking usan `fetch()` directo en vez de Apollo Client. El router es custom en vez de react-router (que ya está instalado).

**Propuesta:**

- Migrar login y register a Apollo Client (mutations con `useMutation`)
- Migrar FullRanking a Apollo Client (query con `useQuery`)
- Migrar Router custom a react-router-dom (ya instalado, solo configurar)
- Centralizar errores de GraphQL en un solo sitio (toast/notificaciones)
- Tipado fuerte: generar tipos TypeScript desde el schema GraphQL

**Beneficios:** menos código duplicado, manejo de errores centralizado, caché consistente, navegación por URL.

---

## 3. 🗄️ Base de datos — Plan

**Estado actual:** MySQL en Docker, schema en `BD Astrocode.sql`, seed data incluida.

**Problema:** Si borras los contenedores, pierdes los datos.

**Propuesta: plan a tu elección:**

### Opción A: Docker + volumen persistente (más simple)
```yaml
services:
  mysql-db:
    volumes:
      - mysql_data:/var/lib/mysql
volumes:
  mysql_data:
```
Los datos sobreviven a `docker-compose down`. Sigue siendo local, gratis, sin dependencias externas.

### Opción B: Supabase (gratis, cloud, como gym-log)
- Migrar MySQL → PostgreSQL (Supabase)
- Conexión directa desde la API
- Datos siempre disponibles, backup automático
- Gratis para proyectos pequeños

### Opción C: SQLite (más simple aún, sin Docker)
- Cambiar mysql2 por better-sqlite3
- Un solo archivo `.db` que se guarda en disco
- Cero configuración, cero contenedores

**Recomendación:** Opción A ahora (volumen persistente), Opción B cuando quieras desplegarlo.

---

## 4. 🤖 IA — Ayuda al aprendizaje

**Estado actual:** solo ejecuta código y devuelve stdout/stderr.

**Propuesta — 3 niveles de IA:**

### Nivel 1: Detector de errores común
Sin LLM, con reglas. Analiza el stderr y busca patrones conocidos:

| Error | Sugerencia |
|---|---|
| `NameError: name 'X' is not defined` | "Parece que usaste 'X' sin definirla. ¿Olvidaste asignarla?" |
| `TypeError: ... 'int' ... 'str'` | "Estás mezclando tipos: un número con un texto." |
| `IndentationError` | "Revisa la indentación. Python es sensible a los espacios." |
| `SyntaxError` | "Hay un error de sintaxis. Revisa paréntesis, dos puntos, etc." |

### Nivel 2: Pistas progresivas (sin IA)
Cuando el usuario falla, mostrar pistas de menos a más:

```
Intento 1: ❌ → "Casi, revisa el bucle for"
Intento 2: ❌ → "Pista: necesitas usar range()"
Intento 3: ❌ → "Solución: for i in range(n):"
```

### Nivel 3: IA con RAG (Cognito)
Aquí entra en juego **Cognito**. En lugar de solo decir "error", el sistema:

1. Envía el código del usuario + el enunciado del ejercicio
2. Cognito busca en su base de conocimiento (ejercicios similares, errores comunes, guía de Python)
3. Devuelve una explicación en lenguaje natural de qué falla y cómo arreglarlo

**Ejemplo:**
```
Usuario escribe: 
  for i in 10:
      print(i)

Cognito responde:
  "❌ No puedes iterar sobre un número entero.
   💡 Prueba con range(10) para crear una secuencia.
   📖 Mira la guía de 'Bucles' en la sección Básico."
```

**Integración:** El frontend llama a Cognito (o a un endpoint de la API) cuando el código falla, y muestra la sugerencia en el panel de terminal.

---

## 5. 👑 Panel de Admin

**Propuesta:** Una vista nueva protegida para que tú (o profesores) gestionéis el contenido.

### Funcionalidades:

```
Dashboard Admin
├── 📊 Estadísticas
│   ├── Usuarios totales
│   ├── Ejercicios completados hoy
│   ├── Usuarios activos
│   └── Progreso medio
├── 📝 Gestión de tareas
│   ├── Lista con filtros (categoría, nivel)
│   ├── Crear/editar (título, descripción, código_base, resultado)
│   ├── Duplicar tarea existente
│   └── Previsualizar como alumno
├── 🏷️ Categorías
│   └── CRUD (crear, editar, reordenar)
├── 🎯 Niveles
│   └── CRUD + ajuste de puntos
├── 👥 Usuarios
│   ├── Lista + búsqueda
│   └── Ver progreso individual
└── 🏆 Insignias
    └── CRUD + asignar a usuarios
```

**Tecnología:** Misma app React, vista protegida con rol `admin` en el JWT.

---

## 6. 📝 Tipos de ejercicio adicionales

**Estado actual:** Solo ejercicios de código Python que se ejecutan y se compara el output.

**Propuesta — Más formatos:**

| Tipo | Descripción | Cómo se evalúa |
|---|---|---|
| **Código** (actual) | Escribir Python, ejecutar, comparar output | stdout == expected |
| **Test unitario** | El usuario escribe una función y se prueba con casos ocultos | La API ejecuta tests contra el código |
| **Completar código** | Código con huecos (`__`), el usuario rellena | Regex o comparación parcial |
| **Opción múltiple** | Pregunta teórica con 4 opciones | Selección directa |
| **Ordenar bloques** | Bloques de código desordenados que hay que ordenar | Drag & drop, se compara el orden |
| **Depuración** | Código con bug, el usuario tiene que encontrar el error | Explicación textual (IA) |
| **Quiz rápido** | 3-5 preguntas rápidas al empezar la sesión | Opción múltiple |

El más interesante técnicamente: **Test unitario**. La API ejecuta casos de prueba ocultos. Evalúa si la función del usuario pasa todos. Esto es como LeetCode/HackerRank.

---

## Resumen de la propuesta

| Área | Prioridad | Esfuerzo |
|---|---|---|
| 🎨 Visual (sistema solar mejorado) | Alta | 1-2 semanas |
| 🔗 Unificar Apollo Client | Alta | 2-3 días |
| 🗄️ Base de datos (volumen persistente) | Alta | 1 día |
| 👑 Panel de admin | Alta | 1-2 semanas |
| 🤖 IA + pistas (Nivel 1-2) | Media | 1 semana |
| 🤖 IA + RAG con Cognito (Nivel 3) | Media | 2 semanas |
| 📝 Tipos de ejercicio extra | Media | 1-2 semanas |

---

## Sobre la rama

Dices que quieres un nombre "potente y épico", no una feature cualquiera. Para un proyecto espacial que va a renacer con IA, visuales mejorados y nueva estructura, algo como:

| Nombre | Vibra |
|---|---|
| `feature/galactic-rebirth` | 🌌 El proyecto renace |
| `feature/cosmic-ascension` | 🚀 Ascenso a otro nivel |
| `feature/astral-ignition` | ⚡ Encendido de motores |
| `feature/stellar-awakening` | ✨ Despertar estelar |
| `feature/orion-rising` | 🏹 Orión (el cazador) se eleva |

Mi voto: **`feature/galactic-rebirth`** — porque el proyecto no es una feature nueva, es un renacimiento completo.

---

¿Qué te parece la propuesta? ¿Ajustamos algo, empezamos con alguna parte, o eliges nombre de rama y arrancamos?
