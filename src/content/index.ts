import type { Card, Exercise, Module } from '../types';
import { internet } from './modules/m01-internet';
import { requestResponse } from './modules/m02-request-response';
import { server } from './modules/m03-server';
import { dataFlow } from './modules/m04-data-flow';
import { memory } from './modules/m05-memory';
import { databases } from './modules/m06-databases';
import { apis } from './modules/m07-apis';
import { auth } from './modules/m08-auth';
import { caching } from './modules/m09-caching';
import { security } from './modules/m10-security';
import { architecture } from './modules/m11-architecture';
import { networking } from './modules/m12-networking';
import { linux } from './modules/m13-linux';
import { git } from './modules/m14-git';
import { testing } from './modules/m15-testing';
import { devops } from './modules/m16-devops';
import { roadmap } from './modules/m17-roadmap';
import { typescript } from './modules/m18-typescript';
import { csharp } from './modules/m19-csharp';
import { aspnet } from './modules/m20-aspnet';
import { efcore } from './modules/m21-efcore';

export const MODULES: Module[] = [
  internet, requestResponse, server, dataFlow, memory, databases, apis, auth, caching,
  security, architecture, networking, linux, git, testing, devops, roadmap,
  typescript, csharp, aspnet, efcore,
];

export const getModule = (id: string | undefined) => MODULES.find((m) => m.id === id);

export const CARD_INDEX: Record<string, { card: Card; module: Module }> = Object.fromEntries(
  MODULES.flatMap((m) => m.cards.map((card) => [card.id, { card, module: m }])),
);

/** Ejercicios para el repaso mezclado: práctica + comprobaciones de lección de los módulos indicados. */
export function mixedExercises(moduleIds: string[], count = 12): Exercise[] {
  const pool = MODULES.filter((m) => moduleIds.includes(m.id)).flatMap((m) => [
    ...m.practice.filter((e) => e.type !== 'sql' && e.type !== 'code'),
    ...m.lesson.flatMap((s) => (s.kind === 'check' ? [s.exercise] : [])),
  ]);
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}
