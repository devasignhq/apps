import { Timestamp } from "firebase/firestore";

export type MessageDto = {
    id: string;
    userId: string;
    taskId: string;
    type: MessageType;
    body: string;
    metadata?: MessageMetadata;
    attachments: string[];
    read: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type MessageMetadata = {
    requestedTimeline: number;
    reason?: string;
    responded?: boolean;
}

export const MESSAGE_TYPE = {
    GENERAL: "GENERAL",
    TIMELINE_MODIFICATION: "TIMELINE_MODIFICATION"
};
export type MessageType = keyof typeof MESSAGE_TYPE

export type CreateMessageDto = {
    userId: string;
    taskId: string;
    type: MessageType;
    body: string;
    metadata?: MessageMetadata;
    attachments?: string[];
}
