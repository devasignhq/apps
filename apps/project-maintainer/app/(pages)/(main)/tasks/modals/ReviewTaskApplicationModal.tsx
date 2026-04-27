"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import { FEATURE_GATES } from "@/app/utils/data";
import PopupModalLayout from "@devasign/shared/components/PopupModalLayout";
import { TaskActivity } from "@/app/models/task.model";
import Link from "next/link";
import { useContext } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { MdVerified, MdCancel } from "react-icons/md";
import { useFeatureGate } from "@statsig/react-bindings";
import { ActiveTaskContext } from "../contexts/ActiveTaskContext";
import { moneyFormat, formatDateTime } from "@/app/utils/helper";
import { useAsyncEffect, useLockFn, useToggle } from "ahooks";
import ApproveTaskDelegationModal from "./ApproveTaskDelegationModal";
import { TaskAPI } from "@/app/services/task.service";
import Tooltip from "@devasign/shared/components/Tooltip";

/**
 * Contributor application review modal — displays a rich profile card
 * (GitHub link, KYC status, completed bounties, tech stack) along with
 * the GitHub issue reference.
 *
 * The KYC column is conditionally shown based on the `REQUIRE_KYC`
 * Statsig feature gate. When enabled, verified contributors are badged
 * green; unverified ones show a red cancel icon.
 *
 * The maintainer can "Ignore" (close) or "Delegate Task", which opens
 * the nested ApproveTaskDelegationModal for final confirmation.
 *
 * Like ReviewSubmissionModal, the activity is auto-marked as viewed on mount.
 */

type ReviewTaskApplicationModalProps = {
    taskActivity: TaskActivity;
    toggleModal: () => void;
};

const ReviewTaskApplicationModal = ({ taskActivity, toggleModal }: ReviewTaskApplicationModalProps) => {
    const { activeTask } = useContext(ActiveTaskContext);
    const [openApproveTaskDelegationModal, { toggle: toggleApproveTaskDelegationModal }] = useToggle(false);
    const { value: isKycCheckEnabled } = useFeatureGate(FEATURE_GATES.REQUIRE_KYC);

    useAsyncEffect(useLockFn(async () => {
        if (!taskActivity.viewed) {
            await TaskAPI.markActivityAsViewed(taskActivity.id); 
        }
    }), [taskActivity]);

    return (
        <PopupModalLayout
            title="Review Bounty Application"
            // extendedModalClassName="w-[900px]"
            toggleModal={toggleModal}
        >
            <div className="w-full grid grid-cols-3 gap-2.5 text-light-100 mt-5 whitespace-nowrap">
                <div className="h-[60px] px-[15px] py-2.5 flex flex-col justify-between border border-dark-200 space-y-[0.5px]">
                    <p className="text-body-micro">Developer</p>
                    <p className="text-body-medium flex items-center gap-1 text-light-200">
                        <span className="truncate">@{taskActivity.user?.username}</span>
                        <Link href={`https://github.com/${taskActivity.user?.username}`} target="_blank">
                            <FiArrowUpRight className="text-2xl text-primary-100 hover:text-light-100" />
                        </Link>
                    </p>
                </div>
                {isKycCheckEnabled && (
                    <div className="h-[60px] px-[15px] py-2.5 flex flex-col justify-between border border-dark-200 space-y-[0.5px]">
                        <p className="text-body-micro">KYC Status</p>
                        <p className="text-body-medium flex items-center justify-between text-light-200">
                            <span>{taskActivity.user?.verified ? "Verified" : "Not Verified"}</span>
                            {taskActivity.user?.verified ? (
                                <MdVerified className="text-xl text-indicator-100 hover:text-light-100" />
                            ) : (
                                <MdCancel className="text-xl text-indicator-500 hover:text-light-100" />
                            )}
                        </p>
                    </div>
                )}
                <div className="h-[60px] px-[15px] py-2.5 flex flex-col justify-between border border-dark-200 space-y-[0.5px]">
                    <p className="text-body-micro">Completed Bounties</p>
                    <p className="text-body-medium text-light-200">
                        {taskActivity.user?.contributionSummary?.tasksCompleted}
                    </p>
                </div>
                <div className="h-[60px] px-[15px] py-2.5 flex flex-col justify-between border border-dark-200 space-y-[0.5px]">
                    <p className="text-body-micro">Tech</p>
                    <Tooltip
                        message={
                            taskActivity.user?.techStack?.map((tech, index, array) =>
                                index === array.length - 1 ? tech : `${tech}, `
                            ).join(", ") || ""
                        }
                    >
                        <p className="text-body-medium text-light-200 truncate">
                            {taskActivity.user?.techStack?.map((tech, index, array) =>
                                index === array.length - 1 ? tech : `${tech}, `
                            )}
                        </p>
                    </Tooltip>
                </div>
            </div>
            <div className="w-full p-[15px] border border-dark-200 flex items-start gap-2.5 my-5">
                <p className="text-body-tiny tracking-[-3%] text-primary-100" style={{ lineHeight: "20px" }}>
                    #{activeTask?.issue.number}
                </p>
                <p className="grow text-body-medium font-bold text-light-100 truncate">
                    {activeTask?.issue.title}
                </p>
                <p
                    className="text-body-tiny font-bold tracking-[-3%] text-primary-100 whitespace-nowrap"
                    style={{ lineHeight: "20px" }}
                >
                    {moneyFormat(activeTask?.bounty || "")} USDC
                </p>
            </div>
            <div className="space-y-[5px] text-body-tiny">
                <div className="w-full flex items-center justify-between gap-10">
                    <p className="text-primary-400">GitHub Issue:</p>
                    <div className="flex items-center gap-1">
                        <span className="text-light-100 underline truncate">
                            {activeTask?.issue.url}
                        </span>
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
            {activeTask?.status === "OPEN" && (
                <div className="flex gap-2.5 mt-5">
                    <ButtonPrimary
                        format="OUTLINE"
                        text="Ignore"
                        attributes={{
                            onClick: toggleModal
                        }}
                    />
                    <ButtonPrimary
                        format="SOLID"
                        text="Delegate Task"
                        sideItem={<FiArrowUpRight />}
                        attributes={{
                            onClick: toggleApproveTaskDelegationModal
                        }}
                        extendedSideItemClassName="text-xl"
                    />
                </div>
            )}

            {openApproveTaskDelegationModal && (
                <ApproveTaskDelegationModal
                    taskActivity={taskActivity}
                    toggleModal={toggleApproveTaskDelegationModal}
                    onSuccess={toggleModal}
                />
            )}
        </PopupModalLayout>
    );
};

export default ReviewTaskApplicationModal;
