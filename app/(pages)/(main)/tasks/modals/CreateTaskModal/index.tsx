/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { FiArrowRight } from "react-icons/fi";
import ButtonPrimary from "../../../../../components/ButtonPrimary";
import PopupModalLayout from "../../../../../components/PopupModalLayout";
import FilterDropdown from "../../../../../components/Dropdown/Filter";
import CreateTaskCard from "./components/CreateTaskCard";
import { HiPlus } from "react-icons/hi";
import RepoMenuCard from "./components/RepoMenuCard";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAsyncEffect, useInfiniteScroll, useRequest } from "ahooks";
import useTaskStore from "@/app/state-management/useTaskStore";
import { PiEyeBold, PiEyeSlashBold } from "react-icons/pi";
import {
    QueryRepositoryIssues,
    RepositoryDto,
    GetRepositoryResourcesResponse
} from "@/app/models/github.model";
import { Data } from "ahooks/lib/useInfiniteScroll/types";
import { CreateTaskDto, TIMELINE_TYPE } from "@/app/models/task.model";
import { toast } from "react-toastify";
import { TaskAPI } from "@/app/services/task.service";
import { moneyFormat, openInNewTab } from "@/app/utils/helper";
import useInstallationStore from "@/app/state-management/useInstallationStore";
import SearchBox from "../../components/SearchBox";
import { InstallationAPI } from "@/app/services/installation.service";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { LuRocket } from "react-icons/lu";
import { ApiResponse } from "@/app/models/_global";
import { socket, joinSocketRoom, leaveSocketRoom } from "@/lib/socket";
import { useStreamAccountBalance } from "@/app/services/horizon.service";

type TaskPayload = {
    payload: CreateTaskDto;
    valid: boolean;
}

type IssueFilters = Pick<QueryRepositoryIssues, "title" | "labels" | "milestone" | "sort" | "direction" | "perPage">;

type UploadStatus = "PENDING" | "CREATED" | "FAILED";

type CreateTaskModalProps = {
    installationRepos: RepositoryDto[];
    loadingInstallationRepos: boolean;
    toggleModal: () => void;
    onSuccess: () => void;
};

// TODO: Transfer logic to custom hook
const CreateTaskModal = ({
    installationRepos,
    loadingInstallationRepos,
    toggleModal,
    onSuccess
}: CreateTaskModalProps) => {
    const { activeInstallation } = useInstallationStore();
    const { usdcBalance, stopStream, manualBalanceCheck } = useStreamAccountBalance(
        activeInstallation?.wallet?.address,
        activeInstallation?.id
    );
    const { draftTasks, setDraftTasks } = useTaskStore();
    const taskBoxRef = useRef<HTMLDivElement>(null);
    const taskCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const [activeRepo, setActiveRepo] = useState<RepositoryDto | undefined>(installationRepos[0]);
    const [issueFilters, setIssueFilters] = useState<IssueFilters>(defaultIssueFilters);
    const [searchValue, setSearchValue] = useState("");
    const [displaySearchIcon, setDisplaySearchIcon] = useState(true);
    const [showSelectedTasks, setShowSelectedTasks] = useState(false);
    const [uploadingTasks, setUploadingTasks] = useState(false);
    const [validBountyLabel, setValidBountyLabel] = useState<Map<string, string>>(new Map());
    const [uploadedTasks, setUploadedTasks] = useState<Map<string, UploadStatus>>(new Map());
    const [selectedTasks, setSelectedTasks] = useState<Map<string, TaskPayload>>(() => {
        const initialMap = new Map();
        draftTasks.forEach(draft => {
            initialMap.set(draft.issue.id, {
                payload: draft,
                valid: true
            });
        });
        return initialMap;
    });
    const selectedIssues = useMemo(() => {
        return Array.from(selectedTasks.values()).map(task => ({
            ...task.payload.issue,
            labels: { nodes: task.payload.issue.labels }
        }));
    }, [selectedTasks]);
    const validPayload = useMemo(() => {
        if (selectedTasks.size === 0) return false;

        return Array.from(selectedTasks.values()).every(task => task.valid);
    }, [selectedTasks]);

    const totalBounty = useMemo(() => {
        const total = Array.from(selectedTasks.values()).reduce((total, task) => {
            const bountyValue = parseFloat(task.payload.bounty.replace(/,/g, "")) || 0;
            return total + bountyValue;
        }, 0);

        return {
            value: total.toFixed(2),
            valid: total <= Number(usdcBalance)
        };
    }, [selectedTasks]);

    // Set active repo upon initialization
    useEffect(() => {
        if (installationRepos.length === 0 || activeRepo) return;
        setActiveRepo(installationRepos[0]);
    }, [installationRepos.length]);

    // Preload bounty labels for all repositories
    useAsyncEffect(async () => {
        if (!activeInstallation || installationRepos.length === 0) return;

        const promises = installationRepos.map(async (repo) => {
            if (validBountyLabel.get(repo.id)) return;

            try {
                const response = await InstallationAPI.getOrCreateBountyLabel(
                    activeInstallation.id,
                    repo.id
                );
                return { repoId: repo.id, labelId: response.data.bountyLabel.id };
            } catch {
                return null;
            }
        });

        const results = await Promise.all(promises);
        const newLabels = new Map(validBountyLabel);

        results.forEach(result => {
            if (result) {
                newLabels.set(result.repoId, result.labelId);
            }
        });

        setValidBountyLabel(newLabels);
    }, [installationRepos, activeInstallation]);

    const {
        data: repoIssues,
        loading: loadingIssues,
        loadingMore: loadingMoreIssues,
        noMore: noMoreIssues,
        loadMore: loadMoreIssues,
        reload: reloadIssues
    } = useInfiniteScroll<Data>(
        async (currentData) => {
            if (!activeRepo || !activeInstallation) {
                return { list: [], hasMore: false, pageToLoad: 1 };
            }

            const pageToLoad = currentData ? currentData.pageToLoad + 1 : 1;
            const response = await InstallationAPI.getRepositoryIssues(
                activeInstallation.id,
                {
                    repoUrl: activeRepo.url,
                    page: pageToLoad,
                    ...issueFilters
                }
            );

            return {
                list: response.data,
                hasMore: response.pagination.hasMore,
                pageToLoad
            };
        },
        {
            target: taskBoxRef,
            isNoMore: (response) => !response?.hasMore,
            reloadDeps: [activeRepo, ...Object.values(issueFilters)]
        }
    );

    const {
        loading: loadingResources,
        data: repoResources
    } = useRequest<ApiResponse<GetRepositoryResourcesResponse>, [string, string]>(
        () => {
            if (!activeRepo || !activeInstallation) {
                return delayedEmptyResources();
            }
            return InstallationAPI.getRepositoryResources(
                activeInstallation.id,
                activeRepo.url
            ) as Promise<ApiResponse<GetRepositoryResourcesResponse>>;
        },
        {
            retryCount: 1,
            cacheKey: `${activeRepo?.url}-resources`,
            refreshDeps: [activeRepo]
        }
    );

    const disableFilters = loadingInstallationRepos || loadingIssues || loadingMoreIssues;

    const handleToggleCheck = (issueId: string, taskPayload: TaskPayload | null, repoId: string) => {
        setSelectedTasks(prev => {
            const newMap = new Map(prev);
            if (taskPayload) {
                // Store the repo ID with the task payload for later bounty label lookup
                const enhancedPayload = {
                    ...taskPayload,
                    payload: {
                        ...taskPayload.payload,
                        bountyLabelId: validBountyLabel.get(repoId) || "",
                        repoId // Store the repo ID for later lookup
                    }
                };
                newMap.set(issueId, enhancedPayload);
            } else {
                newMap.delete(issueId);
            }
            if (newMap.size === 0) {
                setShowSelectedTasks(false);
            }
            return newMap;
        });
    };

    const createTasks = async () => {
        if (selectedTasks.size === 0) {
            toast.error("Please select at least one issue.");
            return;
        }
        if (!showSelectedTasks) {
            setShowSelectedTasks(true);
            return;
        }

        setUploadingTasks(true);
        stopStream();
        taskBoxRef!.current!.scrollTop = 0;

        await new Promise((resolve) => {
            toast.warn(
                "Please do not leave this page or close this modal while your bounties are still processing.",
                { autoClose: 3000 }
            );
            setTimeout(() => resolve(null), 500);
        });

        const draftTasks: CreateTaskDto[] = [];
        const succeededIssueIds = new Set<string>();
        let hasErrors = false;

        for (const task of Array.from(selectedTasks.values())) {
            const urlParts = task.payload.issue.url.split("/");
            const taskIdentifier = `${urlParts[3]}/${urlParts[4]} #${task.payload.issue.number}`;
            const toastId = toast.loading(`Creating bounty for ${taskIdentifier}...`);
            setUploadedTasks(prev => new Map(prev).set(task.payload.issue.id, "PENDING"));

            const taskElement = taskCardRefs.current.get(task.payload.issue.id);
            if (taskElement && taskBoxRef.current) {
                // Scroll the element into view with smooth behavior
                taskElement.scrollIntoView({ behavior: "smooth", block: "center" });
            }

            let unsubscribe = () => { };

            try {
                const room = `installation_${task.payload.installationId}`;
                joinSocketRoom(room);

                const handleActivity = (activity: { type: string; installationId?: string; issueUrl?: string; operation?: string; message?: string }) => {
                    if (
                        activity.type === "installation" &&
                        activity.installationId === task.payload.installationId &&
                        activity.issueUrl === task.payload.issue.url &&
                        activity.operation === "task_creation" &&
                        activity.message
                    ) {
                        toast.update(toastId, { render: activity.message });
                    }
                };

                socket.on("activity_update", handleActivity);
                
                unsubscribe = () => {
                    socket.off("activity_update", handleActivity);
                    leaveSocketRoom(room);
                };

                delete task.payload.repoId;

                task.payload.timeline = task.payload.timelineType === TIMELINE_TYPE.WEEK
                    ? task.payload.timeline * 7
                    : task.payload.timeline;
                delete task.payload.timelineType;

                const response = await TaskAPI.createTask({ payload: task.payload });

                unsubscribe();
                toast.update(toastId, {
                    render: `Bounty for ${taskIdentifier} created successfully!`,
                    autoClose: 2000,
                    type: "success",
                    isLoading: false
                });
                setUploadedTasks(prev => new Map(prev).set(task.payload.issue.id, "CREATED"));
                succeededIssueIds.add(task.payload.issue.id);

                if (response.warning) {
                    toast.warn(response.warning);
                }
            } catch {
                unsubscribe();
                toast.update(toastId, {
                    render: `Bounty for ${taskIdentifier} failed to create.`,
                    autoClose: 2000,
                    type: "error",
                    isLoading: false
                });
                setUploadedTasks(prev => new Map(prev).set(task.payload.issue.id, "FAILED"));
                hasErrors = true;
                draftTasks.push(task.payload);
            }
        }

        if (!hasErrors) {
            toast.success("All bounties created successfully!");
            setUploadingTasks(false);
            setDraftTasks([]);
            toggleModal();
            onSuccess();
            return;
        }

        setSelectedTasks(prev => {
            const newMap = new Map(prev);
            succeededIssueIds.forEach(issueId => newMap.delete(issueId));
            return newMap;
        });
        setDraftTasks(draftTasks.length > 0 ? draftTasks : []);
        setUploadingTasks(false);

        if ([...succeededIssueIds].length > 0) {
            manualBalanceCheck();
            reloadIssues();
            onSuccess();
        }
    };

    const saveDraft = () => {
        const drafts = Array.from(selectedTasks.values()).map(task => task.payload);
        setDraftTasks(drafts);
        toggleModal();
    };

    const clearSelection = () => {
        setSelectedTasks(new Map());
        setUploadedTasks(new Map());
        setDraftTasks([]);
        setShowSelectedTasks(false);
    };

    return (
        <PopupModalLayout
            title="Create New Bounty"
            toggleModal={toggleModal}
            disableCloseButton={uploadingTasks}
            extendedModalClassName="w-[65dvw]"
        >
            <div className="grow flex gap-[30px] mt-[30px] overflow-hidden">
                <div className="space-y-2.5 w-[200px]">
                    <p className="text-body-medium text-light-200">Repository</p>
                    <div className="space-y-5">
                        {loadingInstallationRepos ? (
                            <div className="w-full border-b border-dark-200 flex flex-col gap-[15px] overflow-x-auto">
                                {[...Array(4)].map((_, index) => (
                                    <div key={index} className="p-2.5 space-y-[5px] animate-pulse">
                                        <div className="h-3 w-3/4 bg-dark-300 rounded" />
                                        <div className="h-2.5 w-full bg-dark-300 rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full border-b border-dark-200 flex flex-col gap-[15px] overflow-x-auto">
                                {installationRepos?.map((repo) => (
                                    <RepoMenuCard
                                        key={repo.id}
                                        repoName={repo.name || repo.url.split("/")[4]}
                                        repoUrl={repo.url}
                                        active={activeRepo?.id === repo.id}
                                        onClick={() => {
                                            setIssueFilters(defaultIssueFilters);
                                            setActiveRepo(repo);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                        <button
                            type="button"
                            className="flex items-center gap-[5px] text-primary-400 text-button-large font-extrabold hover:text-light-100"
                            onClick={() => openInNewTab(activeInstallation!.htmlUrl)}
                            disabled={loadingInstallationRepos}
                        >
                            <span>Add Repo</span>
                            <HiPlus className="text-2xl" />
                        </button>
                    </div>
                </div>
                <div className="grow flex flex-col gap-[15px] overflow-x-auto">
                    <section className="my-[30px] space-y-2.5">
                        <SearchBox
                            attributes={{
                                placeholder: "Search issues by title",
                                name: "search",
                                value: searchValue,
                                onChange: (e) => {
                                    setSearchValue(e.target.value);
                                    if (!displaySearchIcon) setDisplaySearchIcon(true);
                                },
                                disabled: disableFilters
                            }}
                            extendedContainerClassName="w-full"
                            extendedInputClassName="h-full"
                            enableSearchOption={Boolean(searchValue.trim().length > 2)}
                            displaySearchIcon={!Boolean(issueFilters.title) || displaySearchIcon}
                            onSearchIconClick={() => {
                                setIssueFilters((prev) => ({
                                    ...prev,
                                    title: searchValue.trim()
                                }));
                                setDisplaySearchIcon(false);
                            }}
                            onClearIconClick={() => {
                                setIssueFilters((prev) => ({
                                    ...prev,
                                    title: undefined
                                }));
                                setSearchValue("");
                            }}
                        />
                        <div className="flex items-center gap-2.5">
                            <FilterDropdown
                                title="Labels"
                                options={repoResources?.data.labels || []}
                                fieldName="name"
                                fieldValue="name"
                                setField={(value) => setIssueFilters((prev) => ({
                                    ...prev,
                                    labels: value as string[]
                                }))}
                                extendedButtonClassName="py-[5px]"
                                buttonAttributes={{
                                    style: { fontSize: "12px", lineHeight: "16px", fontWeight: "700" },
                                    disabled: loadingResources || disableFilters
                                }}
                            />
                            <FilterDropdown
                                title="Milestones"
                                options={repoResources?.data.milestones || []}
                                fieldName="title"
                                fieldValue="title"
                                setField={(value) => setIssueFilters((prev) => ({
                                    ...prev,
                                    milestone: value as string
                                }))}
                                extendedButtonClassName="py-[5px]"
                                buttonAttributes={{
                                    style: { fontSize: "12px", lineHeight: "16px", fontWeight: "700" },
                                    disabled: loadingResources || disableFilters
                                }}
                                noMultiSelect
                            />
                            <FilterDropdown
                                title="Sort By"
                                options={[
                                    { label: "Date Created", value: "created" },
                                    { label: "Last Updated", value: "updated" },
                                    { label: "Most Comments", value: "comments" }
                                ]}
                                fieldName="label"
                                fieldValue="value"
                                defaultValue="created"
                                setField={(value) => setIssueFilters((prev) => ({
                                    ...prev,
                                    sort: value as "created" | "updated" | "comments"
                                }))}
                                extendedButtonClassName="py-[5px]"
                                buttonAttributes={{
                                    style: { fontSize: "12px", lineHeight: "16px", fontWeight: "700" },
                                    disabled: disableFilters
                                }}
                                noMultiSelect
                            />
                            <FilterDropdown
                                title="Order"
                                options={[
                                    { label: "Ascending", value: "asc" },
                                    { label: "Descending", value: "desc" }
                                ]}
                                fieldName="label"
                                fieldValue="value"
                                defaultValue="desc"
                                setField={(value) => setIssueFilters((prev) => ({
                                    ...prev,
                                    direction: value as "asc" | "desc"
                                }))}
                                extendedButtonClassName="py-[5px]"
                                buttonAttributes={{
                                    style: { fontSize: "12px", lineHeight: "16px", fontWeight: "700" },
                                    disabled: disableFilters || !issueFilters.sort
                                }}
                                noMultiSelect
                            />
                        </div>
                    </section>
                    <section className="flex items-end justify-between">
                        <div>
                            <p className="flex items-center gap-[5px] text-title-large text-light-100">
                                <span>Issues Selected</span>
                                <button
                                    onClick={() => {
                                        if (selectedIssues.length > 0) {
                                            setShowSelectedTasks(prev => !prev);
                                            setUploadedTasks(new Map());
                                        }
                                    }}
                                    className={`px-[5px] text-body-medium font-bold text-dark-500 flex items-center gap-1 
                                ${showSelectedTasks ? "bg-light-200" : "bg-primary-100"}`
                                    }
                                    style={{ cursor: selectedIssues.length > 0 ? "pointer" : "default" }}
                                >
                                    <span>{selectedIssues.length}</span>
                                    {(selectedIssues.length > 0) ? (
                                        showSelectedTasks ? (
                                            <PiEyeSlashBold className="text-base" />
                                        ) : (
                                            <PiEyeBold className="text-base" />
                                        )
                                    ) : null}
                                </button>
                            </p>
                            <p className="text-body-medium text-dark-200 mt-[5px]">
                                Select issues you’d like to import and add bounties to.
                            </p>
                        </div>
                        <button
                            className="text-body-medium text-light-200 font-bold hover:text-light-100"
                            onClick={clearSelection}
                        >
                            Clear Selection
                        </button>
                    </section>
                    <section
                        ref={taskBoxRef}
                        className="grow my-[30px] flex flex-col gap-2.5 overflow-y-auto"
                    >
                        {(showSelectedTasks && selectedIssues.length > 0) ? (
                            selectedIssues.map((issue) => {
                                // Find the repo ID for this issue from the selected tasks
                                const selectedTask = selectedTasks.get(issue.id);
                                const repoId = selectedTask?.payload.repoId ||
                                    installationRepos.find(repo => repo.url === issue.repository.url)?.id || "";

                                return (
                                    <div
                                        key={issue.id}
                                        className="w-full"
                                        ref={(el) => {
                                            if (el) {
                                                taskCardRefs.current.set(issue.id, el);
                                            } else {
                                                taskCardRefs.current.delete(issue.id);
                                            }
                                        }}
                                    >
                                        <CreateTaskCard
                                            issue={issue}
                                            bountyLabelId={validBountyLabel.get(repoId) || ""}
                                            defaultSelected={selectedTasks.get(issue.id)}
                                            showFields
                                            onToggleCheck={(taskPayload) => handleToggleCheck(issue.id, taskPayload, repoId)}
                                            uploadStatus={uploadedTasks.get(issue.id)}
                                            disableFields={uploadingTasks || Boolean(uploadedTasks.get(issue.id) === "CREATED")}
                                        />
                                    </div>
                                );
                            })
                        ) : (
                            <>
                                {loadingIssues ? (
                                    <div className="flex justify-center py-10">
                                        <span className="text-body-medium text-light-100 flex items-center gap-2">
                                            <AiOutlineLoading3Quarters className="animate-spin" />
                                            Fetching issues
                                        </span>
                                    </div>
                                ) : (
                                    repoIssues?.list?.map((issue) => (
                                        <div key={issue.id} className="w-full">
                                            <CreateTaskCard
                                                issue={issue}
                                                bountyLabelId={validBountyLabel.get(activeRepo?.id || "") || ""}
                                                defaultSelected={selectedTasks.get(issue.id)}
                                                showFields={false}
                                                onToggleCheck={(taskPayload) => handleToggleCheck(issue.id, taskPayload, activeRepo?.id || "")}
                                                uploadStatus={uploadedTasks.get(issue.id)}
                                                disableFields={uploadingTasks || Boolean(uploadedTasks.get(issue.id) === "CREATED")}
                                            />
                                        </div>
                                    ))
                                )}
                                {(repoIssues?.list && repoIssues.list.length < 1 && !loadingIssues) && (
                                    <div className="flex justify-center py-10">
                                        <span className="text-body-medium text-light-100">No issues found</span>
                                    </div>
                                )}
                                {loadingMoreIssues && (
                                    <div className="flex justify-center pt-2.5">
                                        <span className="text-body-medium text-light-100 flex items-center gap-2">
                                            <AiOutlineLoading3Quarters className="animate-spin" />
                                            Fetching more issues
                                        </span>
                                    </div>
                                )}
                                {(!loadingIssues && !loadingMoreIssues && !noMoreIssues) && (
                                    <button
                                        className="text-body-medium text-light-200 font-bold hover:text-light-100 pt-2.5"
                                        onClick={loadMoreIssues}
                                    >
                                        Get More
                                    </button>
                                )}
                            </>
                        )}
                    </section>
                    <section className="flex items-center justify-between">
                        <div className="flex gap-2.5">
                            <ButtonPrimary
                                format="SOLID"
                                text={
                                    showSelectedTasks
                                        ? uploadingTasks
                                            ? "Publishing..."
                                            : "Publish"
                                        : "Proceed"
                                }
                                sideItem={showSelectedTasks ? <LuRocket /> : <FiArrowRight />}
                                attributes={{
                                    onClick: createTasks,
                                    disabled: selectedTasks.size === 0
                                        || uploadingTasks
                                        || (!validPayload && showSelectedTasks)
                                        || !totalBounty.valid
                                }}
                            />
                            <ButtonPrimary
                                format="OUTLINE"
                                text="Save Draft"
                                attributes={{
                                    onClick: saveDraft,
                                    disabled: uploadingTasks
                                        || !validPayload
                                        || !totalBounty.valid
                                }}
                            />
                        </div>
                        <div className="flex gap-[30px]">
                            {showSelectedTasks && (
                                <div className="flex flex-col items-end">
                                    <p className={`text-headline-small font-semibold text-base ${totalBounty.valid ? "text-indicator-200" : "text-indicator-500"} tracking-[-0.5px] leading-1`}>
                                        {moneyFormat(totalBounty.value)} USDC
                                    </p>
                                    <p className="text-body-micro text-dark-100 font-medium text-[10px] leading-[16px] tracking-[-0.5px]">
                                        Total Bounty
                                    </p>
                                </div>
                            )}
                            <div className="flex flex-col items-end">
                                <p className="text-headline-small font-semibold text-base text-indicator-100 tracking-[-0.5px] leading-1">
                                    {moneyFormat(usdcBalance)} USDC
                                </p>
                                <p className="text-body-micro text-dark-100 font-medium text-[10px] leading-[16px] tracking-[-0.5px]">
                                    Wallet Balance
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </PopupModalLayout>
    );
};

export default CreateTaskModal;

const delayedEmptyResources = (): Promise<ApiResponse<GetRepositoryResourcesResponse>> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                data: { labels: [], milestones: [] },
                message: "",
                pagination: { hasMore: false }
            });
        }, 1000);
    });
};

const defaultIssueFilters: IssueFilters = {
    title: undefined,
    labels: undefined,
    milestone: undefined,
    sort: "created",
    direction: "desc",
    perPage: 30
};
