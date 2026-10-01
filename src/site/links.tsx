import { REPO_URL } from '../config';

/** The editor sits next to the site, at ./editor/, wherever the site is deployed. */
export const EDITOR_URL = './editor/';
export const CONTRIBUTING_URL = `${REPO_URL}/blob/main/CONTRIBUTING.md`;
export const AUTHOR_URL = 'https://github.com/reedlin2002';

export function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
    </svg>
  );
}
