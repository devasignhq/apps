import { firestoreDB, storage } from "@/lib/firebase";
import {
    Timestamp,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where,
    QueryConstraint
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { MessageDto, CreateMessageDto, MessageMetadata } from "@devasign/shared/models/message.model";

const messagesCollection = collection(firestoreDB, "messages");

export class MessageAPI {
    static async getTaskMessages(taskId: string) {
        const q = query(
            messagesCollection,
            where("taskId", "==", taskId),
            orderBy("createdAt", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MessageDto[];
    }

    static listenToTaskMessages(
        taskId: string,
        userId: string,
        startDate: string,
        callback: (messages: MessageDto[]) => void
    ) {
        const constraints: QueryConstraint[] = [
            where("taskId", "==", taskId),
            where("userId", "==", userId)
        ];

        if (startDate && startDate.trim()) {
            const startTimestamp = Timestamp.fromDate(new Date(startDate));
            constraints.push(where("createdAt", ">", startTimestamp));
        }

        constraints.push(orderBy("createdAt", "asc"));

        const q = query(messagesCollection, ...constraints);

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as MessageDto));
            callback(messages);
        });
    }

    static async createMessage({
        userId,
        taskId,
        type = "GENERAL",
        body,
        metadata = {} as MessageMetadata,
        attachments = []
    }: CreateMessageDto) {
        const messageRef = doc(messagesCollection);

        const messageData: MessageDto = {
            id: messageRef.id,
            userId,
            taskId,
            type,
            body,
            metadata,
            attachments,
            read: false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        await setDoc(messageRef, messageData);
        return messageData;
    }

    static async updateMessage(messageId: string, data: Partial<MessageDto>) {
        const messageRef = doc(firestoreDB, "messages", messageId);
        const messageSnap = await getDoc(messageRef);

        if (!messageSnap.exists()) {
            throw new Error("Message not found");
        }

        const updateData = {
            ...data,
            updatedAt: Timestamp.now()
        };

        await updateDoc(messageRef, updateData);

        const updatedMessageSnap = await getDoc(messageRef);
        return {
            id: updatedMessageSnap.id,
            ...updatedMessageSnap.data()
        };
    }

    static async markMessageAsRead(messageId: string) {
        const messageRef = doc(firestoreDB, "messages", messageId);
        const messageSnap = await getDoc(messageRef);

        if (!messageSnap.exists()) {
            throw new Error("Message not found");
        }

        const data = messageSnap.data() as MessageDto;
        if (!data.read) {
            await updateDoc(messageRef, { read: true });
        }
    }

    static async countUnreadMessages(taskId: string, userId: string) {
        const q = query(
            messagesCollection,
            where("taskId", "==", taskId),
            where("userId", "!=", userId),
            where("read", "==", false)
        );
        const snapshot = await getDocs(q);
        return snapshot.size;
    }

    static listenToUnreadMessagesCount(
        taskId: string,
        userId: string,
        callback: (count: number) => void
    ) {
        const q = query(
            messagesCollection,
            where("taskId", "==", taskId),
            where("userId", "!=", userId),
            where("read", "==", false)
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.size);
        });
    }

    static listenToExtensionRequests(
        taskId: string,
        userId: string,
        startDate: string,
        callback: (messages: MessageDto[]) => void
    ) {
        const constraints: QueryConstraint[] = [
            where("taskId", "==", taskId),
            where("userId", "==", userId),
            where("type", "==", "TIMELINE_MODIFICATION")
        ];

        if (startDate && startDate.trim()) {
            const startTimestamp = Timestamp.fromDate(new Date(startDate));
            constraints.push(where("createdAt", ">", startTimestamp));
        }

        constraints.push(orderBy("createdAt", "asc"));

        const q = query(messagesCollection, ...constraints);

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as MessageDto));
            callback(messages);
        });
    }

    static async uploadFile(file: File, taskId: string) {
        // Path must match the pattern in your rules: tasks/{taskId}/{fileName}
        const storageRef = ref(storage, `tasks/${taskId}/${Date.now()}_${file.name}`);

        // Add metadata so the browser knows how to handle the file
        const metadata = {
            contentType: file.type
        };

        // Upload with metadata
        const snapshot = await uploadBytes(storageRef, file, metadata);

        // Get the public-tokenized URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    }
}
