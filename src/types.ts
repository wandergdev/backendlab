// Tipos de todo el contenido educativo.
// Un texto puede ser bilingüe ({ es, en }) o un string que es igual en ambos idiomas (código, números, comandos).

export type L = { es: string; en: string };
export type Txt = L | string;

/** Atajo para escribir contenido bilingüe. */
export const t = (es: string, en: string): L => ({ es, en });

// ---------- Visuales reutilizables ----------

export type BlockPiece = { label: Txt; emoji?: string; color?: string };

export type SeqActor = { id: string; label: Txt; emoji: string };
export type SeqMessage = { from: string; to: string; label: Txt; note?: Txt; color?: string };

export type PipeStage = {
  emoji: string;
  label: Txt;
  desc?: Txt;
  /** Si existe, el usuario puede activar/desactivar esta condición y ver dónde se detiene el flujo. */
  gate?: { question: Txt; failResult: Txt };
};

export type GridItem = { badge: string; title: Txt; desc: Txt; color?: string };

export type Visual =
  | { type: 'blocks'; pieces: BlockPiece[]; result: Txt; resultEmoji?: string }
  | { type: 'sequence'; actors: SeqActor[]; messages: SeqMessage[] }
  | { type: 'pipeline'; item: Txt; itemEmoji: string; stages: PipeStage[]; success: Txt; vertical?: boolean }
  | { type: 'grid'; items: GridItem[]; columns?: number }
  | { type: 'compare'; left: CompareSide; right: CompareSide }
  | { type: 'table'; name: string; columns: string[]; rows: (string | number)[][]; highlight?: number[] }
  | { type: 'sim'; id: SimId; props?: Record<string, unknown> };

export type CompareSide = { title: Txt; emoji: string; points: Txt[]; color?: string };

export type CodeLang = 'js' | 'ts' | 'csharp' | 'sql' | 'json' | 'bash' | 'http' | 'docker' | 'graphql' | 'yaml' | 'text';
export type BaseSnippet = { lang: CodeLang; src: string; caption?: Txt };
/** Si existe `dotnet`, el bloque de código se muestra en Node/TS o en C#/.NET según el selector de stack. */
export type CodeSnippet = BaseSnippet & { dotnet?: BaseSnippet };

// ---------- Lecciones ----------

export type Step =
  | {
      kind: 'concept';
      title: Txt;
      emoji?: string;
      body: Txt;
      visual?: Visual;
      analogy?: { real: Txt; code: Txt };
      code?: CodeSnippet;
      tip?: Txt;
    }
  | { kind: 'check'; exercise: Exercise }
  | { kind: 'recap'; points: Txt[] };

// ---------- Ejercicios ----------

export type ExerciseBase =
  | { type: 'mcq'; q: Txt; code?: CodeSnippet; options: Txt[]; answer: number; explain: Txt }
  | { type: 'tf'; q: Txt; answer: boolean; explain: Txt }
  | { type: 'order'; q: Txt; items: Txt[]; explain: Txt }
  | { type: 'match'; q: Txt; pairs: [Txt, Txt][]; explain: Txt }
  | { type: 'fill'; q: Txt; lang?: CodeLang; template: string; blanks: string[]; distractors: string[]; explain: Txt }
  | { type: 'type'; q: Txt; code?: CodeSnippet; accept: string[]; placeholder?: string; explain: Txt }
  | { type: 'sql'; q: Txt; solution: string; check?: string; hint: Txt; explain: Txt }
  | { type: 'code'; q: Txt; fn: string; starter: string; solution: string; tests: CodeTest[]; explain: Txt; csharp?: string };

/** Un ejercicio puede tener una versión alternativa para el stack C#/.NET. */
export type Exercise = ExerciseBase & { dotnet?: ExerciseBase };

/** args: argumentos simples · call: expresión JS que usa la función (para pasar callbacks o promesas). */
export type CodeTest = { args?: unknown[]; call?: string; expect: unknown; label?: Txt };

// ---------- Laboratorios (simuladores con objetivos) ----------

export type SimId =
  | 'dns' | 'ports' | 'tcp' | 'httpPlayground' | 'statusSort' | 'serverLoop' | 'middleware'
  | 'layers' | 'threads' | 'memory' | 'sqlPlayground' | 'joinViz' | 'transaction' | 'index'
  | 'jsonExplorer' | 'restDesigner' | 'graphqlVsRest' | 'hashLab' | 'jwtLab' | 'cacheSim'
  | 'cacheLayers' | 'injectionLab' | 'xssLab' | 'rateLimit' | 'httpsSniff' | 'monoMicro'
  | 'mvc' | 'pubsub' | 'osi' | 'tcpUdp' | 'websocket' | 'loadBalancer' | 'terminal' | 'git'
  | 'testRunner' | 'pyramid' | 'docker' | 'cicd' | 'roadmap'
  | 'compileQuiz' | 'linqViz' | 'aspnetPipeline' | 'diLifetimes' | 'efQuery' | 'efTracking';

export type Lab = { id: string; sim: SimId; title: Txt; desc: Txt; props?: Record<string, unknown> };

// ---------- Tarjetas de repaso ----------

export type Card = { id: string; front: Txt; back: Txt; emoji?: string };

// ---------- Módulo ----------

export type Module = {
  id: string;
  /** core = los 17 fundamentos del artículo · stack = módulos de Node/TS y C#/.NET */
  track?: 'core' | 'stack';
  num: number;
  emoji: string;
  color: string;
  title: L;
  tagline: L;
  /** La "fórmula" del módulo: la idea central en piezas, como L + A = LA. */
  formula: { pieces: BlockPiece[]; result: Txt };
  lesson: Step[];
  practice: Exercise[];
  labs: Lab[];
  cards: Card[];
};
