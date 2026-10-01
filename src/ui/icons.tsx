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
export const LinkIcon = icon(['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71']);
export const SmileIcon = icon(['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M8 14s1.5 2 4 2 4-2 4-2', 'M9 9h.01', 'M15 9h.01']);
export const PencilIcon = icon(['M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z']);
export const SunIcon = icon(['M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41']);
export const MoonIcon = icon(['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z']);
export const SearchIcon = icon(['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'm21 21-4.3-4.3']);
export const TemplateIcon = icon(['M3 3h18v18H3z', 'M3 9h18', 'M9 21V9']);
export const BoldIcon = icon(['M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8']);
export const GlobeIcon = icon(['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z']);
export const ChevronDownIcon = icon(['m6 9 6 6 6-6']);
export const ChevronRightIcon = icon(['m9 18 6-6-6-6']);
export const ArrowRightIcon = icon(['M5 12h14', 'M13 6l6 6-6 6']);
export const ArrowUpIcon = icon(['M12 19V5', 'm5 12 7-7 7 7']);
export const ArrowDownIcon = icon(['M12 5v14', 'm19 12-7 7-7-7']);
export const TextIcon = icon(['M4 7V5h16v2', 'M9 19h6', 'M12 5v14']);
export const ParagraphIcon = icon(['M4 6h16', 'M4 12h16', 'M4 18h10']);
export const HeaderIcon = icon(['M5 4h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M3 16h18', 'M3 20h12']);
export const ChartIcon = icon(['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2']);
export const GridIcon = icon(['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h7v7h-7z']);
export const BadgeIcon = icon(['M6 8h12a4 4 0 0 1 0 8H6a4 4 0 0 1 0-8z', 'M12 8v8']);
export const ImageIcon = icon(['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'm21 15-5-5L5 21']);
export const CheckCircleIcon = icon(['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'm8 12 3 3 5-6']);
export const WarningIcon = icon(['M12 9v4', 'M12 17h.01', 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z']);
export const LockIcon = icon(['M6 11h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z', 'M8 11V7a4 4 0 0 1 8 0v4']);

/** Six-dot drag grip. */
export function GripIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 12 16" width="10" height="14" fill="currentColor" aria-hidden="true" {...props}>
      {[3, 8, 13].flatMap((y) => [3, 9].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />))}
    </svg>
  );
}

/** The brand mark: a cat head with two square eyes and no mouth. */
export function LogoMark({ blink, eyes = "var(--color-brand)", head = "var(--color-brand-ink)", ...props }: IconProps & { blink?: boolean; eyes?: string; head?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...props}>
      <path d="M3 9 5 2l5 5h4l5-5 2 7v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" fill={head} />
      <g className={blink ? "animate-blink" : undefined} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <rect x="7" y="12" width="4" height="4" rx="1" fill={eyes} />
        <rect x="13" y="12" width="4" height="4" rx="1" fill={eyes} />
      </g>
    </svg>
  );
}
