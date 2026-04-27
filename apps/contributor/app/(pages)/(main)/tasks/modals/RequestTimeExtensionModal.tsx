"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import PopupModalLayout from "@devasign/shared/components/PopupModalLayout";
import { FiArrowRight } from "react-icons/fi";
import { object, string, number } from "yup";
import { ActiveTaskContext } from "../contexts/ActiveTaskContext";
import { handleApiErrorResponse, handleApiSuccessResponse } from "@/app/utils/helper";
import { useFormik } from "formik";
import { useContext, useState } from "react";
import RegularDropdown from "@devasign/shared/components/Dropdown/Regular";
import { TaskAPI } from "@/app/services/task.service";
import useUserStore from "@/app/state-management/useUserStore";

/**
 * Modal for requesting a deadline extension on an assigned task.
 *
 * The contributor selects a time increment (in days or weeks) and optionally
 * provides a reason. The value is normalised to days before submission
 * (weeks × 7). The project maintainer receives the request and can accept
 * or reject it, which triggers a TIMELINE_MODIFICATION message in the
 * conversation thread.
 */
const extensionSchema = object({
    timeline: number().required("Timeline is required"),
    timelineType: string().oneOf(["WEEK", "DAY"]).required("Required"),
    reason: string().optional()
});

type RequestTimeExtensionModalProps = {
    toggleModal: () => void;
};

const RequestTimeExtensionModal = ({ toggleModal }: RequestTimeExtensionModalProps) => {
    const { activeTask } = useContext(ActiveTaskContext);
    const { currentUser } = useUserStore();
    const [loading, setLoading] = useState(false);

    const formik = useFormik({
        initialValues: {
            timeline: undefined,
            timelineType: "DAY",
            reason: ""
        },
        validationSchema: extensionSchema,
        onSubmit: async (values) => {
            setLoading(true);

            try {
                // Normalise weeks to days for the API
                const requestedTimeline = values.timelineType === "WEEK"
                    ? values.timeline! * 7
                    : values.timeline!;

                const response = await TaskAPI.requestTimelineModification(
                    activeTask!.id,
                    {
                        githubUsername: currentUser!.username,
                        requestedTimeline,
                        reason: values.reason
                    }
                );

                handleApiSuccessResponse(response);
                toggleModal();
            } catch (error) {
                handleApiErrorResponse(
                    error,
                    "Failed to submit task. Please try again."
                );
            } finally {
                setLoading(false);
            }
        }
    });

    return (
        <PopupModalLayout title="Request Time Extension" toggleModal={toggleModal}>
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
                    <label htmlFor="timeline" className="text-body-small text-light-100">
                        Time Increment
                    </label>
                    <div className="w-full flex gap-2.5 mt-2.5">
                        <input
                            id="timeline"
                            name="timeline"
                            type="number"
                            placeholder="0"
                            step="1"
                            className="grow py-2.5 px-[15px] bg-dark-400 border border-dark-200 text-body-medium text-light-100"
                            value={formik.values.timeline}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            disabled={loading}
                        />
                        <RegularDropdown
                            defaultName="Day(s)"
                            options={[
                                { label: "Week(s)", value: "WEEK" },
                                { label: "Day(s)", value: "DAY" }
                            ]}
                            fieldName="label"
                            fieldValue="value"
                            extendedContainerClassName="h-full"
                            extendedButtonClassName="h-full text-body-medium text-light-100"
                            onChange={(value) => formik.setFieldValue("timelineType", value)}
                            buttonAttributes={{ disabled: loading }}
                        />
                    </div>
                    {formik.touched.timeline && formik.errors.timeline && (
                        <p className="text-indicator-500 text-body-tiny mt-1">{formik.errors.timeline}</p>
                    )}
                </div>
                <div className="w-full">
                    <label htmlFor="reason" className="text-body-small text-light-100">
                        Reason Why? (Optional)
                    </label>
                    <textarea
                        id="reason"
                        name="reason"
                        placeholder="Explain the reason for the extension and what you aim to work on in the given time frame..."
                        onChange={formik.handleChange}
                        value={formik.values.reason}
                        className="w-full min-h-[150px] py-2.5 px-[15px] mt-2.5 bg-dark-400 border border-dark-200 text-body-medium text-light-100"
                        disabled={loading}
                    />
                </div>
                <ButtonPrimary
                    format="SOLID"
                    text={loading ? "Sending..." : "Send Request"}
                    sideItem={<FiArrowRight />}
                    attributes={{
                        type: "submit",
                        disabled: loading
                    }}
                    extendedClassName="w-fit mt-5"
                />
            </form>
        </PopupModalLayout>
    );
};

export default RequestTimeExtensionModal;
