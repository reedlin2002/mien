import { useEffect, useRef, useState } from 'react';

/**
 * Local state for a field whose changes are expensive to apply (every change reloads
 * an image and adds an undo step). The draft follows the stored value when it changes
 * from outside, such as an undo, and is committed once the user pauses.
 */
export function useDraft<T>(value: T, commit: (value: T) => void, delay = 450) {
  const [draft, setDraft] = useState(value);
  const latest = useRef(commit);
  latest.current = commit;
  const pending = useRef(false);

  useEffect(() => {
    if (!pending.current) setDraft(value);
  }, [value]);

  useEffect(() => {
    if (!pending.current) return;
    const timer = setTimeout(() => {
      pending.current = false;
      latest.current(draft);
    }, delay);
    return () => clearTimeout(timer);
  }, [draft, delay]);

  function change(next: T) {
    pending.current = true;
    setDraft(next);
  }

  function flush() {
    if (!pending.current) return;
    pending.current = false;
    latest.current(draft);
  }

  return [draft, change, flush] as const;
}
