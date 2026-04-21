import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL
    : process.env.NEXT_PUBLIC_API_BASE_URL;

export const socket = io(SOCKET_URL, {
    autoConnect: true
});

const roomCounts = new Map<string, number>();

export const joinSocketRoom = (room: string) => {
    const count = roomCounts.get(room) || 0;
    if (count === 0) {
        socket.emit("join", room);
    }
    roomCounts.set(room, count + 1);
};

export const leaveSocketRoom = (room: string) => {
    const count = roomCounts.get(room) || 0;
    if (count <= 1) {
        socket.emit("leave", room);
        roomCounts.delete(room);
    } else {
        roomCounts.set(room, count - 1);
    }
};
