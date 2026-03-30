import ButtonPrimary from "@/app/components/ButtonPrimary";
import { socket, joinSocketRoom, leaveSocketRoom } from "@/lib/socket";
import { FiArrowUpRight, FiEdit3 } from "react-icons/fi";
import { MdOutlineCancel } from "react-icons/md";
import TaskActivityCard from "../components/TaskActivityCard";
import Link from "next/link";
import { useInfiniteScroll, useToggle } from "ahooks";
import SetTaskBountyModal from "../modals/SetTaskBountyModal";
import SetTaskTimelineModal from "../modals/SetTaskTimelineModal";
import DeleteTaskModal from "../modals/DeleteTaskModal";
import { useContext, useEffect, useRef } from "react";
import { ActiveTaskContext } from "../contexts/ActiveTaskContext";
import { formatTimeline, moneyFormat, taskStatusFormatter } from "@/app/utils/helper";
import { TaskDto } from "@/app/models/task.model";
import { HiOutlineRefresh } from "react-icons/hi";
import { Data } from "ahooks/lib/useInfiniteScroll/types";
import { TaskAPI } from "@/app/services/task.service";
import useUserStore from "@/app/state-management/useUserStore";
import useInstallationStore from "@/app/state-management/useInstallationStore";

const TaskOverviewSection = () => {
    const { activeTask, setActiveTask } = useContext(ActiveTaskContext);
    const { currentUser } = useUserStore();
    const { activeInstallation } = useInstallationStore();
    const [openSetTaskBountyModal, { toggle: toggleSetTaskBountyModal }] = useToggle(false);
    const [openSetTaskTimelineModal, { toggle: toggleSetTaskTimelineModal }] = useToggle(false);
    const [openDeleteTaskModal, { toggle: toggleDeleteTaskModal }] = useToggle(false);
    const listRef = useRef<HTMLDivElement>(null);

    const {
        data: activities,
        loading: loadingActivities,
        loadingMore: loadingMoreActivities,
        noMore: noMoreActivities,
        loadMore: loadMoreActivities,
        reload: reloadActivities
    } = useInfiniteScroll<Data>(
        async (currentData) => {
            if (!activeTask) {
                return { list: [], pagination: null };
            }

            const pageToLoad = currentData ? currentData.pagination.page + 1 : 1;

            const response = await TaskAPI.getTaskActivities(
                activeTask.id,
                { page: pageToLoad, limit: 30 }
            );

            return {
                list: response.data,
                pagination: response.pagination
            };
        },
        {
            target: listRef,
            isNoMore: (data) => !data?.pagination?.hasMore,
            reloadDeps: [activeTask?.id]
        }
    );

    useEffect(() => {
        if (!activeTask?.id || !currentUser) return;

        const room = `task_${activeTask.id}`;
        joinSocketRoom(room);

        const handleActivity = (activity: { type: string; taskId?: string; metadata?: Partial<TaskDto> }) => {
            if (
                activity.type === "task" &&
                activity.taskId === activeTask.id
            ) {
                reloadActivities();
                if (activity.metadata) {
                    setActiveTask(prev => prev ? ({ ...prev, ...activity.metadata } as TaskDto) : null);
                }
            }
        };

        socket.on("activity_update", handleActivity);

        return () => {
            socket.off("activity_update", handleActivity);
            leaveSocketRoom(room);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTask?.id, currentUser?.userId]);

    return (
        <>
            <section className="min-w-[360px] w-[12%] h-full pt-[30px] flex flex-col">
                <div className="pl-5 pb-[30px] space-y-[30px] border-b border-dark-200">
                    <div className="flex items-center justify-between">
                        <h6 className="text-headline-small text-light-100">Task Overview</h6>
                        <p className={`w-fit py-0.5 px-[7px] text-body-tiny font-bold ${taskStatusFormatter(activeTask!.status)[1]}`}>
                            {taskStatusFormatter(activeTask!.status)[0]}
                        </p>
                    </div>

                    {activeTask?.status !== "OPEN" && (
                        <div className="space-y-2.5">
                            <p className="text-body-tiny text-light-100">Developer</p>
                            <div className="flex items-center gap-1">
                                <p className="text-body-large text-light-200">@{activeTask?.contributor?.username}</p>
                                <Link href={`https://github.com/${activeTask?.contributor?.username}`} target="_blank">
                                    <FiArrowUpRight className="text-2xl text-primary-100 hover:text-light-100" />
                                </Link>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2.5">
                        <p className="text-body-tiny text-light-100">Bounty</p>
                        <div className="flex items-center gap-1">
                            <p className="text-body-large text-light-200">{moneyFormat(activeTask?.bounty || "")} USDC</p>
                            {(activeTask?.status === "OPEN" &&
                                activeTask?._count &&
                                activeTask._count.taskActivities < 1 &&
                                activeInstallation?.status === "ACTIVE"
                            ) ? (
                                    <button onClick={toggleSetTaskBountyModal}>
                                        <FiEdit3 className="text-2xl text-primary-100 hover:text-light-100" />
                                    </button>
                                ) : null}
                        </div>
                    </div>

                    {activeTask?.status === "OPEN" ? (
                        <div className="space-y-2.5">
                            <p className="text-body-tiny text-light-100">Timeline</p>
                            <div className="flex items-center gap-1">
                                <p className="text-body-large text-light-200">
                                    {formatTimeline(activeTask.timeline).displayValue}
                                </p>
                                {(activeTask._count && activeTask._count?.taskActivities < 1 && activeInstallation?.status === "ACTIVE") ? (
                                    <button onClick={toggleSetTaskTimelineModal}>
                                        <FiEdit3 className="text-2xl text-primary-100 hover:text-light-100" />
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {activeTask?.status === "COMPLETED" ? (
                                <>
                                    <p className="text-body-tiny text-light-100">Completed In</p>
                                    <p className="text-body-large text-light-200">
                                        {getCompletionTime(activeTask)}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-body-tiny text-light-100">Time Left</p>
                                    <p className={`text-body-large ${getTimeLeft(activeTask!).startsWith("Overdue")
                                        ? "text-indicator-500"
                                        : "text-light-200"}`
                                    }>
                                        {getTimeLeft(activeTask!)}
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {(activeTask?.status === "OPEN" && activeInstallation?.status === "ACTIVE") && (
                        <ButtonPrimary
                            format="OUTLINE"
                            text="Delete Task"
                            sideItem={<MdOutlineCancel />}
                            attributes={{ onClick: toggleDeleteTaskModal }}
                            extendedClassName="border-indicator-500 text-indicator-500"
                        />
                    )}
                </div>
                <div className="pt-[30px] pl-5 flex items-center justify-between">
                    <h6 className="text-headline-small text-light-100">Task Activities</h6>
                    {activeInstallation?.status === "ACTIVE" && (
                        <button
                            onClick={reloadActivities}
                            disabled={loadingActivities || loadingMoreActivities}
                            className={(loadingActivities || loadingMoreActivities) ? "rotate-loading" : ""}
                        >
                            <HiOutlineRefresh className="text-2xl text-light-200 hover:text-light-100" />
                        </button>
                    )}
                </div>
                <div ref={listRef} className="pl-5 pb-5 mt-[30px] overflow-y-auto space-y-[15px]">
                    {activities?.list?.map((activity) => (
                        <TaskActivityCard
                            key={activity.id}
                            activity={activity}
                        />
                    ))}
                    {(activities?.list && activities.list.length < 1 && !loadingActivities) && (
                        <p className="text-body-medium text-light-100">No activity to show</p>
                    )}
                    {(loadingActivities && activities?.list && activities.list.length < 1) && (
                        <p className="text-body-medium text-light-100">Loading activities...</p>
                    )}
                    {loadingMoreActivities && (
                        <p className="text-body-medium text-light-100">Loading more activities...</p>
                    )}
                    {(!loadingMoreActivities && !noMoreActivities) && (
                        <button
                            className="text-body-medium text-light-200 font-bold hover:text-light-100 pt-2.5"
                            onClick={loadMoreActivities}
                        >
                            Load More
                        </button>
                    )}
                </div>
            </section>

            {openSetTaskBountyModal && <SetTaskBountyModal toggleModal={toggleSetTaskBountyModal} />}
            {openSetTaskTimelineModal && <SetTaskTimelineModal toggleModal={toggleSetTaskTimelineModal} />}
            {openDeleteTaskModal && <DeleteTaskModal toggleModal={toggleDeleteTaskModal} />}
        </>
    );
};

export default TaskOverviewSection;

/**
 * Calculates the time left for a task based on its timeline, timelineType, and acceptedAt date
 * @param task - The task object containing timeline information
 * @returns Formatted string showing time left (e.g., "1 week(s) 5 day(s)", "1 week(s)", "5 day(s)")
 */
export const getTimeLeft = (task: TaskDto): string => {
    // If no timeline is set, return empty string or a default message
    if (!task.timeline) {
        return "No deadline set";
    }

    // Parse the acceptedAt date
    const acceptedAt = new Date(task.acceptedAt!);
    const now = new Date();

    // Calculate total days for the timeline
    const totalTimelineDays = task.timeline;

    // Calculate the deadline
    const deadline = new Date(acceptedAt);
    deadline.setDate(deadline.getDate() + totalTimelineDays);

    // Calculate the difference in milliseconds
    const timeDiff = deadline.getTime() - now.getTime();

    // If the deadline has passed, calculate how overdue it is
    if (timeDiff <= 0) {
        const overdueDays = Math.ceil(Math.abs(timeDiff) / (1000 * 60 * 60 * 24));
        return `Overdue by ${formatTimeLeft(overdueDays)}`;
    }

    // Convert milliseconds to days
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // Format the output
    return formatTimeLeft(daysLeft);
};

/**
 * Formats the number of days left into a readable string
 * @param totalDays - Total number of days left
 * @returns Formatted string (e.g., "1 week(s) 5 day(s)", "1 week(s)", "5 day(s)")
 */
const formatTimeLeft = (totalDays: number): string => {
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;

    const parts: string[] = [];

    if (weeks > 0) {
        parts.push(`${weeks} week${weeks !== 1 ? "(s)" : ""}`);
    }

    if (days > 0) {
        parts.push(`${days} day${days !== 1 ? "(s)" : ""}`);
    }

    // If no time left (shouldn't happen due to overdue check, but safety)
    if (parts.length === 0) {
        return "Less than 1 day";
    }

    return parts.join(" ");
};

/**
 * Alternative version that returns an object with more detailed information
 */
export const getDetailedTimeLeft = (task: TaskDto) => {
    if (!task.timeline) {
        return {
            isValid: false,
            isOverdue: false,
            totalDays: 0,
            weeks: 0,
            days: 0,
            formatted: "No deadline set",
            deadline: null
        };
    }

    const acceptedAt = new Date(task.acceptedAt!);
    const now = new Date();

    const totalTimelineDays = task.timeline;

    const deadline = new Date(acceptedAt);
    deadline.setDate(deadline.getDate() + totalTimelineDays);

    const timeDiff = deadline.getTime() - now.getTime();
    const isOverdue = timeDiff <= 0;

    if (isOverdue) {
        const overdueDays = Math.ceil(Math.abs(timeDiff) / (1000 * 60 * 60 * 24));
        return {
            isValid: true,
            isOverdue: true,
            totalDays: -overdueDays,
            weeks: 0,
            days: 0,
            formatted: `Overdue by ${overdueDays} day${overdueDays !== 1 ? "(s)" : ""}`,
            deadline
        };
    }

    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(daysLeft / 7);
    const days = daysLeft % 7;

    return {
        isValid: true,
        isOverdue: false,
        totalDays: daysLeft,
        weeks,
        days,
        formatted: formatTimeLeft(daysLeft),
        deadline
    };
};

/**
 * Helper function to get the deadline date for a task
 */
export const getTaskDeadline = (task: TaskDto): Date | null => {
    if (!task.timeline) {
        return null;
    }

    const acceptedAt = new Date(task.acceptedAt!);
    const totalTimelineDays = task.timeline;

    const deadline = new Date(acceptedAt);
    deadline.setDate(deadline.getDate() + totalTimelineDays);

    return deadline;
};

/**
 * Calculates the time taken to complete a task
 * @param task - The task object containing acceptedAt and completedAt dates
 * @returns Formatted string showing completion time (e.g., "1 week(s) 5 day(s)", "5 day(s)")
 */
export const getCompletionTime = (task: TaskDto): string => {
    // If task is not completed or missing required dates
    if (!task.acceptedAt || !task.completedAt) {
        return "N/A";
    }

    const acceptedAt = new Date(task.acceptedAt);
    const completedAt = new Date(task.completedAt);

    // Calculate the difference in milliseconds
    const timeDiff = completedAt.getTime() - acceptedAt.getTime();

    // If negative (shouldn't happen, but safety check)
    if (timeDiff < 0) {
        return "Invalid dates";
    }

    // Convert milliseconds to days (rounded up)
    const totalDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // Format the output
    return formatTimeLeft(totalDays);
};
