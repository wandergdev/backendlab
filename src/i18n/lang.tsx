import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { Txt } from '../types';
import { setSetting, useProgress } from '../store/progress';

export type Lang = 'es' | 'en';

type LangApi = {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Traduce un texto bilingüe del contenido. */
  tr: (x: Txt | undefined) => string;
  /** Texto de interfaz escrito en línea: tx('Siguiente', 'Next'). */
  tx: (es: string, en: string) => string;
};

const LangContext = createContext<LangApi | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const lang = useProgress((s) => s.settings.lang);
  const setLang = useCallback((l: Lang) => setSetting('lang', l), []);
  const tr = useCallback((x: Txt | undefined) => (x == null ? '' : typeof x === 'string' ? x : x[lang]), [lang]);
  const tx = useCallback((es: string, en: string) => (lang === 'es' ? es : en), [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const api = useMemo(() => ({ lang, setLang, tr, tx }), [lang, setLang, tr, tx]);
  return <LangContext.Provider value={api}>{children}</LangContext.Provider>;
}

export function useLang(): LangApi {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang debe usarse dentro de <LangProvider>');
  return ctx;
}
