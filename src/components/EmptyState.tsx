interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ emoji, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="mb-4 text-6xl">{emoji}</div>
      <h3 className="mb-1 text-lg font-bold text-ink">{title}</h3>
      {subtitle && <p className="mb-5 text-sm text-gray-500">{subtitle}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-2xl bg-amber-500 px-6 py-3 font-semibold text-white shadow-md shadow-amber-500/30 active:scale-[0.98]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
