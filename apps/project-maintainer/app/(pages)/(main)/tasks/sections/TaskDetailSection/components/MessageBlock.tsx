/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import PopupModalLayout from "@devasign/shared/components/PopupModalLayout";
import { MessageDto } from "@devasign/shared/models/message.model";
import { TaskAPI } from "@/app/services/task.service";
import useUserStore from "@/app/state-management/useUserStore";
import { formatTime, handleApiErrorResponse, handleApiSuccessResponse } from "@/app/utils/helper";
import { useToggle } from "ahooks";
import { useContext, useState, useEffect, useRef } from "react";
import { FiArrowRight, FiCheckCircle, FiFile, FiDownload } from "react-icons/fi";
import { MdOutlineCancel } from "react-icons/md";
import { toast } from "react-toastify";
import Link from "next/link";
import { ActiveTaskContext } from "../../../contexts/ActiveTaskContext";
import { MessageAPI } from "@/app/services/message.service";

/**
 * Renders a single message in the conversation thread.
 *
 * Two rendering modes:
 * - **GENERAL**: Standard chat bubble. Aligned right for own messages (dark bg),
 *   left for the contributor (accent bg). Supports text + file attachments
 *   with image preview thumbnails.
 * - **SYSTEM (time extension request)**: Rendered as a card with Approve/Reject
 *   buttons. Only non-own system messages get the action UI. Once responded,
 *   the message flags `metadata.responded = true` to prevent repeat actions.
 *   Own system messages (the maintainer's reply) show a coloured confirmation
 *   strip (green for approved, red for rejected).
 *
 * Read receipts: An `IntersectionObserver` marks messages as read when >=50%
 * of the element is visible. This fires a Firestore update and immediately
 * reflects in local state, then disconnects the observer.
 */

type MessageBlockProps = {
    message: MessageDto;
    margin: string;
    setMessages: React.Dispatch<React.SetStateAction<MessageDto[]>>;
}

const MessageBlock = ({ message, margin, setMessages }: MessageBlockProps) => {
    const { currentUser } = useUserStore();
    const { activeTask, setActiveTask } = useContext(ActiveTaskContext);
    const [openReplyModal, { toggle: toggleReplyModal }] = useToggle(false);
    const [replyMode, setReplyMode] = useState<"approve" | "reject">("approve");
    const [replying, setReplying] = useState(false);
    const messageRef = useRef<HTMLDivElement>(null);

    // Mark message as read when it comes into view
    useEffect(() => {
        // Only mark messages as read if they're not from the current user and haven't been read yet
        if (!messageRef.current || message.userId === currentUser?.userId || message.read) {
            return;
        }

        const observer = new IntersectionObserver(
            async (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting) {
                    // Mark message as read
                    await MessageAPI.markMessageAsRead(message.id);

                    // Update local state to reflect the read status
                    setMessages(prev => prev.map(msg =>
                        msg.id === message.id ? { ...msg, read: true } : msg
                    ));

                    // Stop observing once marked as read
                    observer.disconnect();
                }
            },
            {
                threshold: 0.5, // Mark as read when 50% of the message is visible
                rootMargin: "0px 0px -50px 0px" // Add some margin to ensure message is well within view
            }
        );

        observer.observe(messageRef.current);

        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.userId]);

    /**
     * Handles the maintainer's response to a contributor's time-extension request.
     * On success, updates the message's `metadata.responded` flag in Firestore
     * to disable the action buttons, and merges the updated task data (new timeline)
     * into the active task context.
     */
    const replyExtensionRequest = async () => {
        setReplying(true);

        try {
            const response = await TaskAPI.replyTimelineExtensionRequest(
                activeTask!.id,
                {
                    accept: replyMode === "approve",
                    requestedTimeline: message.metadata!.requestedTimeline
                }
            );

            setMessages(prev => prev.map((msg) => {
                if (msg.id === message.id) {
                    return {
                        ...msg,
                        metadata: { ...msg.metadata!, responded: true }
                    } as MessageDto;
                } else {
                    return msg;
                }
            }));

            try {
                await MessageAPI.updateMessage(message.id, {
                    metadata: { ...message.metadata!, responded: true }
                });

                handleApiSuccessResponse(response);
            } catch {
                handleApiSuccessResponse(response);
                toast.warn("Failed to mark extension request message as 'responded'.");
            }

            setActiveTask({ ...activeTask!, ...response.data.task });
            toggleReplyModal();
        } catch (error) {
            handleApiErrorResponse(error, "Failed to respond to extension request. Please try again.");
        } finally {
            setReplying(false);
        }
    };

    return message.type === "GENERAL" ? (
        <div
            ref={messageRef}
            className={`${message.userId === currentUser?.userId ? "bg-dark-300 ml-auto" : "bg-primary-300 mr-auto"} 
                max-w-[78%] w-fit p-[15px] space-y-2.5 ${margin}`
            }
        >
            <p className="text-body-medium text-light-100">{message.body}</p>

            {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2.5">
                    {message.attachments.map((url, index) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(url);
                        return (
                            <Link
                                key={index}
                                href={url}
                                target="_blank"
                                className="relative block w-20 h-20 rounded-lg overflow-hidden border border-dark-200 hover:border-light-100 transition-colors bg-dark-400 group"
                            >
                                {isImage ? (
                                    <img
                                        src={url}
                                        alt={`Attachment ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                        <FiFile className="text-2xl text-primary-100 mb-1" />
                                        <span className="text-[10px] text-light-200 w-full truncate text-center">
                                            FILE
                                        </span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <FiDownload className="text-white text-xl" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            <small className="text-body-tiny font-bold text-dark-200">
                {formatTime(message.createdAt.toDate().toISOString())}
            </small>
        </div>
    ) : (
        <>
            {message.userId !== currentUser?.userId && (
                <div
                    ref={messageRef}
                    className={`max-w-[78%] w-fit mr-auto space-y-2.5 ${margin}`}
                >
                    <div className="max-w-full w-fit p-[15px] mr-auto bg-dark-400 border border-dark-300 space-y-5">
                        <p className="text-body-medium text-light-100">{message.body}</p>
                        {activeTask?.status === "COMPLETED" ? (
                            message.metadata?.responded ? (
                                <p className="text-body-medium text-light-100">You've responded!</p>
                            ) : (
                                <p className="text-body-medium text-light-100">
                                    Can't respond. Task already completed.
                                </p>
                            )
                        ) : message.metadata?.responded ? (
                            <p className="text-body-medium text-light-100">You've responded!</p>
                        ) : (
                            <div className="flex gap-2.5">
                                <ButtonPrimary
                                    format="SOLID"
                                    text="Approve"
                                    attributes={{
                                        onClick: () => {
                                            setReplyMode("approve");
                                            toggleReplyModal();
                                        }
                                    }}
                                />
                                <ButtonPrimary
                                    format="OUTLINE"
                                    text="Reject"
                                    attributes={{
                                        onClick: () => {
                                            setReplyMode("reject");
                                            toggleReplyModal();
                                        }
                                    }}
                                />
                            </div>
                        )}
                        {!message.metadata?.reason && (
                            <small className="text-body-tiny font-bold text-dark-200">
                                {formatTime(message.createdAt.toDate().toISOString())}
                            </small>
                        )}
                    </div>
                    {message.metadata?.reason && (
                        <div className="max-w-full w-fit p-[15px] mr-auto bg-dark-400 border border-dark-300 space-y-2.5">
                            <p className="text-body-medium text-light-100">{message.metadata?.reason}</p>
                            <small className="text-body-tiny font-bold text-dark-200">
                                {formatTime(message.createdAt.toDate().toISOString())}
                            </small>
                        </div>
                    )}
                </div>
            )}
            {message.userId === currentUser?.userId && (
                <div
                    ref={messageRef}
                    className={`max-w-[78%] w-fit p-2.5 ml-auto bg-dark-400 border flex items-center gap-2.5 ${margin} 
                        ${message.metadata?.reason === "ACCEPTED" ? "border-indicator-100" : "border-indicator-500"}`
                    }
                >
                    {message.metadata?.reason === "ACCEPTED" ? (
                        <FiCheckCircle className="text-2xl text-indicator-100" />
                    ) : (
                        <MdOutlineCancel className="text-2xl text-indicator-500" />
                    )}
                    <p className="text-body-medium text-dark-100">{message.body}</p>
                </div>
            )}

            {openReplyModal && (
                <PopupModalLayout
                    title={`${replyMode === "approve" ? "Approve" : "Reject"} Extension Request`}
                    toggleModal={toggleReplyModal}
                >
                    <p className="mt-2.5 mb-5 text-body-medium text-dark-100">
                        {replyMode === "approve"
                            ? "Are you sure you want to approve this extension request?"
                            : "Are you sure you want to reject this extension request?"
                        }
                    </p>
                    <ButtonPrimary
                        format="SOLID"
                        text={
                            replyMode === "approve"
                                ? replying ? "Approving..." : "Yes, Approve"
                                : replying ? "Rejecting..." : "Yes, Reject"
                        }
                        sideItem={<FiArrowRight />}
                        attributes={{
                            onClick: replyExtensionRequest,
                            disabled: replying
                        }}
                        extendedSideItemClassName="text-xl"
                        extendedClassName="w-fit"
                    />
                </PopupModalLayout>
            )}
        </>
    );
};

export default MessageBlock;
