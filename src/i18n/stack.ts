import type { Exercise, ExerciseBase } from '../types';
import { setSetting, useProgress } from '../store/progress';

export type Stack = 'node' | 'dotnet';

export const STACKS: Record<Stack, { label: string; short: string; emoji: string; color: string }> = {
  node: { label: 'Node.js · TypeScript', short: 'Node/TS', emoji: '🟩', color: '#3c873a' },
  dotnet: { label: 'C# · ASP.NET Core · EF Core', short: 'C#/.NET', emoji: '🟪', color: '#7c4dff' },
};

/** El stack elegido (Node/TS o C#/.NET) decide qué versión de los ejemplos de código se muestra. */
export function useStack() {
  const stack = useProgress((s) => s.settings.stack ?? 'node');
  return { stack, setStack: (v: Stack) => setSetting('stack', v), isDotnet: stack === 'dotnet' };
}

export function pickExercise(ex: Exercise, stack: Stack): ExerciseBase {
  return stack === 'dotnet' && ex.dotnet ? ex.dotnet : ex;
}
