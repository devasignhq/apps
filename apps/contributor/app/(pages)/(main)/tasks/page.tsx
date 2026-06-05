"use client";
import TaskOverviewSection from "./sections/TaskOverviewSection";
import ConversationSection from "./sections/ConversationSection";
import { FilterTasks, TASK_STATUS, TaskDto, TaskStatus } from "@/app/models/task.model";
import { useState, useEffect, useRef, useMemo } from "react";
import { useInfiniteScroll, useRequest } from "ahooks";
import { TaskAPI } from "@/app/services/task.service";
import { FiFilePlus } from "react-icons/fi";
import { useCustomSearchParams } from "@devasign/shared/hooks";
import { Data } from "ahooks/lib/useInfiniteScroll/types";
import TaskCard from "./components/TaskCard";
import { HiOutlineRefresh } from "react-icons/hi";
import { ActiveTaskContext } from "./contexts/ActiveTaskContext";
import { useUnauthenticatedUserCheck } from "@/lib/firebase";
import useUserStore from "@/app/state-management/useUserStore";
import Image from "next/image";
import FilterDropdown from "@devasign/shared/components/Dropdown/Filter";
import SearchBox from "./components/SearchBox";
import { enumToStringConverter } from "@/app/utils/helper";
import Tooltip from "@devasign/shared/components/Tooltip";
import { socket } from "@/lib/socket";

/**
 * Primary task management dashboard for contributors.
 *
 * Layout: three-panel design —
 *   1. Left sidebar:  Paginated task list with search/filter controls.
 *   2. Middle panel:  Task overview (details, actions, updates).
 *   3. Right panel:   Conversation thread with the project maintainer
 *                     (only visible for tasks assigned to the current user).
 *
 * The active task is driven by the `taskId` URL search param so that
 * task deep-links are shareable and browser back/forward works naturally.
 *
 * Real-time updates arrive via a Socket.IO room scoped to the contributor.
 * When an `activity_update` event fires (e.g. task status change, new message),
 * both the task list and the active task detail are refreshed automatically.
 */

const Tasks = () => {
    useUnauthenticatedUserCheck();
    const { currentUser } = useUserStore();
    const { searchParams, updateSearchParams } = useCustomSearchParams();
    const taskId = searchParams.get("taskId");
    const [activeTask, setActiveTask] = useState<TaskDto | null>(null);
    const [taskFilters, setTaskFilters] = useState(defaultTaskFilters);
    const [searchValue, setSearchValue] = useState("");
    const [displaySearchIcon, setDisplaySearchIcon] = useState(true);
    const filterActive = useMemo(() => {
        return Object.values(taskFilters).some(Boolean);
    }, [taskFilters]);

    /**
     * Infinite-scrolling task list. Fetches paginated tasks from the API
     * and automatically reloads when any filter value changes.
     *
     * On first page load, auto-selects the first task in the list if no
     * taskId is already in the URL. If a filter makes the current task
     * disappear from results, the first result becomes the new selection.
     */
    const {
        data: tasks,
        loading: loadingTasks,
        loadingMore: loadingMoreTasks,
        noMore: noMoreTasks,
        loadMore: loadMoreTasks,
        reload: reloadTasks
    } = useInfiniteScroll<Data>(
        async (currentData) => {
            const pageToLoad = currentData ? currentData.pageToLoad + 1 : 1;
            let filters: FilterTasks = {
                issueTitle: taskFilters.issueTitle,
                status: taskFilters.status
            };

            // Only send the full filter set when repoUrl is present, since
            // partial filters (issueTitle, status) are more common.
            if (taskFilters.repoUrl) {
                filters = taskFilters;
            }

            const response = await TaskAPI.getContributorTasks(
                {
                    // detailed: true,
                    page: pageToLoad,
                    limit: 30,
                    ...filters
                }
            );

            // Auto-select the first task on initial load or when filters
            // have pushed the currently-selected task out of the results.
            if (pageToLoad === 1 && response.data.length > 0) {
                const isCurrentTaskInList = response.data.some(t => t.id === taskId);
                if (!taskId && !activeTask) {
                    updateSearchParams({ taskId: response.data[0].id });
                } else if (filterActive && !isCurrentTaskInList) {
                    updateSearchParams({ taskId: response.data[0].id });
                }
            }

            return {
                list: response.data,
                hasMore: response.pagination.hasMore,
                pageToLoad
            };
        },
        {
            isNoMore: (response) => !response?.hasMore,
            reloadDeps: [...Object.values(taskFilters)]
        }
    );

    // Fetch active task data when taskId changes
    const { loading: loadingTask } = useRequest(
        async () => {
            if (!taskId) {
                if (tasks?.list && tasks.list.length > 0) {
                    updateSearchParams({ taskId: tasks.list[0].id });
                }
                return null;
            }

            const response = await TaskAPI.getContributorTaskById(taskId);
            return response.data;
        },
        {
            refreshDeps: [taskId],
            onSuccess: (data) => setActiveTask(data || null),
            onError: () => setActiveTask(null)
        }
    );

    // Ref mirrors `activeTask` state so the socket handler below
    // always reads the latest value without re-subscribing on every change.
    const activeTaskRef = useRef(activeTask);
    useEffect(() => {
        activeTaskRef.current = activeTask;
    }, [activeTask]);

    /**
     * Real-time task updates via Socket.IO.
     * Joins a room scoped to `contributor_<userId>` so the server only
     * pushes events relevant to this contributor. On receiving an update,
     * both the task list and active task detail are re-fetched to stay in sync.
     */
    useEffect(() => {
        if (!currentUser) return;

        const room = `contributor_${currentUser.userId}`;
        socket.emit("join", room);

        const handleActivity = async (activity: { type: string; userId?: string }) => {
            if (
                activity.type === "contributor" &&
                activity.userId === currentUser.userId
            ) {
                reloadTasks();

                if (!activeTaskRef.current) return;
                const response = await TaskAPI.getContributorTaskById(activeTaskRef.current.id);
                setActiveTask(response.data);
            }
        };

        socket.on("activity_update", handleActivity);

        return () => {
            socket.off("activity_update", handleActivity);
            socket.emit("leave", room);
        };
    }, [currentUser, reloadTasks]);

    return (
        <div className="h-[calc(100dvh-123px)] flex">
            <ActiveTaskContext.Provider value={{ activeTask, setActiveTask }}>
                {(tasks?.list && tasks.list.length < 1 && !loadingTasks && !filterActive) ? (
                    <div className="grow grid place-content-center">
                        <div className="min-w-[336px] w-[10%] mx-auto">
                            <FiFilePlus className="text-[44px] text-primary-400 mx-auto" />
                            <h2 className="text-headline-medium text-light-100 my-2.5 text-center">
                                No Active Task
                            </h2>
                            <p className="text-body-medium text-dark-100 mb-[30px] text-center">
                                Tasks will show up here when a bounty is assigned to you.
                                {/* Visit explorer page and apply to open bounties you can handle. */}
                            </p>
                            {/* <ButtonPrimary
                                format="OUTLINE"
                                text="Go To Bounty Explorer"
                                attributes={{
                                    onClick: () => router.push(ROUTES.EXPLORER),
                                }}
                                extendedClassName="w-fit mx-auto"
                            /> */}
                        </div>
                    </div>
                ) : (
                    <>
                        <section className="min-w-[366px] w-[12%] h-full flex flex-col">
                            <div className="pt-[30px] pr-5 flex items-center justify-between">
                                <h3 className="text-headline-small text-light-100 ">Active Tasks</h3>
                                <button
                                    onClick={reloadTasks}
                                    disabled={loadingTasks || loadingMoreTasks}
                                    className={(loadingTasks || loadingMoreTasks) ? "rotate-loading" : ""}
                                >
                                    <HiOutlineRefresh className="text-2xl text-light-200 hover:text-light-100" />
                                </button>
                            </div>
                            <div className="space-y-2.5 pr-5 my-[30px]">
                                <SearchBox
                                    attributes={{
                                        style: { fontSize: "12px", height: "40px" },
                                        placeholder: "Search tasks by issue title",
                                        name: "search",
                                        value: searchValue,
                                        onChange: (e) => {
                                            setSearchValue(e.target.value);
                                            if (!displaySearchIcon) setDisplaySearchIcon(true);
                                        },
                                        disabled: loadingTasks
                                    }}
                                    extendedContainerClassName="w-full"
                                    extendedInputClassName="text-body-tiny text-light-100"
                                    enableSearchOption={Boolean(searchValue.trim().length > 2)}
                                    displaySearchIcon={!Boolean(taskFilters.issueTitle) || displaySearchIcon}
                                    onSearchIconClick={() => {
                                        setTaskFilters((prev) => ({
                                            ...prev,
                                            issueTitle: searchValue.trim()
                                        }));
                                        setDisplaySearchIcon(false);
                                    }}
                                    onClearIconClick={() => {
                                        setTaskFilters((prev) => ({
                                            ...prev,
                                            issueTitle: undefined
                                        }));
                                        setSearchValue("");
                                    }}
                                />
                                <div className="flex items-center gap-2.5">
                                    <FilterDropdown
                                        title="Status"
                                        options={Object.entries({ ...TASK_STATUS, APPLIED: "APPLIED", NOT_ACCEPTED: "NOT_ACCEPTED" }).map(
                                            ([key, value]) => ({ name: enumToStringConverter(key), value })
                                        )}
                                        fieldName="name"
                                        fieldValue="value"
                                        extendedContainerClassName="w-full"
                                        extendedButtonClassName="w-full py-[5px]"
                                        buttonAttributes={{
                                            style: { fontSize: "12px", lineHeight: "16px", fontWeight: "700" },
                                            disabled: loadingTasks
                                        }}
                                        setField={(value) => setTaskFilters((prev) => ({
                                            ...prev,
                                            status: value as TaskStatus
                                        }))}
                                        defaultValue={taskFilters.status}
                                        noMultiSelect
                                    />
                                    <Tooltip message="Currently unavailable">
                                        <FilterDropdown
                                            title="Project"
                                            options={[]}
                                            fieldName="name"
                                            fieldValue="url"
                                            extendedContainerClassName="w-full"
                                            extendedButtonClassName="w-full py-[5px]"
                                            buttonAttributes={{
                                                style: { fontSize: "12px", lineHeight: "16px", fontWeight: "700" },
                                                disabled: true
                                            }}
                                            setField={() => { }}
                                            noMultiSelect
                                        />
                                    </Tooltip>
                                    <Tooltip message="Currently unavailable">
                                        <FilterDropdown
                                            title="Labels"
                                            options={[]}
                                            fieldName="name"
                                            fieldValue="name"
                                            extendedContainerClassName="w-full"
                                            extendedButtonClassName="w-full py-[5px] border-dark-100 text-dark-100"
                                            buttonAttributes={{
                                                style: { fontSize: "12px", lineHeight: "16px", fontWeight: "700" },
                                                disabled: true
                                            }}
                                            setField={() => { }}
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                            <div className="grow pr-5 pb-5 overflow-y-auto space-y-[15px]">
                                {tasks?.list?.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        active={(activeTask?.id || taskId) === task.id}
                                        onClick={() => updateSearchParams({ taskId: task.id })}
                                    />
                                ))}
                                {(loadingTasks && tasks?.list && tasks.list.length < 1) && (
                                    <div className="flex justify-center py-4">
                                        <span className="text-body-medium text-light-100">Loading tasks...</span>
                                    </div>
                                )}
                                {(tasks?.list && tasks.list.length < 1 && !loadingTasks) && (
                                    <div className="flex justify-center py-4">
                                        <span className="text-body-medium text-light-100">No tasks found</span>
                                    </div>
                                )}
                                {loadingMoreTasks && (
                                    <div className="flex justify-center pt-2.5">
                                        <span className="text-body-medium text-light-100">Loading more tasks...</span>
                                    </div>
                                )}
                                {(!loadingTasks && !loadingMoreTasks && !noMoreTasks) && (
                                    <button
                                        className="text-body-medium text-light-200 font-bold hover:text-light-100 pt-2.5"
                                        onClick={loadMoreTasks}
                                    >
                                        Load More
                                    </button>
                                )}
                            </div>
                        </section>

                        {((loadingTask || loadingTasks) && !activeTask) && (
                            <section className="grow border-x border-dark-200 grid place-content-center">
                                <div className="flex flex-col items-center gap-[50px]">
                                    <p className="text-body-medium text-light-100 font-mono">
                                        Loading task...
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
                        )}

                        {(!loadingTask && !loadingTasks && !activeTask) && (
                            <section className="grow border-x border-dark-200 grid place-content-center">
                                <div className="flex flex-col items-center gap-[50px]">
                                    <p className="text-body-medium text-light-100 font-mono">
                                        No task to show
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
                        )}

                        {activeTask && (
                            <>
                                <TaskOverviewSection />
                                {/* Conversation panel is only shown for tasks actively assigned to this
                                    contributor (not OPEN tasks or tasks assigned to someone else) */}
                                {(activeTask.status !== "OPEN" && activeTask.contributorId === currentUser?.userId) &&
                                    <ConversationSection />
                                }
                            </>
                        )}
                    </>
                )}
            </ActiveTaskContext.Provider>
        </div>
    );
};

export default Tasks;

const defaultTaskFilters: FilterTasks = {
    status: undefined,
    repoUrl: undefined,
    issueTitle: undefined,
    issueLabels: undefined
};
