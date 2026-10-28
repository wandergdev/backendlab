import type { Module } from '../types';
import type { ProgressState } from '../store/progress';

/** Estado de dominio de un módulo: ⭐ lección · ⭐ práctica ≥ 80% · ⭐ laboratorios explorados. */
export function moduleStatus(m: Module, s: ProgressState) {
  const lesson = !!s.lessons[m.id]?.done;
  const lessonStep = s.lessons[m.id]?.step ?? 0;
  const practiceBest = s.practice[m.id]?.best ?? 0;
  const practice = practiceBest >= 80;
  const labsTouched = m.labs.filter((l) => Object.keys(s.tasks).some((k) => k.startsWith(`${l.id}:`))).length;
  const labs = m.labs.length > 0 && labsTouched === m.labs.length;
  const cardsMastered = m.cards.filter((c) => (s.cards[c.id]?.box ?? 0) >= 3).length;
  const stars = Number(lesson) + Number(practice) + Number(labs);
  const pct = Math.round(((Number(lesson) + practiceBest / 100 + (m.labs.length ? labsTouched / m.labs.length : 1)) / 3) * 100);
  return { lesson, lessonStep, practice, practiceBest, labs, labsTouched, cardsMastered, stars, pct, started: lesson || lessonStep > 0 || practiceBest > 0 || labsTouched > 0 };
}
