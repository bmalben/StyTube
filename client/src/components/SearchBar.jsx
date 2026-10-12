function SearchBar({
  value,
  onChange,
  chapterOptions,
  selectedChapter,
  onChapterChange,
  sortBy,
  onSortChange,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
      <label className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
        <span aria-hidden="true" className="text-lg text-slate-500">🔎</span>
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search videos by title"
          className="w-full border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
          aria-label="Search videos by title"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[420px]">
        <label className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
          <span className="text-sm text-slate-600 dark:text-slate-300">Chapter</span>
          <select
            value={selectedChapter}
            onChange={(event) => onChapterChange(event.target.value)}
            className="bg-transparent text-sm text-slate-700 focus:outline-none dark:text-slate-100"
            aria-label="Filter by chapter"
          >
            <option value="">All</option>
            {chapterOptions.map((chapter) => (
              <option key={chapter} value={chapter}>
                {chapter}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
          <span className="text-sm text-slate-600 dark:text-slate-300">Sort</span>
          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value)}
            className="bg-transparent text-sm text-slate-700 focus:outline-none dark:text-slate-100"
            aria-label="Sort videos"
          >
            <option value="best">Best match</option>
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
          </select>
        </label>
      </div>
    </div>
  )
}

export default SearchBar
