"use client";
import { TaskDto } from "@/app/models/task.model";
import { MessageAPI } from "@/app/services/message.service";
import useUserStore from "@/app/state-management/useUserStore";
import { moneyFormat, taskStatusFormatter } from "@/app/utils/helper";
import { useContext, useState, useEffect } from "react";
import { ActiveTaskContext } from "../contexts/ActiveTaskContext";

type TaskCardProps = {
    task: TaskDto;
    active: boolean;
    onClick: () => void;
};

const TaskCard = ({ task: defaultTask, active, onClick }: TaskCardProps) => {
    const { currentUser } = useUserStore();
    const { activeTask } = useContext(ActiveTaskContext);
    const [task, setTask] = useState(defaultTask);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    // Update task when defaultTask changes (e.g. after task list reload)
    useEffect(() => {
        setTask(prev => ({ ...prev, ...defaultTask }));
    }, [defaultTask]);

    // Update task when active task changes
    useEffect(() => {
        if (!active) return;

        setTask(prev => ({ ...prev, ...activeTask! }));
    }, [active, activeTask]);

    // Listen to unread messages count
    useEffect(() => {
        if (!currentUser?.userId || !task.id || !task.contributorId) return;

        const unsubscribe = MessageAPI.listenToUnreadMessagesCount(
            task.id,
            currentUser.userId,
            (count) => setUnreadMessagesCount(count)
        );

        return () => unsubscribe();
    }, [task, currentUser?.userId]);

    return (
        <div 
            onClick={onClick}
            role="button"
            className={`w-full p-[15px] border cursor-pointer 
                ${active 
            ? "bg-dark-400 border-light-100" 
            : unreadMessagesCount > 0
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
                    {(!active && unreadMessagesCount > 0) ? (
                        <span className="px-[5px] text-body-tiny text-dark-500 bg-primary-100">
                            {unreadMessagesCount}
                        </span>
                    ): null}
                </div>
            </div>
            <p 
                className="text-body-medium text-light-100 overflow-hidden leading-5 mt-2.5"
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
                    {task.issue?.url.split("/").slice(-4)[0]}/
                    {task.issue?.url.split("/").slice(-4)[1]}
                </p>
                {(task.contributorId && (task.contributorId !== currentUser?.userId)) ? (
                    <p className="w-fit py-0.5 px-[7px] text-body-tiny font-bold bg-primary-400 text-dark-500">
                        Not Accepted
                    </p>
                ) : !active ? (
                    <p className={`w-fit py-0.5 px-[7px] text-body-tiny font-bold ${taskStatusFormatter(task.status)[1]}`}>
                        {taskStatusFormatter(task.status)[0]}
                    </p>
                ) : null}
            </div>
        </div>
    );
};
 
export default TaskCard;
