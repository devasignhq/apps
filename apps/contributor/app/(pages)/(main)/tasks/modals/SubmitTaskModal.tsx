"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import PopupModalLayout from "@devasign/shared/components/PopupModalLayout";
import { MarkAsCompleteDto } from "@/app/models/task.model";
import { TaskAPI } from "@/app/services/task.service";
import { useRequest, useLockFn, useToggle } from "ahooks";
import { useContext } from "react";
import { FiArrowUpRight, FiCode } from "react-icons/fi";
import { useFormik } from "formik";
import { object, string } from "yup";
import { ActiveTaskContext } from "../contexts/ActiveTaskContext";
import RequestResponseModal from "@devasign/shared/components/RequestResponseModal";
import { handleApiErrorResponse } from "@/app/utils/helper";
import { toast } from "react-toastify";

const taskSchema = object({
    pullRequest: string()
        .required("Pull request is required")
        .url("Must be a valid URL")
        .matches(/github\.com/, "Must be a GitHub URL"),
    attachmentUrl: string()
        .optional()
        .url("Must be a valid URL")
});

type SubmitTaskModalProps = {
    toggleModal: () => void;
};

const SubmitTaskModal = ({ toggleModal }: SubmitTaskModalProps) => {
    const { activeTask, setActiveTask } = useContext(ActiveTaskContext);
    const [openRequestResponseModal, { toggle: toggleRequestResponseModal }] = useToggle(false);

    const { loading: submittingTask, run: submitTask } = useRequest(
        useLockFn((data: MarkAsCompleteDto) => TaskAPI.markAsComplete(activeTask!.id, data)),
        {
            manual: true,
            onSuccess: (response) => {
                if (!response) {
                    toast.error("Failed to submit task. Please try again.");
                    return;
                }
                setActiveTask({ ...activeTask!, ...response.data });
                toggleRequestResponseModal();
            },
            onError: (error: unknown) => {
                handleApiErrorResponse(
                    error,
                    "Failed to submit task. Please try again."
                );
            }
        }
    );

    const formik = useFormik({
        initialValues: {
            pullRequest: "",
            attachmentUrl: undefined
        },
        validationSchema: taskSchema,
        onSubmit: values => submitTask(values)
    });

    return (
        <PopupModalLayout title="Submit Task" toggleModal={toggleModal}>
            <form
                className="w-full space-y-5 mt-5"
                onSubmit={formik.handleSubmit}
            >
                <div className="p-[15px] bg-dark-400 border border-primary-200 space-y-2.5">
                    <h6 className="text-headline-small text-light-100 truncate">
                        {activeTask?.issue.title}
                    </h6>
                    <div className="flex items-center justify-between">
                        {activeTask && activeTask.issue.labels?.length > 0 && (
                            <p className="py-0.5 px-[7px] bg-primary-300 text-body-tiny font-bold text-light-200 max-w-[50%] truncate">
                                {activeTask.issue.labels
                                    .map(label => label.name)
                                    .map((name, index, array) =>
                                        index === array.length - 1 ? name : `${name}, `
                                    )
                                    .join("")}
                            </p>
                        )}
                        <p className="text-body-tiny text-light-200 truncate">
                            {activeTask?.issue?.url.split("/").slice(-3)[0]}
                        </p>
                    </div>
                </div>
                <div className="w-full">
                    <label htmlFor="pullRequest" className="text-body-small text-light-100">
                        <span>Pull Request URL</span>
                        <span className="text-[#FF5C5C]">{" "}*</span>
                    </label>
                    <input
                        id="pullRequest"
                        name="pullRequest"
                        type="text"
                        placeholder="Enter GitHub PR"
                        onChange={formik.handleChange}
                        value={formik.values.pullRequest}
                        className="w-full py-2.5 px-[15px] mt-2.5 bg-dark-400 border border-dark-200 text-body-medium text-light-100"
                        disabled={submittingTask}
                    />
                    {formik.errors.pullRequest && (
                        <p className="text-body-micro font-normal mt-1 text-[#FF5C5C]">{formik.errors.pullRequest}</p>
                    )}
                </div>
                <div className="w-full mt-[15px] mb-10">
                    <label htmlFor="attachmentUrl" className="text-body-small text-light-100">
                        Attachment URL (Optional)
                    </label>
                    <input
                        id="attachmentUrl"
                        name="attachmentUrl"
                        type="text"
                        placeholder="Add attachment link"
                        onChange={formik.handleChange}
                        value={formik.values.attachmentUrl}
                        className="w-full py-2.5 px-[15px] mt-2.5 bg-dark-400 border border-dark-200 text-body-medium text-light-100"
                        disabled={submittingTask}
                    />
                    <p className="text-body-micro text-light-200 mt-[5px]">
                        You can add your process documentation link, notion page or any
                        other reference that will give more credibility to the work done.
                    </p>
                </div>
                <ButtonPrimary
                    format="SOLID"
                    text={submittingTask ? "Submitting..." : "Submit"}
                    sideItem={<FiArrowUpRight />}
                    attributes={{
                        type: "submit",
                        disabled: submittingTask
                    }}
                    extendedClassName="w-fit mt-5"
                />
            </form>

            {openRequestResponseModal && (
                <RequestResponseModal
                    Icon={FiCode}
                    title="You’ve submitted this task successfully"
                    description={`The project maintainer will get your submission shortly. 
                        You’ll get paid once it’s approved or your PR is merged.`}
                    buttonTitle="Go Back To Task"
                    onButtonClick={() => {
                        toggleRequestResponseModal();
                        toggleModal();
                    }}
                />
            )}
        </PopupModalLayout>
    );
};

export default SubmitTaskModal;
