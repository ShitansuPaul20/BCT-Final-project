const { generateChatTitle, generateConceptExplanation } = require("../services/ai.service");
const chatModel = require("../models/chat.model");
const messageModel = require("../models/message.model");

async function sendMessage(req, res) {
    const { message, chat } = req.body;

    let chatTitle = null, newChat = null, chatID = chat;
    try {
 
        let history = [];
        if (chatID) {
            history = await messageModel.find({ chat: chatID }).sort({ createdAt: 1 });
        }

        if (!chat) {
            chatTitle = await generateChatTitle(message);
            newChat = await chatModel.create({
                user: req.user.id,
                title: chatTitle,
            });
            chatID = newChat._id;
        }

        const userMessage = await messageModel.create({
            chat: chatID,
            content: message,
            role: 'user',
        });

        const { explanation, mermaidCode } = await generateConceptExplanation(message, history);

        const aiMessage = await messageModel.create({
            chat: chatID,
            content: explanation,
            role: 'ai',
            mermaidCode,
        });

        res.status(200).json({
            title: chatTitle,
            newChat,
            aiMessage,
            userMessage,
        });

    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function getAllChats(req, res) {
    const user = req.user.id;
    try {
        const chats = await chatModel.find({ user });
        res.status(200).json({
            Message: 'Chats retrieved successfully',
            chats });
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function getMessagesByChatId(req, res) {
    const { ChatId } = req.params;
    try {
        const chat = await chatModel.find({ 
            _id: ChatId,
        });

        if(!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const messages = await messageModel.find({ chat: ChatId });

        res.status(200).json({
            Message: 'Messages retrieved successfully',
            messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function deleteChat(req, res) {
    const { id } = req.params;
    try {
        const chat = await chatModel.findByIdAndDelete(id);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        await messageModel.deleteMany({ chat: id });
        res.status(200).json({ message: 'Chat and associated messages deleted successfully' });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


module.exports = {
    sendMessage,
    getAllChats,
    getMessagesByChatId,
    deleteChat,
};

