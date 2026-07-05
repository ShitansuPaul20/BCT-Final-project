import { createSlice } from '@reduxjs/toolkit'

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        chats: {},
        currentChatId: null,
        isloading: false,
        error: null,
    },
    reducers: {
        createNewChat: (state, action) => {
            const { chatId, title } = action.payload;
            state.chats[chatId] = {
                _id: chatId,
                title,
                messages: [],
                lastUpdated: new Date().toISOString(),
            }
            state.currentChatId = chatId;
        },
        replaceTempChat: (state, action) => {
            const { tempId, realId, title } = action.payload;
            const tempChat = state.chats[tempId];
            if (tempChat) {
                state.chats[realId] = {
                    _id: realId,
                    title,
                    messages: tempChat.messages,
                    lastUpdated: new Date().toISOString(),
                }
                delete state.chats[tempId]
            }
            state.currentChatId = realId;
        },
       addNewMessage: (state, action) => {
            const { chatId, _id, content, role, mermaidCode, streaming, relatedTopics } = action.payload;
            if (state.chats[chatId]) {
                state.chats[chatId].messages.push({
                    _id, content, role,
                    mermaidCode: mermaidCode || null,
                    relatedTopics: relatedTopics || [],
                    streaming: !!streaming,
                });
                state.chats[chatId].lastUpdated = new Date().toISOString();
            }
        },
        appendChunk: (state, action) => {
            const { chatId, chunk } = action.payload;
            const chat = state.chats[chatId];
            if (!chat) return;
            const messages = chat.messages;
            const lastMsg = messages[messages.length - 1];
            if (lastMsg && lastMsg.role === 'ai') {
                lastMsg.content += chunk;
            }
        },
        finalizeAiMessage: (state, action) => {
            const { chatId, aiMessage } = action.payload;
            const chat = state.chats[chatId];
            if (!chat) return;
            const messages = chat.messages;
            const lastMsg = messages[messages.length - 1];
            if (lastMsg && lastMsg.role === 'ai') {
                lastMsg._id = aiMessage._id;
                lastMsg.content = aiMessage.content;
                lastMsg.mermaidCode = aiMessage.mermaidCode;
                lastMsg.relatedTopics = aiMessage.relatedTopics || [];
                lastMsg.streaming = false;
            }
        },
        deleteChat: (state, action) => {
            const chatId = action.payload;
            delete state.chats[chatId];
            if (state.currentChatId === chatId) {
                state.currentChatId = null;
            }
        },
        
        setChatMessages: (state, action) => {
            const { chatId, messages } = action.payload;
            if (state.chats[chatId]) {
                state.chats[chatId].messages = messages;
            }
        },
        setChats: (state, action) => {
            state.chats = action.payload
        },
        setCurrentChatId: (state, action) => {
            state.currentChatId = action.payload
        },
        setLoading: (state, action) => {
            state.isloading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        },
    }
})

export const {
    setChats, setCurrentChatId, setLoading, setError,
    createNewChat, addNewMessage, replaceTempChat, setChatMessages,
    deleteChat, appendChunk, finalizeAiMessage,
} = chatSlice.actions

export default chatSlice.reducer