"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import RequestResponseModal from "@devasign/shared/components/RequestResponseModal";
import { TaskDto } from "@/app/models/task.model";
import { TaskAPI } from "@/app/services/task.service";
import useUserStore from "@/app/state-management/useUserStore";
import { isMainnet, ROUTES } from "@/app/utils/data";
import { formatDate, formatTimeline, handleApiErrorResponse, moneyFormat } from "@/app/utils/helper";
import { useCustomSearchParams } from "@devasign/shared/hooks";
import { getCurrentUser } from "@/lib/firebase";
import { useAsyncEffect, useLockFn, useToggle } from "ahooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { GoDotFill } from "react-icons/go";
import { RiCodeBoxLine } from "react-icons/ri";
import { TbProgress } from "react-icons/tb";
import { toast } from "react-toastify";

const Application = () => {
    const router = useRouter();
    const { currentUser } = useUserStore();
    const { searchParams } = useCustomSearchParams();
    const taskId = searchParams.get("taskId");
    const [activeTask, setActiveTask] = useState<TaskDto | null>(null);
    const [loadingTask, setLoadingTask] = useState(true);
    const [submittingApplication, setSubmittingApplication] = useState(false);
    const [openRequestResponseModal, { toggle: toggleRequestResponseModal }] = useToggle(false);

    useAsyncEffect(useLockFn(async () => {
        if (!taskId) {
            setActiveTask(null);
            setLoadingTask(false);
            return;
        }

        try {
            const response = await TaskAPI.getTaskById(taskId);
            setActiveTask(response.data);
        } catch {
            setActiveTask(null);
        } finally {
            setLoadingTask(false);
        }
    }), [taskId]);

    const handleTaskApplication = async () => {
        const user = await getCurrentUser();
        if (!user) {
            toast.error("You need to be logged in to apply for a task");
            return router.push(`${ROUTES.AUTHENTICATE}?taskId=${taskId}`);
        }

        if (!activeTask?.id) {
            toast.error("Task Id not found");
            return;
        }

        setSubmittingApplication(true);

        try {
            await TaskAPI.submitTaskApplication(activeTask.id);

            toggleRequestResponseModal();
        } catch (error) {
            handleApiErrorResponse(
                error,
                "Failed to submit task application. Please Try again."
            );
        } finally {
            setSubmittingApplication(false);
        }
    };

    return (
        <>
            <div className="w-[850px] mt-[65px] mx-auto">
                <h1 className="text-headline-large text-light-100">Bounty Details</h1>

                {!searchParams.get("taskId") ? (
                    <h5 className="mt-5 text-headline-small text-light-100 line-clamp-4">No task Id found in URL</h5>
                ) : (!activeTask && !loadingTask) && (
                    <div className="mt-10 w-full py-10 border border-primary-200 bg-dark-400 space-y-5">
                        <h2 className="text-headline-medium text-light-100 my-2.5 text-center">Bounty not found</h2>
                    </div>
                )}

                {(loadingTask && !activeTask && searchParams.get("taskId")) && (
                    <div className="mt-10 w-full py-10 border border-primary-200 bg-dark-400 space-y-5">
                        <TbProgress className="text-[44px] text-primary-400 mx-auto rotate-loading-slower" />
                        <h2 className="text-headline-medium text-light-100 my-2.5 text-center">Loading Bounty</h2>
                    </div>
                )}

                {activeTask && !loadingTask && (
                    <>
                        <div className="flex items-center gap-[15px] mt-[15px] mb-[30px] text-body-medium">
                            <p>
                                <span className="text-dark-100">Project: </span>
                                <span className="text-light-200 font-bold">{activeTask.issue.url.split("/")[3]}</span>
                            </p>
                            <GoDotFill className="text-primary-400" />
                            <p>
                                <span className="text-dark-100">Created By: </span>
                                <span className="text-light-200 font-bold">{activeTask.creator?.username}</span>
                            </p>
                            <GoDotFill className="text-primary-400" />
                            <p>
                                <span className="text-dark-100">Date: </span>
                                <span className="text-light-200 font-bold">{formatDate(activeTask.createdAt)}</span>
                            </p>
                        </div>
                        <div className="w-full h-[1px] bg-dark-200 my-[30px]" />
                        <div className="space-y-5 mb-[30px]">
                            <div className="space-y-2.5">
                                {activeTask.issue.labels?.length > 0 && (
                                    <div className="w-full flex items-center gap-2.5">
                                        {activeTask.issue.labels.map(label => (
                                            <p
                                                key={label.id}
                                                className="py-0.5 px-[7px] bg-primary-200 text-body-tiny font-bold text-light-200 max-w-[35%] truncate"
                                            >
                                                {label.name}
                                            </p>
                                        ))}
                                    </div>
                                )}
                                <h5 className="text-headline-small text-light-100 line-clamp-4">{activeTask.issue.title}</h5>
                            </div>

                            {!activeTask.contributorId ? (
                                <>
                                    <p className="text-body-medium text-light-200 line-clamp-6">
                                        <span className="text-dark-100">Timeline: </span>
                                        {formatTimeline(activeTask.timeline).displayValue}
                                    </p>
                                    <p className="text-indicator-200">
                                        <span className="text-display-large">{moneyFormat(activeTask.bounty).split(".")[0]}</span>
                                        <span className="text-headline-large">.{activeTask.bounty.toString().split(".")[1] || "00"} USDC</span>
                                    </p>
                                    {activeTask.escrowTransactions.find(tx => tx.method === "creation") && (
                                        <div className="text-table-content flex items-center gap-[5px]">
                                            <p className="font-bold text-light-100">Bounty Escrow:{" "}</p>
                                            <Link 
                                                href={`${isMainnet
                                                    ? "https://stellar.expert/explorer/public/tx/"
                                                    : "https://stellar.expert/explorer/testnet/tx/"}` +
                                                    `${activeTask.escrowTransactions.find(tx => tx.method === "creation")?.txHash}`
                                                }
                                                target="_blank"
                                                className="text-primary-400 flex items-center hover:text-primary-100"
                                            >
                                                <p className="max-w-[400px] underline truncate group-">
                                                    {activeTask.escrowTransactions.find(tx => tx.method === "creation")?.txHash}
                                                </p>
                                                <FiArrowUpRight className="text-2xl relative right-1" />
                                            </Link>
                                        </div>
                                    )}
                                    {!currentUser && (
                                        <p className="text-body-medium text-light-200">
                                            You’d be prompted to login with your GitHub account to accept this task. <br />
                                            You can chat with the project maintainer and receive payouts seamlessly from the platform.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-body-medium text-light-200">
                                    {currentUser?.userId === activeTask.contributorId ? <>
                                        You have already been assigned to this task.
                                    </> : <>
                                        This task bounty has already been delegated to another developer. <br />
                                        {/* Get notified when similar bounties are available. */}
                                    </>}
                                </p>
                            )}
                        </div>
                        {!activeTask.contributorId && (
                            <ButtonPrimary
                                format="SOLID"
                                text={submittingApplication ? "Applying..." : "Apply"}
                                sideItem={<FiArrowUpRight />}
                                attributes={{
                                    onClick: handleTaskApplication,
                                    disabled: submittingApplication
                                }}
                            />
                        )}
                    </>
                )}
            </div>

            {openRequestResponseModal && (
                <RequestResponseModal
                    Icon={RiCodeBoxLine}
                    title="Task Proposal Sent"
                    description={`The project maintainer will get your proposal shortly. If accepted, this 
                    task will be assigned to you alone and bounty paid out upon completion.`}
                    buttonTitle="Go To Tasks Page"
                    // buttonTitle="Go To Bounty Explorer"
                    onButtonClick={() => router.push(ROUTES.TASKS)}
                />
            )}
        </>
    );
};

export default Application;
