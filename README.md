# ⚙️ BackendLab

Web para aprender los fundamentos del desarrollo backend **viéndolos**, no solo leyéndolos.
Basada en [The Backend Developer Fundamentals Guide](https://dev.to/edriso/the-backend-developer-fundamentals-guide-3j55). En español, con traducción al inglés (botón 🇪🇸/🇬🇧).

## Dos stacks: Node.js + TypeScript y C# + ASP.NET Core + EF Core

El botón 🟩/🟪 de la cabecera (y las pestañas de cada bloque de código) cambian **todos** los ejemplos entre Node/TS y C#/.NET. Así ves que el concepto es el mismo y solo cambia la sintaxis.

- **17 módulos de fundamentos** (los del artículo), con ejemplos en ambos stacks.
- **4 módulos de stack**: TypeScript esencial, C# esencial, ASP.NET Core y Entity Framework Core, con simuladores propios (pipeline de middleware, ciclos de vida de DI, LINQ visual, LINQ → SQL ejecutado en una base de datos real, change tracking).
- Los ejercicios de código se escriben en **TypeScript** y se ejecutan de verdad en el navegador; al terminar se muestra la versión en C#. (C# no puede ejecutarse en el navegador sin descargar un runtime pesado, así que los ejercicios de C# son de completar, ordenar y elegir.)

## El método

Cada módulo repite el mismo ciclo:

| Paso | Qué es |
|---|---|
| 👀 **Ver** | Lección animada: una idea por pantalla, con la "fórmula" en bloques (como `L + A = LA`), diagramas que se reproducen como un video, una analogía del mundo real y un ejemplo de código. |
| 🔁 **Repetir** | Práctica: opción múltiple, ordenar, emparejar, completar código, escribir, SQL real y funciones JS con pruebas. **Lo que fallas vuelve a salir** hasta que lo aciertas. |
| 🧪 **Hacer** | Laboratorios con objetivos: terminal Linux, Git, SQLite real, una API con login y tokens, inyección SQL, XSS, JWT, caché, balanceador de carga, Docker, CI/CD… |
| 🧠 **Recordar** | Tarjetas con repetición espaciada (sistema Leitner, cajas 1–5). Al terminar una lección, sus tarjetas entran a tu repaso diario. |

El progreso (XP, racha, tarjetas, objetivos) se guarda en el `localStorage` del navegador. No hay cuentas ni servidor.

## Cómo correrla

Necesitas [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
npm run dev        # http://localhost:5173
```

Otros comandos:

```bash
npm run build      # versión de producción en dist/
npm run preview    # sirve dist/ localmente
npm run typecheck  # revisa los tipos de TypeScript
npm run validate   # valida TODO el contenido (ver abajo)
```

## Publicarla

`npm run build` genera una web estática en `dist/` que funciona en cualquier hosting gratuito (GitHub Pages, Netlify, Vercel, Cloudflare Pages). Usa rutas con `#` y rutas relativas, así que no hace falta configurar nada en el servidor.

## Estructura

```
src/
  content/
    modules/m01-…m17-….ts   ← el contenido de cada módulo (lección, práctica, labs, tarjetas)
    glossary.ts            ← glosario
  components/
    visuals/               ← bloques, diagramas de secuencia, líneas de ensamblaje, tablas
    exercises/             ← los tipos de ejercicio, la sesión de práctica y las tarjetas
    sims/                  ← los simuladores (se cargan bajo demanda)
  lib/                     ← API simulada, SQLite (sql.js), terminal, Git, criptografía
  store/progress.ts        ← progreso y repetición espaciada
  pages/                   ← las pantallas
scripts/validate.ts        ← validador de contenido
```

## Añadir o editar contenido

Todo el contenido son datos en `src/content/modules/`. Los textos bilingües se escriben con `t('español', 'english')`; un string simple sirve para ambos idiomas (código, números, comandos).

Para dar una versión .NET a un ejemplo, añade `dotnet: { lang: 'csharp', src: '...' }` al bloque de código; para un ejercicio, añade `dotnet: { ...ejercicio alternativo }`. Los ejercicios de código aceptan `csharp: '...'` con la solución equivalente.

Después de editar, corre `npm run validate`. Comprueba que:

- cada solución de ejercicio de código (TypeScript) pase sus pruebas (y que el código inicial no),
- cada solución SQL corra contra la base de datos de práctica,
- los índices de respuesta, los huecos de "completar" y los IDs sean válidos (también en las variantes .NET),
- todos los textos tengan español e inglés,
- cada simulador usado exista.
