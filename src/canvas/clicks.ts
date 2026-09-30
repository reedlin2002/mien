/**
 * After a drag or resize the browser still fires a click on whatever element is
 * under the pointer, which would deselect or reselect things. Swallow that one click.
 */
export function suppressNextClick(): void {
  const swallow = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };
  window.addEventListener('click', swallow, { capture: true, once: true });
  // If no click follows (pointer released outside the window), don't eat a later one.
  setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
}
