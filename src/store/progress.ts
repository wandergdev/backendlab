import { useRef, useSyncExternalStore } from 'react';

// Todo el progreso vive en el navegador (localStorage). Sin cuentas ni servidor.

export type CardState = { box: number; due: string; seen: number; lapses: number };

export type ProgressState = {
  version: 1;
  settings: { lang: 'es' | 'en'; theme: 'dark' | 'light'; stack: 'node' | 'dotnet' };
  xp: number;
  streak: { count: number; last: string };
  activity: Record<string, number>;
  lessons: Record<string, { step: number; done: boolean }>;
  practice: Record<string, { best: number; runs: number }>;
  tasks: Record<string, boolean>;
  cards: Record<string, CardState>;
  roadmap: Record<string, boolean>;
};

const KEY = 'backendlab:v1';

/** Días de espera según la caja de Leitner (caja 1 = repasar hoy). */
export const BOX_INTERVALS = [0, 0, 1, 3, 7, 16];
export const MAX_BOX = 5;

export function today(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function initial(): ProgressState {
  const prefersLight = typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches;
  return {
    version: 1,
    settings: { lang: 'es', theme: prefersLight ? 'light' : 'dark', stack: 'node' },
    xp: 0,
    streak: { count: 0, last: '' },
    activity: {},
    lessons: {},
    practice: {},
    tasks: {},
    cards: {},
    roadmap: {},
  };
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    const base = initial();
    return { ...base, ...parsed, settings: { ...base.settings, ...parsed.settings } } as ProgressState;
  } catch {
    return initial();
  }
}

let state: ProgressState = load();
const listeners = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* modo privado o almacenamiento bloqueado: la app sigue funcionando en memoria */
  }
}

function update(fn: (s: ProgressState) => ProgressState) {
  state = fn(state);
  save();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getProgress() {
  return state;
}

/**
 * Lee una parte del progreso y se re-renderiza cuando cambia.
 * El resultado se cachea por (estado, selector) para que selectores que devuelven objetos nuevos no causen bucles.
 */
export function useProgress<T>(selector: (s: ProgressState) => T): T {
  const cache = useRef<{ s: ProgressState; sel: unknown; v: T } | null>(null);
  const get = () => {
    const c = cache.current;
    if (c && c.s === state && c.sel === selector) return c.v;
    const v = selector(state);
    cache.current = { s: state, sel: selector, v };
    return v;
  };
  return useSyncExternalStore(subscribe, get, get);
}

// ---------- Acciones ----------

export function setSetting<K extends keyof ProgressState['settings']>(key: K, value: ProgressState['settings'][K]) {
  update((s) => ({ ...s, settings: { ...s.settings, [key]: value } }));
}

export function addXp(amount: number) {
  const d = today();
  update((s) => {
    let streak = s.streak;
    if (streak.last !== d) {
      const continued = streak.last === today(-1);
      streak = { count: continued ? streak.count + 1 : 1, last: d };
    }
    return { ...s, xp: s.xp + amount, streak, activity: { ...s.activity, [d]: (s.activity[d] ?? 0) + amount } };
  });
}

export function setLessonStep(moduleId: string, step: number) {
  update((s) => {
    const prev = s.lessons[moduleId] ?? { step: 0, done: false };
    return { ...s, lessons: { ...s.lessons, [moduleId]: { ...prev, step } } };
  });
}

/** Al terminar una lección, sus tarjetas entran al mazo de repaso (ya las "viste"). */
export function completeLesson(moduleId: string, cardIds: string[]) {
  const first = !state.lessons[moduleId]?.done;
  update((s) => {
    const cards = { ...s.cards };
    for (const id of cardIds) if (!cards[id]) cards[id] = { box: 1, due: today(), seen: 0, lapses: 0 };
    return { ...s, cards, lessons: { ...s.lessons, [moduleId]: { step: 0, done: true } } };
  });
  if (first) addXp(50);
}

export function addCardsToDeck(cardIds: string[]) {
  update((s) => {
    const cards = { ...s.cards };
    for (const id of cardIds) if (!cards[id]) cards[id] = { box: 1, due: today(), seen: 0, lapses: 0 };
    return { ...s, cards };
  });
}

export function recordPractice(moduleId: string, score: number) {
  update((s) => {
    const prev = s.practice[moduleId] ?? { best: 0, runs: 0 };
    return { ...s, practice: { ...s.practice, [moduleId]: { best: Math.max(prev.best, score), runs: prev.runs + 1 } } };
  });
}

export function completeTask(taskId: string, xp = 15) {
  if (state.tasks[taskId]) return;
  update((s) => ({ ...s, tasks: { ...s.tasks, [taskId]: true } }));
  addXp(xp);
}

export function reviewCard(cardId: string, correct: boolean) {
  update((s) => {
    const c = s.cards[cardId] ?? { box: 1, due: today(), seen: 0, lapses: 0 };
    const box = correct ? Math.min(MAX_BOX, c.box + 1) : 1;
    const next: CardState = {
      box,
      due: correct ? today(BOX_INTERVALS[box]) : today(),
      seen: c.seen + 1,
      lapses: c.lapses + (correct ? 0 : 1),
    };
    return { ...s, cards: { ...s.cards, [cardId]: next } };
  });
  if (correct) addXp(2);
}

export function toggleRoadmap(id: string) {
  update((s) => ({ ...s, roadmap: { ...s.roadmap, [id]: !s.roadmap[id] } }));
}

export function resetProgress() {
  const settings = state.settings;
  update(() => ({ ...initial(), settings }));
}

export function dueCardIds(s: ProgressState = state): string[] {
  const d = today();
  return Object.entries(s.cards)
    .filter(([, c]) => c.due <= d)
    .map(([id]) => id);
}

export function level(xp: number) {
  // Cada nivel cuesta un poco más que el anterior.
  let lvl = 1;
  let need = 100;
  let rest = xp;
  while (rest >= need) {
    rest -= need;
    lvl++;
    need = Math.round(need * 1.25);
  }
  return { lvl, into: rest, need };
}
