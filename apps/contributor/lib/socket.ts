import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL
    : process.env.NEXT_PUBLIC_API_BASE_URL;

export const socket = io(SOCKET_URL, {
    autoConnect: true
});
