export const REINTENTOS = { maximo: 3, esperaMs: 2000 } as const;

export class MensajeInvalido extends Error {}

export function esDelMensaje(error: unknown): boolean {
  if (error instanceof SyntaxError || error instanceof MensajeInvalido) return true;
  const codigo = (error as { code?: unknown }).code;
  return typeof codigo === 'string' && (codigo.startsWith('22') || codigo.startsWith('23'));
}

const esperar = (ms: number) => new Promise<void>((listo) => setTimeout(listo, ms));

export function detalle(error: unknown): string {
  const e = error as { message?: string; code?: unknown };
  return e.message || String(e.code ?? error);
}

export async function conReintentos<T>(
  trabajo: () => Promise<T>,
  alFallar: (intento: number, error: Error) => void,
): Promise<T> {
  for (let intento = 1; ; intento++) {
    try {
      return await trabajo();
    } catch (error) {
      if (esDelMensaje(error) || intento >= REINTENTOS.maximo) throw error;
      alFallar(intento, error as Error);
      await esperar(REINTENTOS.esperaMs * intento);
    }
  }
}