import axios from 'axios'
import { Zap } from 'lucide-react'
 
const API = axios.create({
    baseURL: 'http://localhost:3000/api/chat',
    withCredentials: true,
})
 
export const getAllChats = async () => {
    try {
        const response = await API.get('/get-all')
        return response
    } catch (error) {
        console.error("Error fetching chats:", error)
        throw error
    }
}
 
export const getMessagesByChatId = async (chatId) => {
    try {
        const response = await API.get(`/get/${chatId}`)
        return response
    } catch (error) {
        console.error("Error fetching messages:", error)
        throw error
    }
}

 
export const sendMessage = async ({messageData, chatId}) => {
    try {
        const response =await API.post(`/message`, {message:messageData, chat:chatId})
        return response
    } catch (error) {
        console.error("Error sending message:", error)
        throw error
    }
}
 
export const deleteChatapi = async (chatId) => {
    try {
        const response = await API.delete(`/delete/${chatId}`)
        return response
    } catch (error) {
        console.error("Error deleting chat:", error)
        throw error
    }
}