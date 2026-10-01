import { create } from 'zustand';
import { APP_NAME, LEGACY_STORAGE_PREFIX } from '../config';
import { emptyDoc, isDoc } from '../model/doc';
import { findCell } from '../model/ops';
import type { Doc } from '../model/types';

const STORAGE_KEY = `${APP_NAME}:doc`;
const HISTORY_LIMIT = 100;

export interface EditorState {
  doc: Doc;
  past: Doc[];
  future: Doc[];
  selectedCellId: string | null;
  /** The text cell whose words are being typed into, if any. */
  editingCellId: string | null;
  /** Applies a pure edit as one undo step. Edits that return the same doc are ignored. */
  edit: (fn: (doc: Doc) => Doc) => void;
  /** Settings outside the layout (username, marker) change without an undo step. */
  setSetting: (patch: Partial<Pick<Doc, 'username' | 'marker'>>) => void;
  undo: () => void;
  redo: () => void;
  select: (cellId: string | null) => void;
  startEditing: (cellId: string) => void;
  stopEditing: () => void;
}

function keepSelection(doc: Doc, selected: string | null): string | null {
  return selected && findCell(doc, selected) ? selected : null;
}

// Undo and redo only travel through layout; settings stay as the user last set them.
function withSettings(layout: Doc, current: Doc): Doc {
  return { ...layout, username: current.username, marker: current.marker };
}

export function createEditorState(initial: Doc) {
  return create<EditorState>()((set) => ({
    doc: initial,
    past: [],
    future: [],
    selectedCellId: null,
    editingCellId: null,
    edit: (fn) =>
      set((s) => {
        const next = fn(s.doc);
        if (next === s.doc) return s;
        return {
          doc: next,
          past: [...s.past, s.doc].slice(-HISTORY_LIMIT),
          future: [],
          selectedCellId: keepSelection(next, s.selectedCellId),
          editingCellId: keepSelection(next, s.editingCellId)
        };
      }),
    setSetting: (patch) => set((s) => ({ doc: { ...s.doc, ...patch } })),
    undo: () =>
      set((s) => {
        const prev = s.past.at(-1);
        if (!prev) return s;
        const doc = withSettings(prev, s.doc);
        return {
          doc,
          past: s.past.slice(0, -1),
          future: [s.doc, ...s.future],
          selectedCellId: keepSelection(doc, s.selectedCellId)
        };
      }),
    redo: () =>
      set((s) => {
        const next = s.future[0];
        if (!next) return s;
        const doc = withSettings(next, s.doc);
        return {
          doc,
          past: [...s.past, s.doc],
          future: s.future.slice(1),
          selectedCellId: keepSelection(doc, s.selectedCellId)
        };
      }),
    select: (cellId) =>
      set((s) => ({ selectedCellId: cellId, editingCellId: s.editingCellId === cellId ? s.editingCellId : null })),
    startEditing: (cellId) => set({ selectedCellId: cellId, editingCellId: cellId }),
    stopEditing: () => set({ editingCellId: null })
  }));
}

// Storage can be missing or throw (private windows, blocked site data); the editor
// then starts empty and simply doesn't remember.
function loadDoc(): Doc {
  try {
    // Fall back to what was saved before the app had its name.
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(`${LEGACY_STORAGE_PREFIX}:doc`);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isDoc(parsed)) return parsed;
    }
  } catch {
    // fall through to an empty document
  }
  return emptyDoc();
}

function saveDoc(doc: Doc): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch {
    // not saved; the session still works
  }
}

export const useEditor = createEditorState(loadDoc());

useEditor.subscribe((state, prev) => {
  if (state.doc !== prev.doc) saveDoc(state.doc);
});
