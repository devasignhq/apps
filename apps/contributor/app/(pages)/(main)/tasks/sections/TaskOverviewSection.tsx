"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import { FiArrowRight, FiArrowUpRight } from "react-icons/fi";
// import TaskActivityCard from "../components/TaskActivityCard";
import Link from "next/link";
import { useInfiniteScroll, useToggle } from "ahooks";
import SubmitTaskModal from "../modals/SubmitTaskModal";
import RequestTimeExtensionModal from "../modals/RequestTimeExtensionModal";
import { useContext } from "react";
import { ActiveTaskContext } from "../contexts/ActiveTaskContext";
import { formatTimeline, moneyFormat, taskStatusFormatter } from "@/app/utils/helper";
import { TaskDto } from "@/app/models/task.model";
import { FaRegClock } from "react-icons/fa6";
import { Data } from "ahooks/lib/useInfiniteScroll/types";
import { TaskAPI } from "@/app/services/task.service";
import { HiOutlineRefresh } from "react-icons/hi";
import { PiCodeSimpleBold } from "react-icons/pi";
import useUserStore from "@/app/state-management/useUserStore";

/**
 * Middle panel of the tasks page showing the active task's detailed overview.
 *
 * Layout adapts based on assignment state:
 * - Full-width when the conversation panel is hidden (OPEN tasks / unassigned).
 * - Narrower (min 550px) when shown alongside the conversation panel.
 *
 * Top section: Task metadata grid (project, repo, issue, bounty, timeline/status).
 * Bottom section: Three possible states —
 *   1. Assigned to current user → Updates feed + Submit/Extend actions.
 *   2. Assigned to another user  → "Not Accepted" notice.
 *   3. OPEN (pending delegation)  → "Application Sent" notice.
 */

const TaskOverviewSection = () => {
    const { currentUser } = useUserStore();
    const { activeTask } = useContext(ActiveTaskContext);
    const [openSubmitTaskModal, { toggle: toggleSubmitTaskModal }] = useToggle(false);
    const [openRequestTimeExtensionModal, { toggle: toggleRequestTimeExtensionModal }] = useToggle(false);
    // Extract org/repo/issues/number segments from the full GitHub issue URL
    const issueUrl = activeTask?.issue?.url.split("/").slice(-4) as string[];

    const {
        data: activities,
        loading: loadingActivities,
        loadingMore: loadingMoreActivities,
        noMore: noMoreActivities,
        loadMore: loadMoreActivities,
        reload: reloadActivities
    } = useInfiniteScroll<Data>(
        async (currentData) => {
            const pageToLoad = currentData ? currentData.pagination.page + 1 : 1;

            const response = await TaskAPI.getTaskActivities(
                activeTask!.id,
                { page: pageToLoad, limit: 30 }
            );

            return {
                list: response.data,
                pagination: response.pagination
            };
        },
        {
            isNoMore: (data) => !data?.pagination.hasMore,
            reloadDeps: [activeTask]
        }
    );

    return (
        <>
            <section className={`${(activeTask?.status !== "OPEN" && activeTask?.contributorId === currentUser?.userId) ? "min-w-[550px] w-[12%]" : "w-full"} 
                h-full border-l border-dark-200 pt-[30px] flex flex-col`}
            >
                <div className="px-[30px] pt-[30px] pb-10 space-y-[30px] border-b border-dark-200">
                    <div className="flex items-center justify-between">
                        <h6 className="text-headline-small text-light-100">Overview</h6>
                        {(activeTask?.status !== "OPEN" && activeTask?.contributorId !== currentUser?.userId) ? (
                            <p className="w-fit py-0.5 px-[7px] text-body-tiny font-bold bg-primary-400 text-dark-500">
                                Not Accepted
                            </p>
                        ) : (
                            <p className={`w-fit py-0.5 px-[7px] text-body-tiny font-bold ${taskStatusFormatter(activeTask!.status)[1]}`}>
                                {taskStatusFormatter(activeTask!.status)[0]}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-[30px]">
                        <div className="space-y-2.5">
                            <p className="text-body-tiny text-light-100">Project</p>
                            <div className="flex items-center gap-1">
                                <p className="text-body-large text-light-200">{issueUrl[0]}</p>
                                <Link href={`https://github.com/${issueUrl[0]}`} target="_blank">
                                    <FiArrowUpRight className="text-2xl text-primary-100 hover:text-light-100" />
                                </Link>
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            <p className="text-body-tiny text-light-100">Repository</p>
                            <div className="flex items-center gap-1">
                                <p className="text-body-large text-light-200">{issueUrl[1]}</p>
                                <Link href={`https://github.com/${issueUrl[0]}/${issueUrl[1]}`} target="_blank">
                                    <FiArrowUpRight className="text-2xl text-primary-100 hover:text-light-100" />
                                </Link>
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            <p className="text-body-tiny text-light-100">Issue No</p>
                            <div className="flex items-center gap-1">
                                <p className="text-body-large text-light-200">#{activeTask?.issue?.number}</p>
                                <Link href={activeTask?.issue?.url || ""} target="_blank">
                                    <FiArrowUpRight className="text-2xl text-primary-100 hover:text-light-100" />
                                </Link>
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            <p className="text-body-tiny text-light-100">Bounty</p>
                            <p className="text-body-large text-light-200">{moneyFormat(activeTask?.bounty || "")} USDC</p>
                        </div>

                        {(activeTask?.status === "OPEN" || (activeTask && activeTask?.contributorId !== currentUser?.userId)) ? (
                            <div className="space-y-2.5 whitespace-nowrap">
                                <p className="text-body-tiny text-light-100">Timeline</p>
                                <p className="text-body-large text-light-200">
                                    {formatTimeline(activeTask.timeline).displayValue}
                                </p>
                            </div>
                        ) : activeTask?.status === "COMPLETED" ? (
                            <div className="space-y-2.5">
                                <p className="text-body-tiny text-light-100">Completed In</p>
                                <p className="text-body-large text-light-200">
                                    {getCompletionTime(activeTask)}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                <p className="text-body-tiny text-light-100">Time Left</p>
                                <p className={`text-body-large ${getTimeLeft(activeTask!).startsWith("Overdue") ? "text-indicator-500" : "text-light-200"}`}>
                                    {getTimeLeft(activeTask!)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Action buttons: only visible for active (non-OPEN, non-COMPLETED) tasks
                        owned by the current contributor. "Submit Task" is only for IN_PROGRESS. */}
                    {(activeTask?.status !== "COMPLETED" && activeTask?.status !== "OPEN") && (
                        <div className="flex items-center gap-5">
                            {activeTask?.status === "IN_PROGRESS" && (
                                <ButtonPrimary
                                    format="SOLID"
                                    text="Submit Task"
                                    sideItem={<FiArrowRight />}
                                    attributes={{ onClick: toggleSubmitTaskModal }}
                                />
                            )}
                            <button
                                onClick={toggleRequestTimeExtensionModal}
                                className="group text-primary-100 flex items-center gap-[5px]"
                            >
                                <span className="text-button-large group-hover:text-light-100">Extend Timeline</span>
                                <FaRegClock className="text-2xl" />
                            </button>
                        </div>
                    )}
                </div>

                {(activeTask?.status !== "OPEN" && activeTask?.contributorId === currentUser?.userId) ? (
                    <div className="grow flex flex-col pt-[30px] pb-5 px-[30px]">
                        <div className="flex items-center justify-between">
                            <h6 className="text-headline-small text-light-100">Updates</h6>
                            <button
                                onClick={reloadActivities}
                                disabled={loadingActivities || loadingMoreActivities}
                                className={(loadingActivities || loadingMoreActivities) ? "rotate-loading" : ""}
                            >
                                <HiOutlineRefresh className="text-2xl text-light-200 hover:text-light-100" />
                            </button>
                        </div>
                        <div className="grow pl-5 pb-5 mt-[30px] flex flex-col overflow-y-auto space-y-[15px]">
                            {/* {activities?.list?.map((activity) => (
                                <TaskActivityCard
                                    key={activity.id}
                                    issueNumber={activeTask!.issue.number}
                                    activity={activity}
                                    issueUrl={activeTask!.issue.url}
                                />
                            ))} */}
                            {(!loadingActivities && activities?.list && activities.list.length < 1) && (
                                <div className="grow grid place-content-center text-light-100">
                                    <PiCodeSimpleBold className="text-2xl text-light-100 mx-auto" />
                                    <h2 className="text-body-small text-light-100 my-2.5 text-center">
                                        No updates to show
                                    </h2>
                                    <p className="text-body-tiny text-dark-100 mb-[30px] text-center">
                                        You’ll get notified on when there’s progress
                                        <br /> on the task you’re handling.
                                    </p>
                                </div>
                            )}
                            {(loadingActivities && activities?.list && activities.list.length < 1) && (
                                <div className="grow grid place-content-center text-light-100">
                                    <PiCodeSimpleBold className="text-2xl text-light-100 mx-auto mb-2.5" />
                                    <p className="text-body-medium text-light-100">Loading updates...</p>
                                </div>
                            )}
                            {loadingMoreActivities && (
                                <p className="mx-auto text-body-medium text-light-100">Loading more updates...</p>
                            )}
                            {(!loadingMoreActivities && !noMoreActivities) && (
                                <button
                                    className="mx-auto text-body-medium text-light-200 font-bold hover:text-light-100 pt-2.5"
                                    onClick={loadMoreActivities}
                                >
                                    Load More
                                </button>
                            )}
                        </div>
                    </div>
                ) : (activeTask?.contributorId && (activeTask?.contributorId !== currentUser?.userId)) ? (
                    <div className="grow pt-[80px] text-light-100">
                        <PiCodeSimpleBold className="text-2xl text-light-100 mx-auto" />
                        <h2 className="text-body-small text-light-100 my-2.5 text-center">
                            Application Was Not Accepted
                        </h2>
                        <p className="text-body-tiny text-dark-100 mb-[30px] text-center">
                            The bounty creator did not accept your application.
                        </p>
                    </div>
                ) : (
                    <div className="grow pt-[80px] text-light-100">
                        <PiCodeSimpleBold className="text-2xl text-light-100 mx-auto" />
                        <h2 className="text-body-small text-light-100 my-2.5 text-center">
                            Application Sent, Delegation Pending
                        </h2>
                        <p className="text-body-tiny text-dark-100 mb-[30px] text-center">
                            You’ll get notified on when the bounty creator delegates this task to you or not.
                        </p>
                    </div>
                )}
            </section>

            {openSubmitTaskModal && <SubmitTaskModal toggleModal={toggleSubmitTaskModal} />}
            {openRequestTimeExtensionModal && <RequestTimeExtensionModal toggleModal={toggleRequestTimeExtensionModal} />}
        </>
    );
};

export default TaskOverviewSection;

/**
 * Calculates the time left for a task based on its timeline and acceptedAt date
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

    // If the deadline has passed, return overdue message
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
