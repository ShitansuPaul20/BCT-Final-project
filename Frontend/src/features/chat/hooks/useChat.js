import { initializeSocketConnection, getSocket } from "../service/chat.socket";
import { getAllChats, getMessagesByChatId, deleteChatapi } from "../service/chat.api";
import { useDispatch } from "react-redux";
import {
    setLoading, setError, setCurrentChatId , createNewChat , addNewMessage,
    replaceTempChat, setChats, setChatMessages, deleteChat,
    appendChunk, finalizeAiMessage,
} from "../chat.slice";

export const useChat = () => {
    const dispatch = useDispatch();

    async function handleGetAllChats() {
        try {
            const response = await getAllChats()
            const chatsArray = response.data.chats
            const chatsObject = chatsArray.reduce((acc, chat) => {
                acc[chat._id] = { ...chat, messages: chat.messages || [] }
                return acc
            }, {})
            dispatch(setChats(chatsObject))
        } catch (error) {
            console.error("Error fetching chats:", error)
        }
    }

    async function handleGetMessages(chatId) {
        try {
            const response = await getMessagesByChatId(chatId)
            const messages = response.data.messages || response.data
            dispatch(setChatMessages({ chatId, messages }))
            dispatch(setCurrentChatId(chatId))
        } catch (error) {
            console.error("Error fetching messages:", error)
        }
    }

    function handleSendMessage(messageData, chatId, tempId = null, userId) {
        return new Promise((resolve, reject) => {
            const socket = getSocket() || initializeSocketConnection();
            const localKey = chatId || tempId; // abhi jis key ke andar messages hain

            dispatch(setLoading(true));

            // Empty AI placeholder — isi mein chunks aakar bharenge
            dispatch(addNewMessage({
                chatId: localKey,
                _id: null,
                content: '',
                role: 'ai',
                mermaidCode: null,
                streaming: true,
            }));

            const onMessageSaved = ({ newChat, tempId: returnedTempId }) => {
                if (newChat && tempId) {
                    dispatch(replaceTempChat({
                        tempId,
                        realId: newChat._id,
                        title: newChat.title,
                    }));
                    dispatch(setCurrentChatId(newChat._id));
                }
            };

            const onChunk = ({ chatId: cId, chunk }) => {
                dispatch(appendChunk({ chatId: cId, chunk }));
            };

            const onDone = ({ chatId: cId, aiMessage }) => {
                dispatch(finalizeAiMessage({ chatId: cId, aiMessage }));
                dispatch(setLoading(false));
                cleanup();
                resolve(aiMessage._id);
            };

            const onError = (err) => {
                dispatch(setError(err?.message || "Failed to send message"));
                dispatch(setLoading(false));
                cleanup();
                reject(err);
            };

            function cleanup() {
                socket.off("message_saved", onMessageSaved);
                socket.off("ai_chunk", onChunk);
                socket.off("ai_done", onDone);
                socket.off("ai_error", onError);
            }

            socket.on("message_saved", onMessageSaved);
            socket.on("ai_chunk", onChunk);
            socket.on("ai_done", onDone);
            socket.on("ai_error", onError);

            socket.emit("send_message", { message: messageData, chatId, tempId, userId });
        });
    }

    async function handleDeleteChat(chatId) {
        try {
            await deleteChatapi(chatId)
            dispatch(deleteChat(chatId))
        } catch (error) {
            console.error("Error deleting chat:", error)
            dispatch(setError(error.response?.data?.message || "Failed to delete chat"))
        }
    }

    return {
        initializeSocketConnection,
        handleGetAllChats,
        handleGetMessages,
        handleDeleteChat,
        handleSendMessage,
    }
}