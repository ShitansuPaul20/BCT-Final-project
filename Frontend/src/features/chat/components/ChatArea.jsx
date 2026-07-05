import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useChat } from '../hooks/useChat'
import { getSocket } from '../service/chat.socket'
import { createNewChat, addNewMessage, setCurrentChatId } from '../chat.slice'
import { Send, Mic, Plus, User, RotateCcw, Sparkles, BookOpen, ListChecks } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import MermaidDiagram from './MermaidDiagram'
import QuizWidget from './QuizWidget'

const AILogo = () => (
    <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center shrink-0 p-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
            <path d="M20.0833 10.4999L21.2854 11.2212C21.5221 11.3633 21.5989 11.6704 21.4569 11.9072C21.4146 11.9776 21.3557 12.0365 21.2854 12.0787L11.9999 17.6499L2.71451 12.0787C2.47772 11.9366 2.40093 11.6295 2.54301 11.3927C2.58523 11.3223 2.64413 11.2634 2.71451 11.2212L3.9166 10.4999L11.9999 15.3499L20.0833 10.4999ZM20.0833 15.1999L21.2854 15.9212C21.5221 16.0633 21.5989 16.3704 21.4569 16.6072C21.4146 16.6776 21.3557 16.7365 21.2854 16.7787L12.5144 22.0412C12.1977 22.2313 11.8021 22.2313 11.4854 22.0412L2.71451 16.7787C2.47772 16.6366 2.40093 16.3295 2.54301 16.0927C2.58523 16.0223 2.64413 15.9634 2.71451 15.9212L3.9166 15.1999L11.9999 20.0499L20.0833 15.1999ZM12.5144 1.30864L21.2854 6.5712C21.5221 6.71327 21.5989 7.0204 21.4569 7.25719C21.4146 7.32757 21.3557 7.38647 21.2854 7.42869L11.9999 12.9999L2.71451 7.42869C2.47772 7.28662 2.40093 6.97949 2.54301 6.7427C2.58523 6.67232 2.64413 6.61343 2.71451 6.5712L11.4854 1.30864C11.8021 1.11864 12.1977 1.11864 12.5144 1.30864Z"/>
        </svg>
    </div>
)

const markdownComponents = {
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    strong: ({ children }) => <strong className="text-white/95 font-semibold">{children}</strong>,
    em: ({ children }) => <em className="text-white/80 italic">{children}</em>,
    h1: ({ children }) => <h1 className="text-white/90 text-base font-semibold mt-3 mb-1">{children}</h1>,
    h2: ({ children }) => <h2 className="text-white/90 text-sm font-semibold mt-3 mb-1">{children}</h2>,
    h3: ({ children }) => <h3 className="text-white/90 text-sm font-medium mt-2 mb-1">{children}</h3>,
    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
    li: ({ children }) => <li className="text-white/75">{children}</li>,
    code: ({ className, children }) => {
        const isBlock = className?.includes('language-') || String(children).includes('\n')
        return isBlock ? (
            <pre className="bg-black/30 rounded-lg p-3 mt-2 mb-2 overflow-x-auto">
                <code className="text-white/85 text-xs font-mono">{children}</code>
            </pre>
        ) : (
            <code className="bg-white/10 text-white/90 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
        )
    },
}

const ChatArea = () => {
    const { handleSendMessage } = useChat()
    const dispatch = useDispatch()

    const { chats, currentChatId, isloading } = useSelector(state => state.chat)
    const { user } = useSelector(state => state.auth)

    const [input, setInput] = useState('')
    // Quiz state — key: message._id, value: { loading, questions, error }
    const [quizzes, setQuizzes] = useState({})
    const messagesEndRef = useRef(null)
    const textareaRef = useRef(null)

    const currentMessages = currentChatId && chats[currentChatId]
        ? chats[currentChatId].messages
        : []

    const currentChatTitle = currentChatId && chats[currentChatId]
        ? chats[currentChatId].title
        : 'New Chat'

    useEffect(() => {
        setInput('')
    }, [currentChatId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [currentMessages.length, currentMessages[currentMessages.length - 1]?.content, isloading])

    useEffect(() => {
        const ta = textareaRef.current
        if (ta) {
            ta.style.height = 'auto'
            ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
        }
    }, [input])

    const handleSubmit = async () => {
        if (!input.trim() || isloading) return
        const message = input.trim()
        setInput('')

        if (!currentChatId) {
            const tempId = 'temp_' + Date.now()
            dispatch(createNewChat({ chatId: tempId, title: 'New Chat' }))
            dispatch(setCurrentChatId(tempId))
            dispatch(addNewMessage({ chatId: tempId, content: message, role: 'user' }))
            try {
                await handleSendMessage(message, null, tempId, user?._id)
            } catch { }
        } else {
            dispatch(addNewMessage({ chatId: currentChatId, content: message, role: 'user' }))
            try {
                await handleSendMessage(message, currentChatId, null, user?._id)
            } catch { }
        }
    }

    const handleQuickAction = async (actionType, topic) => {
        if (!topic || isloading) return
        let newMessage = topic

        if (actionType === 'simpler') {
            newMessage = `Explain "${topic}" again but in a simpler way with an easier analogy.`
        } else if (actionType === 'detailed') {
            newMessage = `Explain "${topic}" again but in more depth and technical detail.`
        }

        if (!currentChatId) return

        dispatch(addNewMessage({ chatId: currentChatId, content: newMessage, role: 'user' }))
        try {
            await handleSendMessage(newMessage, currentChatId, null, user?._id)
        } catch { }
    }

    const handleGenerateQuiz = (topic, msgId) => {
        if (!topic || !msgId) return
        const socket = getSocket()
        if (!socket) return

        setQuizzes(prev => ({ ...prev, [msgId]: { loading: true, questions: null, error: null } }))

        const onQuizReady = ({ requestId, questions }) => {
            if (requestId !== msgId) return
            setQuizzes(prev => ({ ...prev, [msgId]: { loading: false, questions, error: null } }))
            cleanup()
        }
        const onQuizError = ({ requestId, message: errMsg }) => {
            if (requestId !== msgId) return
            setQuizzes(prev => ({ ...prev, [msgId]: { loading: false, questions: null, error: errMsg } }))
            cleanup()
        }
        function cleanup() {
            socket.off("quiz_ready", onQuizReady)
            socket.off("quiz_error", onQuizError)
        }

        socket.on("quiz_ready", onQuizReady)
        socket.on("quiz_error", onQuizError)
        socket.emit("generate_quiz", { topic, requestId: msgId })
    }

    const handleCloseQuiz = (msgId) => {
        setQuizzes(prev => {
            const updated = { ...prev }
            delete updated[msgId]
            return updated
        })
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="flex-1 flex flex-col h-full min-w-0 bg-[#141414]">

            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <span className="text-white/50 text-sm truncate">{currentChatTitle}</span>
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white/70 text-xs font-medium shrink-0">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 custom-scrollbar min-h-0">

                {!currentChatId && currentMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="mb-3 w-12 h-12 rounded-2xl bg-emerald-300 flex items-center justify-center p-2.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                                <path d="M20.0833 10.4999L21.2854 11.2212C21.5221 11.3633 21.5989 11.6704 21.4569 11.9072C21.4146 11.9776 21.3557 12.0365 21.2854 12.0787L11.9999 17.6499L2.71451 12.0787C2.47772 11.9366 2.40093 11.6295 2.54301 11.3927C2.58523 11.3223 2.64413 11.2634 2.71451 11.2212L3.9166 10.4999L11.9999 15.3499L20.0833 10.4999ZM20.0833 15.1999L21.2854 15.9212C21.5221 16.0633 21.5989 16.3704 21.4569 16.6072C21.4146 16.6776 21.3557 16.7365 21.2854 16.7787L12.5144 22.0412C12.1977 22.2313 11.8021 22.2313 11.4854 22.0412L2.71451 16.7787C2.47772 16.6366 2.40093 16.3295 2.54301 16.0927C2.58523 16.0223 2.64413 15.9634 2.71451 15.9212L3.9166 15.1999L11.9999 20.0499L20.0833 15.1999ZM12.5144 1.30864L21.2854 6.5712C21.5221 6.71327 21.5989 7.0204 21.4569 7.25719C21.4146 7.32757 21.3557 7.38647 21.2854 7.42869L11.9999 12.9999L2.71451 7.42869C2.47772 7.28662 2.40093 6.97949 2.54301 6.7427C2.58523 6.67232 2.64413 6.61343 2.71451 6.5712L11.4854 1.30864C11.8021 1.11864 12.1977 1.11864 12.5144 1.30864Z"/>
                            </svg>
                        </div>
                        <p className="text-white/40 text-sm">Hi {user?.name || 'there'},</p>
                        <h2 className="text-white/80 text-xl font-medium mt-1">Where should we start?</h2>

                        <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-md">
                            {['DFA vs NFA', 'Pumping Lemma', "Peterson's Solution", 'FCFS Scheduling', 'Page Replacement FIFO'].map(topic => (
                                <button
                                    key={topic}
                                    onClick={() => setInput(topic)}
                                    className="px-3 py-1.5 rounded-full bg-white/8 hover:bg-white/15 text-white/60 text-xs transition-colors"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {currentMessages.map((msg, index) => {
                    const precedingUserMsg = index > 0 && currentMessages[index - 1].role === 'user'
                        ? currentMessages[index - 1].content
                        : null

                    const msgId = msg._id || index
                    const quizState = quizzes[msgId]

                    return (
                        <MessageBubble
                            key={msgId}
                            message={msg}
                            precedingUserMsg={precedingUserMsg}
                            onAction={handleQuickAction}
                            disabled={isloading}
                            quizState={quizState}
                            onGenerateQuiz={() => handleGenerateQuiz(precedingUserMsg, msgId)}
                            onCloseQuiz={() => handleCloseQuiz(msgId)}
                        />
                    )
                })}

                {isloading && !currentMessages.some(m => m.role === 'ai' && m.streaming) && (
                    <div className="flex items-start gap-3">
                        <AILogo />
                        <div className="px-1 py-3">
                            <div className="flex gap-1 items-center h-4">
                                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="px-4 pb-5 pt-3">
                <div className="bg-[#1c1c1c] border border-white/12 rounded-2xl px-4 py-3
                                focus-within:border-white/25 transition-colors duration-200">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Lumina..."
                        rows={1}
                        disabled={isloading}
                        className="w-full bg-transparent text-white/85 text-sm placeholder-white/25
                                   resize-none outline-none leading-relaxed custom-scrollbar
                                   disabled:opacity-50"
                        style={{ maxHeight: '160px' }}
                    />
                    <div className="flex items-center justify-between mt-2">
                        <button className="text-white/30 hover:text-white/60 transition-colors">
                            <Plus size={18} />
                        </button>
                        <div className="flex items-center gap-2">
                            <button className="text-white/30 hover:text-white/60 transition-colors">
                                <Mic size={18} />
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!input.trim() || isloading}
                                className={`
                                    w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200
                                    ${input.trim() && !isloading
                                        ? 'bg-white text-black hover:bg-white/90'
                                        : 'bg-white/10 text-white/25 cursor-not-allowed'
                                    }
                                `}
                            >
                                <Send size={13} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const MessageBubble = ({ message, precedingUserMsg, onAction, disabled, quizState, onGenerateQuiz, onCloseQuiz }) => {
    const isUser = message.role === 'user'

    return (
        <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            {isUser ? (
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <User size={13} className="text-white/70" />
                </div>
            ) : (
                <AILogo />
            )}

            <div className={`
                max-w-[72%] text-sm leading-relaxed
                ${isUser
                    ? 'bg-white/15 text-white/90 rounded-2xl rounded-tr-sm px-4 py-2.5'
                    : 'text-white/75'
                }
            `}>
                {isUser ? (
                    message.content
                ) : (
                    <>
                        <ReactMarkdown components={markdownComponents}>
                            {message.content}
                        </ReactMarkdown>
                        {message.streaming && (
                            <span className="inline-block w-1.5 h-4 bg-white/40 ml-0.5 animate-pulse align-middle" />
                        )}
                        {message.mermaidCode && <MermaidDiagram code={message.mermaidCode} />}

                        {!message.streaming && message.relatedTopics?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {message.relatedTopics.map(topic => (
                                    <button
                                        key={topic}
                                        onClick={() => onAction('regenerate', topic)}
                                        className="px-2.5 py-1 rounded-full bg-white/8 hover:bg-white/15 text-white/50 hover:text-white/80 text-xs transition-colors"
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        )}

                        {!message.streaming && precedingUserMsg && (
                            <div className="flex gap-1.5 mt-2">
                                <button
                                    onClick={() => onAction('regenerate', precedingUserMsg)}
                                    disabled={disabled}
                                    title="Regenerate"
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/40 hover:text-white/80 transition-colors disabled:opacity-30"
                                >
                                    <RotateCcw size={13} />
                                </button>
                                <button
                                    onClick={() => onAction('simpler', precedingUserMsg)}
                                    disabled={disabled}
                                    title="Explain simpler"
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/40 hover:text-white/80 transition-colors disabled:opacity-30"
                                >
                                    <Sparkles size={13} />
                                </button>
                                <button
                                    onClick={() => onAction('detailed', precedingUserMsg)}
                                    disabled={disabled}
                                    title="More detail"
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/40 hover:text-white/80 transition-colors disabled:opacity-30"
                                >
                                    <BookOpen size={13} />
                                </button>
                                {!quizState?.questions && (
                                    <button
                                        onClick={onGenerateQuiz}
                                        disabled={disabled || quizState?.loading}
                                        title="Test yourself"
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/40 hover:text-white/80 transition-colors disabled:opacity-30"
                                    >
                                        <ListChecks size={13} />
                                    </button>
                                )}
                            </div>
                        )}

                        {quizState?.loading && (
                            <div className="mt-3 flex items-center gap-2 text-white/40 text-xs">
                                <div className="flex gap-1">
                                    <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                Generating quiz...
                            </div>
                        )}

                        {quizState?.error && (
                            <p className="mt-3 text-red-400/70 text-xs">{quizState.error}</p>
                        )}

                        {quizState?.questions && (
                            <QuizWidget questions={quizState.questions} onClose={onCloseQuiz} />
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default ChatArea