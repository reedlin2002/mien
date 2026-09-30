import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function icon(paths: string[]) {
  return function Icon(props: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  };
}

export const UndoIcon = icon(['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11']);
export const RedoIcon = icon(['m15 14 5-5-5-5', 'M20 9H9.5a5.5 5.5 0 0 0 0 11H13']);
export const AlignLeftIcon = icon(['M21 6H3', 'M15 12H3', 'M17 18H3']);
export const AlignCenterIcon = icon(['M21 6H3', 'M17 12H7', 'M19 18H5']);
export const AlignRightIcon = icon(['M21 6H3', 'M21 12H9', 'M21 18H7']);
export const TrashIcon = icon(['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2']);
export const ExternalIcon = icon(['M15 3h6v6', 'M10 14 21 3', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6']);
export const CheckIcon = icon(['M20 6 9 17l-5-5']);
export const CloseIcon = icon(['M18 6 6 18', 'm6 6 12 12']);
export const CopyIcon = icon([
  'M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z',
  'M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2'
]);
export const BookIcon = icon(['M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20']);
export const PlusIcon = icon(['M5 12h14', 'M12 5v14']);
export const LogoIcon = icon(['M3 3h18v6H3z', 'M3 13h8v8H3z', 'M15 13h6v8h-6z']);
