import readme from '../docs/readme.mien.json';
import { instantiate, type RowSpec } from './model/doc';
import { replaceRows } from './model/ops';
import { useEditor } from './store/editor';

// Layouts that can be opened straight from a link, e.g. /editor/?open=readme opens the
// layout this project's own README was made from.
const LAYOUTS: Record<string, RowSpec[]> = {
  readme: readme.rows as RowSpec[]
};

/**
 * Loads the layout named in `?open=` (as an undoable edit) and drops the parameter so a
 * reload doesn't load it again. Returns whether something was opened.
 */
export function openFromUrl(): boolean {
  const params = new URLSearchParams(location.search);
  const rows = LAYOUTS[params.get('open') ?? ''];
  if (!rows) return false;
  useEditor.getState().edit((doc) => replaceRows(doc, instantiate(rows)));
  params.delete('open');
  const query = params.toString();
  history.replaceState(null, '', location.pathname + (query ? `?${query}` : '') + location.hash);
  return true;
}
