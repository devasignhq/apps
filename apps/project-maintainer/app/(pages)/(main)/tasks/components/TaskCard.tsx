"use client";
import { TaskDto } from "@/app/models/task.model";
import { moneyFormat, taskStatusFormatter } from "@/app/utils/helper";
import { useContext, useState, useEffect, useMemo } from "react";
import { ActiveTaskContext } from "../contexts/ActiveTaskContext";
import { MessageAPI } from "@/app/services/message.service";
import useUserStore from "@/app/state-management/useUserStore";
import { useCustomSearchParams } from "@devasign/shared/hooks";
import { socket, joinSocketRoom, leaveSocketRoom } from "@/lib/socket";

type TaskCardProps = {
    task: TaskDto;
    active: boolean;
};

const TaskCard = ({ task: defaultTask, active }: TaskCardProps) => {
    const { currentUser } = useUserStore();
    const { activeTask } = useContext(ActiveTaskContext);
    const { searchParams, updateSearchParams, removeSearchParams } = useCustomSearchParams();
    const viewedTaskActivity = searchParams.get("viewedTaskActivity");
    const [task, setTask] = useState(defaultTask);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [unseenTaskActivities, setUnseenTaskActivities] = useState(
        task._count?.taskActivities || 0
    );
    const totalNotifications = useMemo(
        () => unseenTaskActivities + unreadMessagesCount,
        [unseenTaskActivities, unreadMessagesCount]
    );

    // Update task when defaultTask changes (e.g. after task list reload)
    useEffect(() => {
        setTask(prev => ({ ...prev, ...defaultTask }));
    }, [defaultTask]);

    // Update task when active task changes
    useEffect(() => {
        if (!active) return;

        setTask(prev => ({ ...prev, ...activeTask! }));
    }, [active, activeTask]);

    // Listen to task activities and messages count
    useEffect(() => {
        if (!currentUser || active) return;

        const room = `task_${task.id}`;
        joinSocketRoom(room);

        const handleActivity = (activity: { type: string; taskId?: string; metadata?: Partial<TaskDto> }) => {
            if (activity.type === "task" && activity.taskId === task.id) {
                setUnseenTaskActivities(prev => prev + 1);
                if (activity.metadata) {
                    setTask(prev => ({ ...prev, ...activity.metadata }));
                }
            }
        };

        socket.on("activity_update", handleActivity);

        const unsubscribeFromActivities = () => {
            socket.off("activity_update", handleActivity);
            leaveSocketRoom(room);
        };

        let unsubscribeFromMessages = () => {};
        if (task.contributorId) {
            unsubscribeFromMessages = MessageAPI.listenToUnreadMessagesCount(
                task.id,
                currentUser.userId,
                (count) => setUnreadMessagesCount(count)
            );
        }

        return () => {
            unsubscribeFromActivities();
            unsubscribeFromMessages();
        };
    }, [currentUser, active, task.id, task.contributorId]);

    // Remove viewed task activity when task is active
    useEffect(() => {
        if (!viewedTaskActivity || !active) return;

        setUnseenTaskActivities(prev => prev - 1);
        removeSearchParams("viewedTaskActivity");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, viewedTaskActivity]);

    return (
        <div
            onClick={() => updateSearchParams({ taskId: task.id }, true)}
            role="button"
            className={`w-full p-[15px] border space-y-2.5 cursor-pointer ${active
                ? "bg-dark-400 border-light-100"
                : totalNotifications > 0
                    ? "border-primary-100 hover:border-dark-200 hover:bg-dark-400"
                    : "border-primary-200 hover:border-dark-200 hover:bg-dark-400"}
            `}
        >
            <div className="flex items-center gap-1.5">
                <p className="text-body-tiny text-primary-400">#{task.issue.number}</p>
                {task.issue.labels?.length > 0 && (
                    <p className="py-0.5 px-[7px] bg-primary-300 text-body-tiny font-bold text-light-200 truncate">
                        {task.issue.labels
                            .map(label => label.name)
                            .map((name, index, array) =>
                                index === array.length - 1 ? name : `${name}, `
                            )
                            .join("")}
                    </p>
                )}
                <div className="w-fit ml-auto text-body-medium font-bold flex items-center gap-[5px]">
                    <p className="text-primary-400 whitespace-nowrap">{moneyFormat(task.bounty)} USDC</p>
                    {!active && totalNotifications > 0 ? (
                        <span className="px-[5px] text-body-tiny text-dark-500 bg-primary-100">
                            {totalNotifications}
                        </span>
                    ) : null}
                </div>
            </div>
            <p
                className="text-body-medium text-light-100 overflow-hidden leading-5"
                style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    maxHeight: "2.5rem",
                    lineHeight: "1.25rem"
                }}
            >
                {task.issue.title}
            </p>
            <div className="flex items-end justify-between mt-[15px]">
                <p className="text-body-tiny font-bold text-light-200 truncate">
                    {task.issue?.url.split("/").slice(-3)[0]}
                </p>
                {!active && (
                    <p className={`w-fit py-0.5 px-[7px] text-body-tiny font-bold ${taskStatusFormatter(task.status)[1]}`}>
                        {taskStatusFormatter(task.status)[0]}
                    </p>
                )}
            </div>
        </div>
    );
};

export default TaskCard;
