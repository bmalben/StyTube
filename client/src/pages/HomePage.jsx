import { Link } from 'react-router-dom'

const steps = [
  'Choose your class',
  'Choose your syllabus',
  'Watch videos',
]

const boards = ['State', 'CBSE', 'ICSE']
const classLevels = [8, 9, 10, 11, 12]
const features = [
  {
    title: 'Free to use',
    description: 'A clean study companion without paywalls or subscription traps for school students.',
  },
  {
    title: 'Organized by syllabus',
    description: 'Browse videos matched to your board and class so revision stays focused and relevant.',
  },
  {
    title: 'Distraction-free viewing',
    description: 'No noisy recommendation feeds or comments cluttering your learning flow.',
  },
]

function HomePage() {
  return (
    <div className="space-y-16 pb-16 pt-8 sm:pt-12">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-teal-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 sm:p-10 lg:p-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
                Learn smarter
              </span>
              <h1 className="mt-5 max-w-xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                Study concepts with videos made for school students.
              </h1>
              <p className="mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-300">
                Find board-aligned lessons for Class 8 to 12 and learn with focused, curriculum-friendly YouTube content.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/select"
                  className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500"
                >
                  Start Learning
                </Link>
                <Link
                  to="/videos?class=10&syllabus=cbse&subject=physics"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 hover:border-indigo-200 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Browse Demo Videos
                </Link>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
              <div className="rounded-[1.5rem] bg-gradient-to-br from-indigo-500 via-violet-500 to-teal-500 p-5 text-white">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/15 px-2 py-1 text-xs font-medium">Class 10 · CBSE</span>
                  <span className="rounded-full bg-white/15 px-2 py-1 text-xs font-medium">Physics</span>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-100">Now learning</p>
                    <h2 className="mt-2 text-2xl font-bold">Light Reflection</h2>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {['Concepts', 'Revision', 'Practice'].map((label) => (
                      <div key={label} className="rounded-2xl bg-white/10 p-3 text-center text-sm font-medium text-indigo-50">
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">How it works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Start learning in three simple steps</h2>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-lg font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                {index + 1}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-800 dark:text-slate-100">{step}</h3>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                {index === 0 && 'Pick the right class and build your custom study path.'}
                {index === 1 && 'Choose your board and the subject you want to revise.'}
                {index === 2 && 'Watch short, focused videos without losing momentum.'}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Supported boards & classes</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {boards.map((board) => (
            <div key={board} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{board}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {classLevels.map((level) => (
                  <span
                    key={`${board}-${level}`}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    Class {level}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Features</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Built for focused learning</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 text-lg text-white shadow-md shadow-indigo-500/20">
                  ✨
                </div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{feature.title}</h3>
                <p className="mt-3 text-slate-600 dark:text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
