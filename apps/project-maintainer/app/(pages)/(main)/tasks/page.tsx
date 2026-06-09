"use client";
import TaskListSection from "./sections/TaskListSection";
import TaskDetailSection from "./sections/TaskDetailSection";
import TaskOverviewSection from "./sections/TaskOverviewSection";
import { TaskDto } from "@/app/models/task.model";
import { useRequest } from "ahooks";
import { useCallback, useMemo, useState } from "react";
import { TaskAPI } from "@/app/services/task.service";
import useInstallationStore from "@/app/state-management/useInstallationStore";
import { ActiveTaskContext } from "./contexts/ActiveTaskContext";
import { useCustomSearchParams } from "@devasign/shared/hooks";
import { useUnauthenticatedUserCheck } from "@/lib/firebase";
import Image from "next/image";

/**
 * Primary task management page for project maintainers.
 *
 * Layout: three-panel design —
 *   1. Left sidebar:  Paginated, filterable task list (TaskListSection).
 *   2. Middle panel:  Task detail with description and conversation tabs
 *                     (TaskDetailSection). Only shown when a task is selected.
 *   3. Right sidebar: Task overview metadata + activity feed with action
 *                     modals (TaskOverviewSection).
 *
 * The active task is driven by the `taskId` URL search param. The context
 * provides `refreshActiveTask` so child components (modals, conversation)
 * can trigger a re-fetch after mutations without a full page reload.
 */

const Tasks = () => {
    useUnauthenticatedUserCheck();
    const { searchParams } = useCustomSearchParams();
    const taskId = searchParams.get("taskId");
    const { activeInstallation } = useInstallationStore();
    const [activeTask, setActiveTask] = useState<TaskDto | null>(null);

    /** Re-fetches the active task from the API. Used by child components
     *  (e.g. after approving a submission) to refresh without a full page reload. */
    const refreshActiveTask = useCallback(async () => {
        if (!taskId || !activeInstallation) {
            return;
        }

        const response = await TaskAPI.getInstallationTaskById(
            activeInstallation.id,
            taskId
        );
        setActiveTask(response.data);
    }, [taskId, activeInstallation]);

    const activeTaskContextValue = useMemo(() => (
        { activeTask, setActiveTask, refreshActiveTask }
    ), [activeTask, refreshActiveTask]);

    // TODO: Implement caching
    const { loading: loadingTask } = useRequest(
        async () => {
            if (!activeInstallation || !taskId) {
                return null;
            }

            const response = await TaskAPI.getInstallationTaskById(
                activeInstallation.id,
                taskId
            );
            return response.data;
        },
        {
            refreshDeps: [taskId, activeInstallation],
            onSuccess: (data) => setActiveTask(data || null),
            onError: () => setActiveTask(null)
        }
    );

    return (
        <div className="h-[calc(100dvh-123px)] flex">
            <ActiveTaskContext.Provider value={activeTaskContextValue}>
                <TaskListSection />
                {!activeTask ? (
                    <>
                        <section className="grow border-x border-dark-200 grid place-content-center">
                            <div className="flex flex-col items-center gap-[50px]">
                                <p className="text-body-medium text-light-100 font-mono">
                                    {loadingTask ? "Loading task..." : "No task to show"}
                                </p>
                                <Image
                                    src="/task-empty-state.svg"
                                    alt=""
                                    width={0}
                                    height={170.5}
                                    className="w-auto"
                                    priority={true}
                                />
                            </div>
                        </section>
                        <section className="min-w-[360px] w-[12%] h-full pt-[30px] flex flex-col">
                            <div className="pl-5 pb-[30px] space-y-[30px] border-b border-dark-200">
                                <h6 className="text-headline-small text-light-100">Task Overview</h6>
                                <div className="space-y-2.5">
                                    <p className="text-body-tiny text-light-100">Developer</p>
                                    <p className="text-headline-large text-light-200">-</p>
                                </div>
                                <div className="space-y-2.5">
                                    <p className="text-body-tiny text-light-100">Bounty</p>
                                    <p className="text-headline-large text-light-200">-</p>
                                </div>
                                <div className="space-y-2.5">
                                    <p className="text-body-tiny text-light-100">Time Left</p>
                                    <p className="text-headline-large text-light-200">-</p>
                                </div>
                            </div>
                            <div className="pt-[30px] pl-5 flex items-center justify-between">
                                <h6 className="text-headline-small text-light-100">Task Activities</h6>
                            </div>
                        </section>
                    </>
                ) : (
                    <>
                        <TaskDetailSection />
                        <TaskOverviewSection />
                    </>
                )}
            </ActiveTaskContext.Provider>
        </div>
    );
};

export default Tasks;
