function StepCard({ title, subtitle, isSelected, onClick, isActive }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-indigo-100 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-100'
          : isActive
            ? 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
            : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
      }`}
      aria-pressed={isSelected}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-base font-semibold">{title}</span>
        {isSelected && (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            ✓
          </span>
        )}
      </div>
      {subtitle && <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{subtitle}</p>}
    </button>
  )
}

export default StepCard
