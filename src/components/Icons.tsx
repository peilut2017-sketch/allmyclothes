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
