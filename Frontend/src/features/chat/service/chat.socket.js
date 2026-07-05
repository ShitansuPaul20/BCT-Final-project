import { io } from 'socket.io-client'

let socket = null;

export const initializeSocketConnection = () => {
    if (socket) return socket;

    socket = io("http://localhost:3000", {
        withCredentials: true
    })

    socket.on("connect", () => {
        console.log("Connected to socket.io server")
    })

    return socket;
}

export const getSocket = () => socket;