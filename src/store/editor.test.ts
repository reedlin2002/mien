import { describe, expect, it } from 'vitest';
import { emptyDoc, widgetCell } from '../model/doc';
import { insertCell, removeCell } from '../model/ops';
import type { Doc } from '../model/types';
import { createEditorState } from './editor';

const addRow = (id: string) => (doc: Doc) =>
  insertCell(doc, { ...widgetCell('w', 50), id }, { kind: 'new-row', index: doc.rows.length });

const ids = (doc: Doc) => doc.rows.flatMap((r) => r.cells.map((c) => c.id));

describe('editor history', () => {
  it('undoes and redoes layout edits', () => {
    const store = createEditorState(emptyDoc());
    store.getState().edit(addRow('a'));
    store.getState().edit(addRow('b'));
    store.getState().undo();
    expect(ids(store.getState().doc)).toEqual(['a']);
    store.getState().redo();
    expect(ids(store.getState().doc)).toEqual(['a', 'b']);
  });

  it('ignores edits that change nothing', () => {
    const store = createEditorState(emptyDoc());
    store.getState().edit((doc) => doc);
    expect(store.getState().past).toHaveLength(0);
  });

  it('drops the redo stack after a new edit', () => {
    const store = createEditorState(emptyDoc());
    store.getState().edit(addRow('a'));
    store.getState().undo();
    store.getState().edit(addRow('b'));
    store.getState().redo();
    expect(ids(store.getState().doc)).toEqual(['b']);
  });

  it('keeps the username when undoing', () => {
    const store = createEditorState(emptyDoc());
    store.getState().edit(addRow('a'));
    store.getState().setSetting({ username: 'octo' });
    store.getState().undo();
    expect(store.getState().doc.username).toBe('octo');
    expect(ids(store.getState().doc)).toEqual([]);
  });

  it('clears the selection when the selected cell disappears', () => {
    const store = createEditorState(emptyDoc());
    store.getState().edit(addRow('a'));
    store.getState().select('a');
    store.getState().edit((doc) => removeCell(doc, 'a'));
    expect(store.getState().selectedCellId).toBeNull();
    store.getState().undo();
    expect(store.getState().selectedCellId).toBeNull();
  });
});
