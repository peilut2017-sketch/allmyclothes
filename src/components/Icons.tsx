import type { ReactNode } from 'react';

/** סט אייקונים אחיד (קו 1.75, 24px) – נראה זהה בכל מכשיר, בניגוד לאימוג'י */
function Svg({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const ClosetIcon = ({ size }: { size?: number }) => (
  <Svg size={size}><path d="M8 3 3 6.5 5.5 10 8 8.5V20h8V8.5l2.5 1.5L21 6.5 16 3c-1 1.8-2.4 2.6-4 2.6S9 4.8 8 3Z" /></Svg>
);
export const LooksIcon = ({ size }: { size?: number }) => (
  <Svg size={size}><path d="M12 8.5V9l-8.4 6.3A1 1 0 0 0 4.2 17h15.6a1 1 0 0 0 .6-1.7L12 9" /><path d="M12 8.5a2.2 2.2 0 1 0-2.2-2.2" /></Svg>
);
export const CartIcon = ({ size }: { size?: number }) => (
  <Svg size={size}><path d="M3 4h2.2l2 10.5h10.6l2-7.5H6.2" /><circle cx="9" cy="19" r="1.3" /><circle cx="17" cy="19" r="1.3" /></Svg>
);
export const ChildIcon = ({ size }: { size?: number }) => (
  <Svg size={size}><circle cx="12" cy="8" r="3.4" /><path d="M5.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /></Svg>
);
export const SlidersIcon = ({ size }: { size?: number }) => (
  <Svg size={size}><path d="M4 7h9M19 7h1M4 17h1M11 17h9" /><circle cx="16" cy="7" r="2.2" /><circle cx="8" cy="17" r="2.2" /></Svg>
);
export const PlusIcon = ({ size }: { size?: number }) => (
  <Svg size={size}><path d="M12 5v14M5 12h14" /></Svg>
);
export const BackIcon = ({ size }: { size?: number }) => (
  <Svg size={size}><path d="m9 5 7 7-7 7" /></Svg>
);
export const CloseIcon = ({ size }: { size?: number }) => (
  <Svg size={size}><path d="M6 6l12 12M18 6 6 18" /></Svg>
);
export const CheckIcon = ({ size }: { size?: number }) => (
  <Svg size={size}><path d="m5 12.5 4.5 4.5L19 7" /></Svg>
);
export const ClockIcon = ({ size = 14 }: { size?: number }) => (
  <Svg size={size}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
);
export const EditIcon = ({ size }: { size?: number }) => (
  <Svg size={size}><path d="M4 20h4L19 9l-4-4L4 16v4Z" /></Svg>
);
export const GridIcon = ({ size }: { size?: number }) => (
  <Svg size={size}><rect x="4" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" /></Svg>
);
export const ListIcon = ({ size }: { size?: number }) => (
  <Svg size={size}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r=".6" /><circle cx="4.5" cy="12" r=".6" /><circle cx="4.5" cy="18" r=".6" /></Svg>
);
export const SearchIcon = ({ size = 18 }: { size?: number }) => (
  <Svg size={size}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>
);
export const FilterIcon = ({ size }: { size?: number }) => (
  <Svg size={size}><path d="M4 7h16M7 12h10M10 17h4" /></Svg>
);
export const ChevronIcon = ({ size = 18 }: { size?: number }) => (
  <Svg size={size}><path d="m15 5-7 7 7 7" /></Svg>
);
