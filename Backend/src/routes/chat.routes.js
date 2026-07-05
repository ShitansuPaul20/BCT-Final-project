const Router = require('express');
const chatController = require('../controller/chat.controller');
const { authMiddleware } = require('../middlewire/auth.middlewire');

const chatRouter = Router();

chatRouter.post('/message', authMiddleware, chatController.sendMessage);

chatRouter.get('/get-all', authMiddleware, chatController.getAllChats);

chatRouter.get('/get/:ChatId', authMiddleware, chatController.getMessagesByChatId);

chatRouter.delete('/delete/:id', authMiddleware, chatController.deleteChat);

module.exports = chatRouter;