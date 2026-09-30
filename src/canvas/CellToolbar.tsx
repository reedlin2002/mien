import { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { useT, type MessageKey } from '../i18n';
import { duplicateCell, removeCell, setRowAlign, setText } from '../model/ops';
import { htmlToRuns, safeHref } from '../model/text';
import type { Align, Cell, Row, TextKind } from '../model/types';
import { useEditor } from '../store/editor';
import { cx } from '../ui/cx';
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  CheckIcon,
  CopyIcon,
  LinkIcon,
  PencilIcon,
  SmileIcon,
  TrashIcon
} from '../ui/icons';

const ALIGNS: { value: Align; label: MessageKey; Icon: typeof AlignLeftIcon }[] = [
  { value: 'left', label: 'alignLeft', Icon: AlignLeftIcon },
  { value: 'center', label: 'alignCenter', Icon: AlignCenterIcon },
  { value: 'right', label: 'alignRight', Icon: AlignRightIcon }
];

const KINDS: { value: TextKind; short: string; label: MessageKey }[] = [
  { value: 'h1', short: 'H1', label: 'textH1' },
  { value: 'h2', short: 'H2', label: 'textH2' },
  { value: 'h3', short: 'H3', label: 'textH3' },
  { value: 'p', short: '¶', label: 'textP' }
];

const EMOJI = ['👋', '🚀', '✨', '💻', '🔥', '🌱', '📫', '⚡', '😄', '🎯', '🛠️', '📚', '🎮', '☕', '💡', '🤝', '👀', '🌍', '🎨', '📈'];

export function editableFor(cellId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-text-cell="${cellId}"]`);
}

/**
 * Floating toolbar above the selected cell. While text is being typed it keeps focus
 * in the text (buttons act on mousedown without stealing it), so bold and links
 * apply to the words the user selected.
 */
export function CellToolbar({ cell, row, editing }: { cell: Cell; row: Row; editing: boolean }) {
  const t = useT();
  const edit = useEditor((s) => s.edit);
  const select = useEditor((s) => s.select);
  const startEditing = useEditor((s) => s.startEditing);
  const block = cell.block;
  const [panel, setPanel] = useState<'link' | 'emoji' | null>(null);
  const [url, setUrl] = useState('');
  const saved = useRef<Range | null>(null);

  function keepFocus(e: MouseEvent) {
    // Clicking a button would otherwise move focus out of the text being edited.
    if ((e.target as HTMLElement).tagName !== 'INPUT') e.preventDefault();
  }

  function setKind(kind: TextKind) {
    const el = editing ? editableFor(cell.id) : null;
    edit((doc) => setText(doc, cell.id, el ? { kind, runs: htmlToRuns(el) } : { kind }));
  }

  function openLink() {
    const selection = window.getSelection();
    saved.current = selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
    const anchor = selection?.anchorNode?.parentElement?.closest('a');
    setUrl(anchor?.getAttribute('href') ?? '');
    setPanel('link');
  }

  function restoreSelection() {
    const el = editableFor(cell.id);
    el?.focus();
    const selection = window.getSelection();
    if (saved.current && selection) {
      selection.removeAllRanges();
      selection.addRange(saved.current);
    }
  }

  function applyLink() {
    restoreSelection();
    const href = safeHref(url);
    if (href) document.execCommand('createLink', false, href);
    else document.execCommand('unlink');
    setPanel(null);
  }

  return (
    <span
      data-cell-toolbar
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={keepFocus}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className="absolute bottom-full left-1/2 z-30 mb-2 flex -translate-x-1/2 cursor-default flex-col items-center font-sans text-sm leading-none font-normal text-ink select-none"
      contentEditable={false}
    >
      {panel === 'link' && (
        <span className="mb-1 flex items-center gap-1 rounded-lg border border-line bg-white p-1 shadow-md">
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyLink();
              if (e.key === 'Escape') {
                restoreSelection();
                setPanel(null);
              }
            }}
            placeholder={t('linkPlaceholder')}
            className="w-64 rounded border border-line px-2 py-1 text-sm text-ink outline-none focus:border-brand"
          />
          <Button label={t('done')} onClick={applyLink}>
            <CheckIcon />
          </Button>
        </span>
      )}
      {panel === 'emoji' && (
        <span className="mb-1 grid grid-cols-10 gap-0.5 rounded-lg border border-line bg-white p-1 shadow-md">
          {EMOJI.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => document.execCommand('insertText', false, emoji)}
              className="rounded p-1 text-base leading-none hover:bg-ground"
            >
              {emoji}
            </button>
          ))}
        </span>
      )}
      <span className="flex items-center gap-0.5 rounded-[10px] border border-line bg-white p-1 whitespace-nowrap shadow-lg">
        {block.type === 'text' && (
          <>
            {KINDS.map((k) => (
              <Button key={k.value} label={t(k.label)} active={block.kind === k.value} onClick={() => setKind(k.value)}>
                <span className="w-4 text-xs font-semibold">{k.short}</span>
              </Button>
            ))}
            <Divider />
            {editing ? (
              <>
                <Button label={t('bold')} onClick={() => document.execCommand('bold')}>
                  <BoldIcon />
                </Button>
                <Button label={t('link')} active={panel === 'link'} onClick={() => (panel === 'link' ? setPanel(null) : openLink())}>
                  <LinkIcon />
                </Button>
                <Button label={t('emoji')} active={panel === 'emoji'} onClick={() => setPanel(panel === 'emoji' ? null : 'emoji')}>
                  <SmileIcon />
                </Button>
                <button
                  type="button"
                  onClick={() => editableFor(cell.id)?.blur()}
                  className="ml-0.5 h-[30px] rounded-[7px] bg-ink px-2.5 text-xs font-semibold text-white hover:bg-black"
                >
                  {t('done')}
                </button>
              </>
            ) : (
              <Button label={t('editText')} onClick={() => startEditing(cell.id)}>
                <PencilIcon />
              </Button>
            )}
            <Divider />
          </>
        )}
        {ALIGNS.map(({ value, label, Icon }) => (
          <Button
            key={value}
            label={t(label)}
            active={row.align === value}
            onClick={() => edit((doc) => setRowAlign(doc, row.id, value))}
          >
            <Icon />
          </Button>
        ))}
        <Divider />
        <Button
          label={t('duplicate')}
          onClick={() => {
            let copyId: string | null = null;
            edit((doc) => {
              const result = duplicateCell(doc, cell.id);
              copyId = result.id;
              return result.doc;
            });
            if (copyId) select(copyId);
          }}
        >
          <CopyIcon />
        </Button>
        <Button label={t('delete')} danger onClick={() => edit((doc) => removeCell(doc, cell.id))}>
          <TrashIcon />
        </Button>
      </span>
    </span>
  );
}

function Button({
  label,
  active,
  danger,
  onClick,
  children
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        'flex items-center justify-center rounded p-1.5',
        active ? 'bg-brand-tint text-brand-ink' : 'text-muted hover:bg-ground',
        danger && 'hover:bg-red-50 hover:text-red-600'
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-line" />;
}
