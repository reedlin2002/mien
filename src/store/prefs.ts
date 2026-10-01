import { create } from 'zustand';
import { APP_NAME, LEGACY_STORAGE_PREFIX } from '../config';
import type { ColorMode } from '../model/types';

export type Lang = 'en' | 'zh-TW';

interface Prefs {
  /** Which of GitHub's color modes the canvas previews. */
  mode: ColorMode;
  lang: Lang;
  setMode: (mode: ColorMode) => void;
  setLang: (lang: Lang) => void;
}

const KEY = `${APP_NAME}:prefs`;

function initial(): Pick<Prefs, 'mode' | 'lang'> {
  let mode: ColorMode = 'light';
  let lang: Lang = 'en';
  try {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) mode = 'dark';
    if (/^zh/i.test(navigator.language)) lang = 'zh-TW';
    const stored = localStorage.getItem(KEY) ?? localStorage.getItem(`${LEGACY_STORAGE_PREFIX}:prefs`);
    const saved = JSON.parse(stored ?? '{}') as Partial<Prefs>;
    if (saved.mode === 'light' || saved.mode === 'dark') mode = saved.mode;
    if (saved.lang === 'en' || saved.lang === 'zh-TW') lang = saved.lang;
  } catch {
    // defaults
  }
  return { mode, lang };
}

export const usePrefs = create<Prefs>()((set) => ({
  ...initial(),
  setMode: (mode) => set({ mode }),
  setLang: (lang) => set({ lang })
}));

usePrefs.subscribe(({ mode, lang }) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ mode, lang }));
  } catch {
    // not remembered
  }
});
