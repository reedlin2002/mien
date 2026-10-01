import { useEffect, useRef, useState } from 'react';

/** True once the element has scrolled into view; sections fade up the first time they appear. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown]);
  return { ref, className: shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6', shown };
}
