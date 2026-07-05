const { Server } = require("socket.io")
const chatModel = require("../models/chat.model")
const messageModel = require("../models/message.model")
const { generateChatTitle, streamConceptExplanation, parseConceptResponse, generateQuiz } = require("../services/ai.service")

let io;

const EXPLANATION_MARKER = '###EXPLANATION###';
const MERMAID_MARKER = '###MERMAID###';

async function consumeStreamWithTimeout(streamGen, onDelta, idleTimeoutMs = 15000, maxTotalMs = 60000) {
    let finished = false;
    let timeoutHandle;
    let resolveIdle;
    const startTime = Date.now();

    const resetIdleTimer = () => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        timeoutHandle = setTimeout(() => resolveIdle(), idleTimeoutMs);
    };

    const idlePromise = new Promise((resolve) => {
        resolveIdle = resolve;
        resetIdleTimer();
    });

    const consume = (async () => {
        for await (const delta of streamGen) {
            if (finished) return;
            onDelta(delta);
            resetIdleTimer(); // naya data mila, timer reset — aur wait karo
            if (Date.now() - startTime > maxTotalMs) {
                break; // overall safety cap (bahut zyada lamba na ho jaye)
            }
        }
    })().catch((err) => {
        console.error("Background stream error (ignore kar rahe hain):", err.message);
    });

    await Promise.race([consume, idlePromise]);
    finished = true;
    if (timeoutHandle) clearTimeout(timeoutHandle);
}

function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true,
        }
    })

    console.log("Socket.io Server is running")

    io.on("connection", (socket) => {
        console.log("A user connected:" + socket.id)

        socket.on("send_message", async ({ message, chatId, tempId, userId }) => {
            try {
                let chatID = chatId;
                let newChat = null;
                let chatTitle = null;

                let history = [];
                if (chatID) {
                    history = await messageModel.find({ chat: chatID }).sort({ createdAt: 1 });
                }

                if (!chatID) {
                    chatTitle = await generateChatTitle(message);
                    newChat = await chatModel.create({ user: userId, title: chatTitle });
                    chatID = newChat._id;
                }

                const userMessage = await messageModel.create({
                    chat: chatID,
                    content: message,
                    role: 'user',
                });

                socket.emit("message_saved", { newChat, userMessage, tempId, chatId: chatID });

                // ---- Streaming shuru (idle-timeout ke saath — jab tak data aata rahe, rukte nahi) ----
                let buffer = '';
                let emittedLength = 0;
                let explanationDone = false;
                let markerSkipped = false; // ###EXPLANATION### marker skip ho chuka hai kya
                const SAFETY_MARGIN = 20;

                try {
                    await consumeStreamWithTimeout(
                        streamConceptExplanation(message, history),
                        (delta) => {
                            buffer += delta;
                            if (explanationDone) return;

                            // Marker ko position ke hisaab se skip karo — chunk boundary mein
                            // split ho jaye tab bhi leak na ho (string-replace se ye guarantee nahi hoti)
                            if (!markerSkipped) {
                                if (buffer.length < EXPLANATION_MARKER.length) return; // poora marker aane ka wait karo
                                const idx = buffer.indexOf(EXPLANATION_MARKER);
                                if (idx === -1) {
                                    markerSkipped = true; // model ne format follow nahi kiya, bina skip ke aage badho
                                } else {
                                    emittedLength = idx + EXPLANATION_MARKER.length;
                                    if (buffer[emittedLength] === '\n') emittedLength++;
                                    markerSkipped = true;
                                }
                            }

                            const mermaidIdx = buffer.indexOf(MERMAID_MARKER);
                            if (mermaidIdx !== -1) {
                                let toEmit = buffer.slice(emittedLength, mermaidIdx);
                                if (toEmit) socket.emit("ai_chunk", { chatId: chatID, chunk: toEmit });
                                explanationDone = true;
                            } else {
                                const safeEnd = Math.max(emittedLength, buffer.length - SAFETY_MARGIN);
                                if (safeEnd > emittedLength) {
                                    let toEmit = buffer.slice(emittedLength, safeEnd);
                                    if (toEmit) socket.emit("ai_chunk", { chatId: chatID, chunk: toEmit });
                                    emittedLength = safeEnd;
                                }
                            }
                        },
                        15000,  // idle timeout — 15 sec tak koi naya data na aaye toh cut karo
                        60000   // overall safety cap — max 60 sec
                    );
                } catch (streamErr) {
                    console.error("Stream mein dikkat aayi, jo mila usi se aage badh rahe hain:", streamErr.message);
                }

                const parsed = parseConceptResponse(buffer);

                if (!explanationDone) {
                    const leftover = buffer.slice(emittedLength);
                    if (leftover) socket.emit("ai_chunk", { chatId: chatID, chunk: leftover });
                }

                // Agar bilkul kuch nahi mila (API quota khatam ho gayi ya koi temporary issue), user ko clearly bata do
                const GENERIC_FALLBACK = "Sorry, couldn't generate an explanation.";

                const finalExplanation = parsed.explanation
                    && parsed.explanation.trim()
                    && parsed.explanation.trim() !== GENERIC_FALLBACK
                    ? parsed.explanation
                    : "⚠️ AI se response nahi mil paya (shayad API quota khatam ho gayi hai ya koi temporary issue hai). Thodi der mein dubara try karo.";

                const aiMessage = await messageModel.create({
                    chat: chatID,
                    content: finalExplanation,
                    role: 'ai',
                    mermaidCode: parsed.mermaidCode,
                    relatedTopics: parsed.relatedTopics || [],
                });
                console.log('FINAL PARSED:', parsed);
                socket.emit("ai_done", { chatId: chatID, aiMessage });

            } catch (error) {
                console.error("Streaming error:", error);
                socket.emit("ai_error", { message: "Failed to generate response" });
            }
        })

        socket.on("generate_quiz", async ({ topic, requestId }) => {
            try {
                const questions = await generateQuiz(topic);
                if (!questions || questions.length === 0) {
                    socket.emit("quiz_error", { requestId, message: "Quiz nahi ban paya, dubara try karo." });
                    return;
                }
                socket.emit("quiz_ready", { requestId, topic, questions });
            } catch (error) {
                console.error("Quiz generation error:", error);
                socket.emit("quiz_error", { requestId, message: "Quiz generate karte waqt error aaya." });
            }
        });
        socket.on("disconnect", () => {
            console.log("User disconnected: " + socket.id)
        })
    })
}

function getIO() {
    if (!io) throw new Error("Socket.io not initialized")
    return io
}

module.exports = { initSocket, getIO }