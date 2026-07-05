import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setCurrentChatId } from '../chat.slice'
import { useChat } from '../hooks/useChat'
import { MessageSquare, Plus, Trash2, Settings, X } from 'lucide-react'

const Sidebar = ({ isOpen, onToggle }) => {
    const dispatch = useDispatch()
    const { handleGetMessages, handleDeleteChat } = useChat()
    const { chats, currentChatId } = useSelector(state => state.chat)
    const [hoveredChat, setHoveredChat] = useState(null)

    const chatList = Object.values(chats).sort(
        (a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)
    )

    const handleSelectChat = (chatId) => {
        const chat = chats[chatId]
        if (chat?.messages?.length > 0) {
            dispatch(setCurrentChatId(chatId))
        } else {
            handleGetMessages(chatId)
        }
        onToggle()
    }

    const handleNewChat = () => {
        dispatch(setCurrentChatId(null))
        onToggle()
    }

    const handleDelete = (e, chatId) => {
        e.stopPropagation()
        handleDeleteChat(chatId)
    }

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 lg:hidden"
                    onClick={onToggle}
                />
            )}

            <aside
                className={`
                    fixed top-0 left-0 h-full z-30 flex flex-col
                    w-64 bg-[#0d0d0d] border-r border-white/8
                    transition-transform duration-300 ease-in-out
                    lg:relative lg:translate-x-0 lg:z-auto
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="flex items-center justify-between px-4 py-4 border-b border-white/8">
                    <h1 className="text-white text-lg font-semibold tracking-wider">Lumina</h1>
                    <button
                        onClick={onToggle}
                        className="text-white/40 hover:text-white transition-colors lg:hidden"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-3 py-3">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg
                                   border border-white/15 text-white/70 hover:text-white
                                   hover:bg-white/8 hover:border-white/25
                                   transition-all duration-200 text-sm"
                    >
                        <Plus size={16} />
                        <span>New Chat</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 custom-scrollbar">
                    {chatList.length === 0 && (
                        <p className="text-white/25 text-xs text-center py-6">No chats yet</p>
                    )}

                    {chatList.map((chat) => (
                        <div
                            key={chat._id}
                            onClick={() => handleSelectChat(chat._id)}
                            onMouseEnter={() => setHoveredChat(chat._id)}
                            onMouseLeave={() => setHoveredChat(null)}
                            className={`
                                flex items-center justify-between px-3 py-2.5
                                rounded-lg cursor-pointer transition-all duration-150
                                ${currentChatId === chat._id
                                    ? 'bg-white/12 text-white'
                                    : 'text-white/55 hover:bg-white/7 hover:text-white/85'
                                }
                            `}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <MessageSquare size={14} className="shrink-0 opacity-60" />
                                <span className="text-sm truncate">
                                    {chat.title || 'Untitled Chat'}
                                </span>
                            </div>

                            {hoveredChat === chat._id && (
                                <button
                                    onClick={(e) => handleDelete(e, chat._id)}
                                    className="shrink-0 text-white/30 hover:text-red-400 transition-colors ml-1"
                                >
                                    <Trash2 size={13} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="px-3 py-3 border-t border-white/8">
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                                    text-white/40 hover:text-white/70 hover:bg-white/7
                                    cursor-pointer transition-all duration-150">
                        <Settings size={15} />
                        <span className="text-sm">Settings & Help</span>
                    </div>
                </div>
            </aside>
        </>
    )
}

export default Sidebar