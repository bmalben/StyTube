import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepCard from '../components/StepCard'

const classOptions = [8, 9, 10, 11, 12]
const syllabusOptions = ['State', 'CBSE', 'ICSE']
const languageOptions = ['Any', 'English', 'Malayalam', 'Hindi', 'Tamil', 'Kannada', 'Telugu']

const subjectOptionsByClass = {
  8: ['Maths', 'Physics', 'Chemistry', 'Biology', 'Social Science', 'English', 'Hindi', 'Malayalam'],
  9: ['Maths', 'Physics', 'Chemistry', 'Biology', 'Social Science', 'English', 'Hindi', 'Malayalam'],
  10: ['Maths', 'Physics', 'Chemistry', 'Biology', 'Social Science', 'English', 'Hindi', 'Malayalam'],
  11: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'English', 'Accountancy', 'Business Studies', 'Economics'],
  12: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'English', 'Accountancy', 'Business Studies', 'Economics'],
}

const normalizeParam = (value) =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function SelectPage() {
  const navigate = useNavigate()
  const [selectedClass, setSelectedClass] = useState(10)
  const [selectedSyllabus, setSelectedSyllabus] = useState('CBSE')
  const [selectedSubject, setSelectedSubject] = useState('Physics')
  const [selectedLanguage, setSelectedLanguage] = useState('Any')
  const [activeStep, setActiveStep] = useState(0)

  const availableSubjects = subjectOptionsByClass[selectedClass] || subjectOptionsByClass[10]

  useEffect(() => {
    if (!availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0])
    }
  }, [availableSubjects, selectedSubject])

  const isReady = Boolean(selectedClass) && Boolean(selectedSyllabus) && Boolean(selectedSubject)

  const handleSubmit = () => {
    if (!isReady) return

    navigate(
      `/videos?class=${selectedClass}&syllabus=${normalizeParam(selectedSyllabus)}&subject=${normalizeParam(selectedSubject)}&language=${normalizeParam(selectedLanguage === 'Any' ? 'Any' : selectedLanguage)}`,
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Study path</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Build your learning plan</h1>
          </div>
          <a href="/" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300">
            ← Back home
          </a>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          {['Class', 'Syllabus', 'Subject', 'Language'].map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                activeStep === index
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              {index + 1}. {label}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-8">
          {activeStep === 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-slate-800 dark:text-slate-100">Select your class</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {classOptions.map((classLevel) => (
                  <StepCard
                    key={classLevel}
                    title={`Class ${classLevel}`}
                    isSelected={selectedClass === classLevel}
                    isActive={selectedClass === classLevel}
                    onClick={() => {
                      setSelectedClass(classLevel)
                      setActiveStep(1)
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-slate-800 dark:text-slate-100">Choose your syllabus</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {syllabusOptions.map((board) => (
                  <StepCard
                    key={board}
                    title={board}
                    isSelected={selectedSyllabus === board}
                    isActive={selectedSyllabus === board}
                    onClick={() => {
                      setSelectedSyllabus(board)
                      setActiveStep(2)
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-slate-800 dark:text-slate-100">Select your subject</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {availableSubjects.map((subject) => (
                  <StepCard
                    key={subject}
                    title={subject}
                    isSelected={selectedSubject === subject}
                    isActive={selectedSubject === subject}
                    onClick={() => {
                      setSelectedSubject(subject)
                      setActiveStep(3)
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-slate-800 dark:text-slate-100">Preferred language</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {languageOptions.map((language) => (
                  <StepCard
                    key={language}
                    title={language}
                    isSelected={selectedLanguage === language}
                    isActive={selectedLanguage === language}
                    onClick={() => setSelectedLanguage(language)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Your picks</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(0)}
                  className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
                >
                  Class {selectedClass}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
                >
                  {selectedSyllabus}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
                >
                  {selectedSubject}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
                >
                  {selectedLanguage}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isReady}
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
            >
              Show Videos
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SelectPage
