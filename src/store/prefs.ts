import { create } from 'zustand';
import type { ColorMode } from '../model/types';

export type Lang = 'en' | 'zh-TW';

interface Prefs {
  /** Which of GitHub's color modes the canvas previews. */
  mode: ColorMode;
  lang: Lang;
  setMode: (mode: ColorMode) => void;
  setLang: (lang: Lang) => void;
}

const KEY = 'readme-canvas:prefs';

function initial(): Pick<Prefs, 'mode' | 'lang'> {
  let mode: ColorMode = 'light';
  let lang: Lang = 'en';
  try {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) mode = 'dark';
    if (/^zh/i.test(navigator.language)) lang = 'zh-TW';
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Prefs>;
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
