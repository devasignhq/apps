import { MessageDto } from "@devasign/shared/models/message.model";
import { MessageAPI } from "@/app/services/message.service";
import useUserStore from "@/app/state-management/useUserStore";
import { useState, useEffect, useMemo, useRef, useContext } from "react";
import { ActiveTaskContext } from "../../contexts/ActiveTaskContext";
import { useLockFn } from "ahooks";

/** Messages grouped by their date label (e.g. "Today", "Yesterday", "15th April 2026"). */
export interface GroupedMessages {
    [dateLabel: string]: MessageDto[];
}

/**
 * Core messaging state manager for the conversation panel.
 *
 * Sets up two independent Firestore real-time listeners:
 * 1. **Task messages**: Listens for new messages from the project maintainer
 *    (creator), starting after the last known creator message to avoid replaying
 *    the full history.
 * 2. **Extension requests**: Listens for the current contributor's own timeline
 *    extension request messages, so the UI can show accepted/rejected responses
 *    as they arrive.
 *
 * If an accepted timeline extension is detected, the active task's timeline is
 * updated in context immediately (avoiding a full task refetch).
 *
 * Deduplication: A `focus` event listener deduplicates messages on window
 * re-focus. This handles the edge case where Firestore pushes a duplicate
 * snapshot after the tab was backgrounded (browser throttling).
 */
export const useManageMessages = (taskId: string, creatorId: string) => {
    const { currentUser } = useUserStore();
    const { activeTask, setActiveTask } = useContext(ActiveTaskContext);
    const messageBoxRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<MessageDto[]>([]);
    const [loading, setLoading] = useState(true);

    const groupedMessages = useMemo<GroupedMessages>(() => {
        return groupMessagesByDay(messages);
    }, [messages]);
    const orderedDateLabels = useMemo<string[]>(() => {
        return getOrderedDateLabels(groupedMessages);
    }, [groupedMessages]);

    /**
     * Appends the most recent message from a batch and then waits 2.5s
     * before allowing the next batch. The `useLockFn` wrapper prevents
     * concurrent updates from interleaving, which can happen when both
     * Firestore listeners fire in quick succession.
     */
    const updateMessage = useLockFn(async (newMessages: MessageDto[]) => {
        const update = new Promise((resolve) => {
            setMessages(prev => [...prev, newMessages[newMessages.length - 1]]);
            setTimeout(() => resolve(null), 2500);
        });

        await update;
    });

    useEffect(() => {
        if (!taskId || !creatorId || !currentUser) return;

        let unsubscribeFromTaskMessages: (() => void) | null = null;
        let unsubscribeFromExtensionRequests: (() => void) | null = null;

        const initializeMessages = async () => {
            try {
                const initialMessages = await MessageAPI.getTaskMessages(taskId);
                setMessages(initialMessages);
                setLoading(false);

                unsubscribeFromTaskMessages = MessageAPI.listenToTaskMessages(
                    taskId,
                    creatorId,
                    (getLastUserMessage(initialMessages, creatorId)?.createdAt)?.toDate().toISOString() || "",
                    async (updatedMessages) => {
                        if (updatedMessages.length > 0) {
                            const latestMessage = updatedMessages[updatedMessages.length - 1];

                            if (latestMessage?.type === "TIMELINE_MODIFICATION" &&
                                latestMessage?.metadata?.reason === "ACCEPTED"
                            ) {
                                setActiveTask({
                                    ...activeTask!,
                                    timeline: latestMessage?.metadata?.requestedTimeline,
                                    updatedAt: latestMessage?.createdAt?.toDate()?.toISOString()
                                });
                            }

                            await updateMessage(updatedMessages);
                        }
                    }
                );
                unsubscribeFromExtensionRequests = MessageAPI.listenToExtensionRequests(
                    taskId,
                    currentUser.userId,
                    (getLastUserMessage(initialMessages, currentUser.userId)?.createdAt)?.toDate().toISOString() || "",
                    async (updatedMessages: MessageDto[]) => {
                        if (updatedMessages.length > 0) {
                            await updateMessage(updatedMessages);
                        }
                    }
                );
            } catch {
                setLoading(false);
            }
        };

        initializeMessages();

        return () => {
            if (unsubscribeFromTaskMessages) unsubscribeFromTaskMessages();
            if (unsubscribeFromExtensionRequests) unsubscribeFromExtensionRequests();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [creatorId, currentUser, taskId]);

    /**
     * Deduplicates messages on window re-focus. Firestore's onSnapshot can
     * occasionally re-deliver events when the tab comes back from being
     * backgrounded, leading to duplicate messages in the local array.
     */
    useEffect(() => {
        const handleFocus = () => {
            setMessages((prevMessages) => {
                const uniqueMessages = new Map();
                prevMessages.forEach((msg) => uniqueMessages.set(msg.id, msg));
                return Array.from(uniqueMessages.values());
            });
        };

        window.addEventListener("focus", handleFocus);

        return () => {
            window.removeEventListener("focus", handleFocus);
        };
    }, []);

    // Auto-scroll to the bottom of the message container whenever new messages arrive.
    // Uses a short delay to ensure the DOM has finished rendering the new content.
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (messageBoxRef.current) {
            timeoutId = setTimeout(() => {
                messageBoxRef.current!.scrollTop = messageBoxRef.current!.scrollHeight;
            }, 200);
        }
        return () => clearTimeout(timeoutId);
    }, [groupedMessages.length, messages.length]);

    return {
        messageBoxRef,
        messages,
        groupedMessages,
        orderedDateLabels,
        loadingInitialMessages: loading,
        setMessages
    };
};

export const formatDateLabel = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Reset time to midnight for accurate day comparison
    const messageDate = new Date(date);
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const messageMidnight = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

    // Calculate days difference
    const timeDiff = todayMidnight.getTime() - messageMidnight.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
        return "Today";
    } else if (daysDiff === 1) {
        return "Yesterday";
    } else if (daysDiff >= 2 && daysDiff <= 6) {
        // Return day name for 2-6 days ago
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return dayNames[messageDate.getDay()];
    } else {
        // Return formatted date for 7+ days ago
        const day = messageDate.getDate();
        const month = messageDate.toLocaleString("en-US", { month: "long" });
        const year = messageDate.getFullYear();

        // Add ordinal suffix to day
        const getOrdinalSuffix = (day: number): string => {
            if (day >= 11 && day <= 13) {
                return "th";
            }
            switch (day % 10) {
                case 1: return "st";
                case 2: return "nd";
                case 3: return "rd";
                default: return "th";
            }
        };

        return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
    }
};

/**
 * Groups a flat array of messages into buckets keyed by human-readable date labels.
 * Uses Firestore Timestamps (via `.toDate()`) to extract the date from each message.
 */
export const groupMessagesByDay = (messages: MessageDto[]): GroupedMessages => {
    const grouped: GroupedMessages = {};

    messages.forEach(message => {
        const messageDate = message.createdAt.toDate();

        const dateLabel = formatDateLabel(messageDate);

        if (!grouped[dateLabel]) {
            grouped[dateLabel] = [];
        }

        grouped[dateLabel].push(message);
    });

    return grouped;
};

/**
 * Returns date labels sorted chronologically (oldest first) by comparing the
 * actual timestamps of each group's first message, rather than parsing the
 * human-readable label strings.
 */
export const getOrderedDateLabels = (groupedMessages: GroupedMessages): string[] => {
    const labels = Object.keys(groupedMessages);

    return labels.sort((a, b) => {
        const messagesA = groupedMessages[a];
        const messagesB = groupedMessages[b];

        if (!messagesA.length || !messagesB.length) return 0;

        const dateA = messagesA[0].createdAt.toDate();
        const dateB = messagesB[0].createdAt.toDate();

        return dateA.getTime() - dateB.getTime();
    });
};

/** Scans messages in reverse to find the most recent message from a specific user. */
const getLastUserMessage = (messages: MessageDto[], userId: string) => {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].userId === userId) {
            return messages[i];
        }
    }
    return null;
};
