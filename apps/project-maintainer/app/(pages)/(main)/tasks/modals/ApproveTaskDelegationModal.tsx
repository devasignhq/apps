"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import PopupModalLayout from "@devasign/shared/components/PopupModalLayout";
import { TaskActivity } from "@/app/models/task.model";
import Link from "next/link";
import { useContext } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { ActiveTaskContext } from "../contexts/ActiveTaskContext";
import {
    formatDateTime,
    handleApiErrorResponse,
    handleApiSuccessResponse
} from "@/app/utils/helper";
import { TaskAPI } from "@/app/services/task.service";
import { useRequest, useLockFn } from "ahooks";
import { toast } from "react-toastify";
import useInstallationStore from "@/app/state-management/useInstallationStore";
import Tooltip from "@devasign/shared/components/Tooltip";

/**
 * Confirmation modal for delegating a task to an applicant.
 *
 * Delegation is a one-way action: once assigned, the contributor owns the
 * task until the timeline expires. The maintainer cannot reassign during
 * that window.
 *
 * The "Yes, Proceed" button is gated behind the installation's ACTIVE status.
 * If the GitHub App has been uninstalled or suspended, a tooltip prompts the
 * maintainer to reinstall before they can delegate. This prevents orphaned
 * tasks where the app can no longer post issue comments or listen for PRs.
 */

type ApproveTaskDelegationModalProps = {
    taskActivity: TaskActivity;
    toggleModal: () => void;
    onSuccess: () => void;
};

const ApproveTaskDelegationModal = ({ taskActivity, toggleModal, onSuccess }: ApproveTaskDelegationModalProps) => {
    const { activeInstallation } = useInstallationStore();
    const { activeTask, setActiveTask } = useContext(ActiveTaskContext);

    const { loading: delegating, run: delegateTask } = useRequest(
        useLockFn(() => TaskAPI.acceptTaskApplication(activeTask!.id, taskActivity.user!.userId)),
        {
            manual: true,
            onSuccess: (response) => {
                if (!response) {
                    toast.error("Failed to delegate task. Please try again.");
                    return;
                }

                setActiveTask({ ...activeTask!, ...response.data });
                handleApiSuccessResponse(response);
                toggleModal();
                onSuccess();
            },
            onError: (error) => {
                handleApiErrorResponse(
                    error,
                    "Failed to delegate task. Please try again."
                );
            }
        }
    );

    return (
        <PopupModalLayout title="Approve Bounty Application" toggleModal={toggleModal}>
            <div className="space-y-[5px] text-body-tiny mt-5">
                <div className="w-full flex items-center justify-between gap-10">
                    <p className="text-primary-400">Developer:</p>
                    <div className="flex items-center gap-1">
                        <span className="text-light-100 underline truncate">
                            @{taskActivity.user?.username}
                        </span>
                        <Link href={`https://github.com/${taskActivity.user?.username}`} target="_blank">
                            <FiArrowUpRight className="text-2xl text-primary-100 hover:text-light-100" />
                        </Link>
                    </div>
                </div>
                <div className="w-full flex items-center justify-between gap-10">
                    <p className="text-primary-400">GitHub Issue:</p>
                    <div className="flex items-center gap-1">
                        <span className="text-light-100 underline truncate">{activeTask?.issue.url}</span>
                        <Link href={activeTask?.issue.url || ""} target="_blank">
                            <FiArrowUpRight className="text-2xl text-primary-100 hover:text-light-100" />
                        </Link>
                    </div>
                </div>
                <div className="w-full flex items-center justify-between gap-10">
                    <p className="text-primary-400">Time:</p>
                    <p className="text-light-100">{formatDateTime(taskActivity.createdAt)}</p>
                </div>
            </div>
            <p className="my-5 text-body-medium text-dark-100">
                Once you click “<span className="font-bold">Yes, Delegate Task,</span>” the task/issue will be
                delegated to this developer and you can’t assign it to another developer till the timeline elapses.
            </p>
            {activeTask?.status === "OPEN" && (
                <div className="flex gap-2.5">
                    <ButtonPrimary
                        format="OUTLINE"
                        text="Go Back"
                        attributes={{
                            onClick: toggleModal,
                            disabled: delegating
                        }}
                    />
                    <Tooltip
                        message="Reinstall or unsuspend DevAsign app on GitHub to delegate a task"
                        disabled={activeInstallation?.status === "ACTIVE"}
                    >
                        <ButtonPrimary
                            format="SOLID"
                            text={delegating ? "Approving..." : "Yes, Proceed"}
                            sideItem={<FiArrowUpRight />}
                            attributes={{
                                onClick: delegateTask,
                                disabled: delegating || activeInstallation?.status !== "ACTIVE"
                            }}
                        />
                    </Tooltip>
                </div>
            )}
        </PopupModalLayout>
    );
};

export default ApproveTaskDelegationModal;
