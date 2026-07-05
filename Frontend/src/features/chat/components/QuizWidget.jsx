import React, { useState } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

const QuizWidget = ({ questions, onClose }) => {
    const [currentIdx, setCurrentIdx] = useState(0)
    const [selected, setSelected] = useState(null)
    const [answers, setAnswers] = useState([])
    const [finished, setFinished] = useState(false)

    const current = questions[currentIdx]

    const handleSelect = (letter) => {
        if (selected) return
        setSelected(letter)
    }

    const handleNext = () => {
        const isCorrect = selected === current.correct
        const newAnswers = [...answers, { selected, correct: current.correct, isCorrect }]
        setAnswers(newAnswers)
        setSelected(null)

        if (currentIdx + 1 < questions.length) {
            setCurrentIdx(currentIdx + 1)
        } else {
            setFinished(true)
        }
    }

    if (finished) {
        const score = answers.filter(a => a.isCorrect).length
        return (
            <div className="mt-3 bg-[#1c1c1c] border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white/85 text-sm font-medium">Quiz Complete!</h4>
                    <button onClick={onClose} className="text-white/40 hover:text-white/80">
                        <X size={16} />
                    </button>
                </div>
                <p className="text-white/70 text-sm mb-3">
                    You scored <span className="text-white font-semibold">{score} / {questions.length}</span>
                </p>
                <div className="space-y-2">
                    {questions.map((q, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                            {answers[i].isCorrect ? (
                                <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                            ) : (
                                <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                            )}
                            <span className="text-white/60">{q.question}</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="mt-3 bg-[#1c1c1c] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-white/40 text-xs">Question {currentIdx + 1} of {questions.length}</span>
                <button onClick={onClose} className="text-white/40 hover:text-white/80">
                    <X size={16} />
                </button>
            </div>
            <p className="text-white/85 text-sm mb-3">{current.question}</p>
            <div className="space-y-2">
                {Object.entries(current.options).map(([letter, text]) => {
                    let stateClass = "bg-white/5 hover:bg-white/10 text-white/70"
                    if (selected) {
                        if (letter === current.correct) {
                            stateClass = "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                        } else if (letter === selected) {
                            stateClass = "bg-red-500/20 border border-red-500/40 text-red-300"
                        } else {
                            stateClass = "bg-white/5 text-white/40"
                        }
                    }
                    return (
                        <button
                            key={letter}
                            onClick={() => handleSelect(letter)}
                            disabled={!!selected}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${stateClass}`}
                        >
                            <span className="font-medium mr-1.5">{letter})</span>{text}
                        </button>
                    )
                })}
            </div>
            {selected && (
                <button
                    onClick={handleNext}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-white/90"
                >
                    {currentIdx + 1 < questions.length ? 'Next' : 'Finish'}
                </button>
            )}
        </div>
    )
}

export default QuizWidget