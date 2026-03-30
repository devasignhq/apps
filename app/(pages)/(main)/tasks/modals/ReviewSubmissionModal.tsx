"use client";
import ButtonPrimary from "@/app/components/ButtonPrimary";
import PopupModalLayout from "@/app/components/PopupModalLayout";
import { TaskActivity } from "@/app/models/task.model";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import ApproveSubmissionModal from "./ApproveSubmissionModal";
import { useAsyncEffect, useLockFn, useToggle } from "ahooks";
import { useContext } from "react";
import { ActiveTaskContext } from "../contexts/ActiveTaskContext";
import { moneyFormat, formatDateTime } from "@/app/utils/helper";
import { TaskAPI } from "@/app/services/task.service";

type ReviewSubmissionModalProps = {
    taskActivity: TaskActivity;
    toggleModal: () => void;
};

const ReviewSubmissionModal = ({ taskActivity, toggleModal }: ReviewSubmissionModalProps) => {
    const { activeTask } = useContext(ActiveTaskContext);
    const [openApproveSubmissionModal, { toggle: toggleApproveSubmissionModal }] = useToggle(false);

    useAsyncEffect(useLockFn(async () => {
        if (!taskActivity.viewed) {
            await TaskAPI.markActivityAsViewed(taskActivity.id);
        }
    }), [taskActivity]);

    return (
        <PopupModalLayout title="Review Contributor Submission" toggleModal={toggleModal}>
            <p className="mt-2.5 text-body-medium text-dark-100">
                Kindly review this pull request if it solves the problem as described in your GitHub issue.
                Once you merge the code successfully in GitHub, the bounty will be paid out to the contributor automatically.
            </p>
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
                    <p className="text-primary-400">Pull Request:</p>
                    <div className="flex items-center gap-1">
                        <span className="text-light-100 underline truncate">
                            {taskActivity.taskSubmission?.pullRequest}
                        </span>
                        <Link href={taskActivity.taskSubmission?.pullRequest || ""} target="_blank">
                            <FiArrowUpRight className="text-2xl text-primary-100 hover:text-light-100" />
                        </Link>
                    </div>
                </div>
                {taskActivity.taskSubmission?.attachmentUrl && (
                    <div className="w-full flex items-center justify-between gap-10">
                        <p className="text-primary-400">Attachment:</p>
                        <div className="flex items-center gap-1">
                            <span className="text-light-100 underline truncate">
                                {taskActivity.taskSubmission?.attachmentUrl}
                            </span>
                            <Link href={taskActivity.taskSubmission?.attachmentUrl || ""} target="_blank">
                                <FiArrowUpRight className="text-2xl text-primary-100 hover:text-light-100" />
                            </Link>
                        </div>
                    </div>
                )}
                <div className="w-full flex items-center justify-between gap-10">
                    <p className="text-primary-400">Contributor:</p>
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
                    <p className="text-primary-400">Time:</p>
                    <p className="text-light-100">{formatDateTime(taskActivity.createdAt)}</p>
                </div>
            </div>
            {activeTask?.status === "MARKED_AS_COMPLETED" && (
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
                        text="Approve Submission"
                        sideItem={<FiArrowUpRight />}
                        attributes={{
                            onClick: toggleApproveSubmissionModal
                        }}
                    />
                </div>
            )}

            {openApproveSubmissionModal && (
                <ApproveSubmissionModal
                    taskActivity={taskActivity}
                    toggleModal={toggleApproveSubmissionModal}
                    onSuccess={toggleModal}
                />
            )}
        </PopupModalLayout>
    );
};

export default ReviewSubmissionModal;
