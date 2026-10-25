# AstroCode — Referencia completa

Plataforma gamificada para aprender Python. TFG de Miguel Mier.

```
API + Python Runner + Web ──docker-compose──► MySQL
```

---

## Arquitectura general

```
┌─────────────────────────────────────────────────────────────┐
│                      docker-compose                          │
│                                                              │
│  ┌──────────────┐    ┌──────────────────┐                   │
│  │  mysql-db     │    │  astrocode-api    │                   │
│  │  MySQL 8.0    │◄──►│  Node/TypeScript  │                   │
│  │  puerto: 3307 │    │  Apollo GraphQL   │                   │
│  └──────────────┘    │  puerto: 4000     │                   │
│                      └────────┬─────────┘                   │
│                               │ HTTP                         │
│                               ▼                              │
│                      ┌──────────────────┐                   │
│                      │  python-runner    │                   │
│                      │  Flask (Python)   │                   │
│                      │  ejecuta código   │                   │
│                      │  puerto: 5000     │                   │
│                      └──────────────────┘                   │
│                                                              │
│  ┌──────────────────┐                                       │
│  │  astrocode-web    │                                       │
│  │  React 19 + TS    │                                       │
│  │  Apollo Client    │                                       │
│  │  puerto: 3000     │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Repositorios

| Proyecto | Ruta local |
|---|---|
| API | `C:\Users\migue\Desktop\projects\Astrocode-API` |
| Web | `C:\Users\migue\Desktop\projects\Astrocode-web` |

---

## Cómo arrancar

### Con Docker (recomendado)

```bash
# Desde la carpeta Astrocode-API (tiene el docker-compose.yml)
docker-compose up -d
```

Esto levanta 4 contenedores:
- `mysql-db` — MySQL en puerto 3307
- `astrocode-api` — GraphQL API en puerto 4000
- `python-runner` — Ejecutor Python en puerto 5000
- `astrocode-web` — Frontend React en puerto 3000

### Sin Docker (solo API para desarrollo)

```bash
cd Astrocode-API
npm install
npm run dev        # arranca con nodemon en puerto 4000
```

Requiere MySQL corriendo localmente y un `.env` configurado.

---

## API — GraphQL (Astrocode-API)

### Stack

| Tecnología | Versión |
|---|---|
| Node.js | 18 |
| TypeScript | 4.9+ |
| Apollo Server | v4 |
| Express | 4 |
| MySQL | 8.0 (via mysql2) |
| JWT | jsonwebtoken |
| bcrypt | 12 rounds |
| Docker | Node 18-alpine |

### Estructura de carpetas

```
src/
├── index.ts              # Entry point
├── schema.ts             # Merge typeDefs
├── config/
│   └── db.ts             # MySQL pool + query helper
├── db/
│   └── BD Astrocode.sql  # Schema + seed data
└── graphql/
    ├── resolvers/
    │   ├── resolvers.ts           # Resolvers root
    │   ├── categoriaResolvers.ts
    │   ├── codeExecutionResolvers.ts
    │   ├── nivelResolvers.ts
    │   ├── tareaResolvers.ts
    │   └── userResolvers.ts
    └── schemas/
        ├── index.ts              # Configura Express + Apollo + DB
        ├── categoriaSchema.ts
        ├── codeExecutionSchema.ts
        ├── nivelSchema.ts
        ├── tareaSchema.ts
        └── userSchema.ts
```

### Queries principales

| Query | Auth | Descripción |
|---|---|---|
| `hello` | No | Health check |
| `usuarios` | No | Lista de usuarios |
| `usuario(id)` | No | Usuario por ID |
| `me` | Sí | Usuario autenticado |
| `categorias` | No | Categorías de ejercicios (16) |
| `niveles` | No | Niveles de dificultad (4) |
| `tareas(filtro)` | No | Ejercicios con filtros |
| `dailyChallenge` | Sí | Reto diario |
| `getUserStats` | Sí | Estadísticas del usuario |
| `tareasCompletadas` | Sí | Tareas completadas por el usuario |
| `esTareaCompletada(tareaId)` | Sí | Verificar si una tarea está completada |

### Mutaciones principales

| Mutation | Auth | Descripción |
|---|---|---|
| `crearUsuario(input)` | No | Registro |
| `login(input)` | No | Login (devuelve JWT) |
| `cambiarContrasena(...)` | Sí | Cambiar contraseña |
| `completarTarea(tareaId, tiempo)` | Sí | Completar ejercicio + ganar puntos |
| `executeCode(input)` | No | Ejecutar código Python |
| CRUD de categorías/niveles/tareas | Sí | Admin |

### Base de datos (MySQL)

**7 tablas:**

| Tabla | Descripción |
|---|---|
| `usuarios` | Usuarios (username, email, password_hash, puntos) |
| `categorias` | 16 categorías (Variables, Bucles, Funciones, etc.) |
| `niveles` | 4 niveles (Fácil=50pts, Intermedio=100pts, Difícil=250pts, Reto Diario=500pts) |
| `tareas` | Ejercicios (título, descripción, código_base, resultado_esperado) |
| `tareas_usuarios` | Relación usuario-tarea completada (con tiempo y puntos) |
| `tiempos_finalizacion` | Bonificaciones por tiempo (2min=100pts, 5min=75pts, etc.) |
| `insignias` | Logros (7 insignias) |
| `insignias_usuarios` | Relación usuario-insignia |

### Python Runner

Microservicio Flask independiente que ejecuta código Python:

```
POST /run   → { "code": "..." } → { stdout, stderr, exit_code }
GET /health → OK
```

- Escribe el código a un archivo temporal `.py`
- Ejecuta `python <file>` con timeout de 5s
- Captura stdout/stderr
- Limpia el archivo temporal
- Docker: python:3.10-slim

---

## Frontend — React (Astrocode-web)

### Stack

| Tecnología | Versión |
|---|---|
| React | 19.1.0 |
| TypeScript | 4.9 |
| Apollo Client | 3.13 |
| GraphQL | 16.11 |
| React Scripts (CRA) | 5 |
| Docker | Node 18-alpine |

### Estructura de carpetas

```
client/src/
├── index.tsx                    # Entry point (ApolloProvider + Router)
├── Router.tsx                   # Router custom (NO react-router)
├── apollo/
│   └── client.ts               # Apollo Client + authLink + JWT
├── types/
│   └── skulpt.d.ts             # Tipos para Skulpt (sin usar)
└── views/
    ├── login/
    │   ├── App.tsx              # Login
    │   ├── Register.tsx         # Registro
    │   └── Welcome.tsx          # Onboarding (3 pasos)
    ├── dashboard/
    │   └── Dashboard.tsx        # Hub principal (996 líneas)
    ├── exercises/
    │   └── Exercise.tsx         # Editor de código + terminal
    ├── profile/
    │   └── Profile.tsx          # Perfil + estadísticas
    ├── python-guide/
    │   └── PythonGuide.tsx      # Guía de Python
    ├── ranking/
    │   └── FullRanking.tsx      # Ranking completo
    └── main/
        ├── Main.tsx             # Vista antigua (sin usar)
        └── Home.tsx             # Vista antigua (sin usar)
```

### Vistas

| Vista | Ruta | Descripción |
|---|---|---|
| Login | `login` | Login + Registro + Welcome |
| Dashboard | `home` | Sistema solar con planetas-nivel, ranking, reto diario |
| Exercise | `exercise` | Editor de código con terminal y timer |
| Profile | `profile` | Stats, progreso, logros |
| Python Guide | `python-guide` | Tutorial Python (Básico/Intermedio/Avanzado) |
| Full Ranking | — | Modal/overlay dentro del Dashboard |

### Sistema de rutas (Router.tsx)

Router custom basado en estado (no react-router). Gestiona 5 vistas mediante `currentView`:
- `'login'` → Login/Register/Welcome
- `'home'` → Dashboard
- `'exercise'` → Exercise
- `'python-guide'` → PythonGuide
- `'profile'` → Profile

### API Client (apollo/client.ts)

- Apollo Client con `createHttpLink` apuntando a `http://localhost:4000/graphql`
- Auth link: lee JWT de localStorage, decodifica, verifica expiración, añade header
- Cache: InMemoryCache con merge policy para `tareasCompletadas`
- Fallback a raw `fetch` para login/register

### Sistema de progresión

```
3 planetas:
  🌍 Tierra  → Fácil    → 0 pts required
  🔴 Marte   → Intermedio → 500 pts required
  🪐 Saturno → Difícil  → 1500 pts required

Puntos por nivel:
  Fácil      → 50 pts base + bonus por tiempo
  Intermedio → 100 pts base + bonus
  Difícil    → 250 pts base + bonus
  Reto Diario → 500 pts base + bonus
```

---

## Conexiones entre API y Web

| Web (componente) | API (query/mutation) |
|---|---|
| Login (App.tsx) | `login` mutation (raw fetch) |
| Register (Register.tsx) | `crearUsuario` mutation (raw fetch) |
| Dashboard (Dashboard.tsx) | `GET_TASKS_BY_LEVEL`, `GET_TOP_USERS`, `GET_CURRENT_USER`, `GET_COMPLETED_TASKS` |
| Exercise (Exercise.tsx) | `EXECUTE_CODE`, `COMPLETAR_TAREA` |
| Profile (Profile.tsx) | `GET_USER_STATS` |
| FullRanking | `usuarios` query (raw fetch) |

---

## Mejoras propuestas

### Corto plazo (1-2 días)

1. **Router con react-router-dom** — El router custom funciona pero react-router ya está instalado. Migrar da navegación por URL, historial, y es más mantenible.

2. **Eliminar raw fetch duplicado** — Login, Register y FullRanking usan `fetch` directo en vez de Apollo Client. Unificar todo en Apollo Client da consistencia, manejo de errores centralizado y caché.

3. **Centralizar estilos** — Cada vista tiene su propio CSS. TailwindCSS está instalado en la raíz pero no se usa en ningún componente. Unificar en un sistema de estilos (Tailwind, CSS modules, o styled components).

### Medio plazo (1-2 semanas)

4. **Skulpt (Python en navegador)** — Los types de Skulpt ya están declarados pero sin usar. Ejecutar Python en el navegador elimina la dependencia del API y el python-runner, da feedback instantáneo y reduce costes de infraestructura.

5. **Tests** — Las dependencias de testing están instaladas pero no hay un solo test. Añadir tests para los componentes clave (login, dashboard, exercise).

6. **Sistema de insignias real** — Las insignias están definidas en la BD y en la API pero en el frontend están hardcodeadas. Conectarlas con la API.

7. **Reto diario funcional** — El botón existe en el Dashboard pero solo hace console.warn. Implementar la lógica.

### Largo plazo (1-3 meses)

8. **Migrar de CRA a Vite** — Create React App está deprecado. Vite da builds 10x más rápidos, mejor DX, y más flexibilidad.

9. **PWA completa** — El manifest.json existe pero no hay service worker ni funcionalidad offline. Añadir caché de ejercicios para trabajar sin conexión.

10. **Modo administrador** — Crear un panel CRUD para gestionar tareas, categorías y niveles desde el frontend.

11. **Sistema de tutorías / hints** — Cuando un usuario se atasca, ofrecer pistas progresivas sin dar la solución completa.

---

## Comandos rápidos

```bash
# API
cd Astrocode-API
npm install            # Instalar dependencias
npm run dev            # Arrancar con nodemon (hot reload)
npm run build          # Compilar TypeScript
npm start              # Arrancar compilado

# Tests (API)
npm test               # Jest integration tests

# Frontend
cd Astrocode-web/client
npm install
npm start              # Arrancar en puerto 3000

# Todo junto
cd Astrocode-API
docker-compose up -d   # Levantar todo (API + DB + Runner + Web)
docker-compose down    # Parar todo
```

---

## Variables de entorno (API .env)

```
JWT_SECRET=astrocode-secret-key-super-secure-2024
PORT=4000
DB_HOST=mysql-db
DB_USER=root
DB_PASSWORD=Michu@gamificado2025
DB_NAME=astrocodebd
DB_PORT=3306
RAPIDAPI_KEY=...
```

---

## Notas técnicas

- La BD tiene RLS desactivado (modo monousuario implícito por TFG)
- Los tests de integración requieren el servidor corriendo en `localhost:4000`
- El ranking usa datos mock cuando la API falla (fallback)
- El python-runner tiene timeout de 5s para evitar loops infinitos
- Los JWT expiran a los 7 días
- Las contraseñas se hashean con bcrypt (12 rounds)
- Hay 2 branches: `main` (versión anterior) y `develop` (activa)
