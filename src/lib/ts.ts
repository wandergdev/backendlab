// Convierte TypeScript en JavaScript (quitando los tipos) para poder ejecutar los ejercicios en el navegador.
// Sucrase es pequeño y rápido; se carga solo cuando hace falta.
let loader: Promise<typeof import('sucrase')> | null = null;

export async function stripTypes(code: string): Promise<string> {
  loader ??= import('sucrase');
  const { transform } = await loader;
  return transform(code, { transforms: ['typescript'], disableESTransforms: true }).code;
}
