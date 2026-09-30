import { create } from 'zustand';
import type { Section } from '../canvas/paletteItems';

/** Transient editor state that isn't part of the document and isn't saved. */
interface UiState {
  /** Something is being dragged; hover affordances step aside. */
  dragging: boolean;
  /** The gap an "Add row" menu is open at (0 = above the first row). */
  addRowAt: number | null;
  /** The row whose handle menu is open. */
  rowMenu: string | null;
  paletteSection: Section;
  set: (patch: Partial<Omit<UiState, 'set'>>) => void;
}

export const useUi = create<UiState>()((set) => ({
  dragging: false,
  addRowAt: null,
  rowMenu: null,
  paletteSection: 'text',
  set: (patch) => set(patch)
}));
