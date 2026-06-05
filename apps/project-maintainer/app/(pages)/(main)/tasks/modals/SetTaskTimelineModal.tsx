"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import RegularDropdown from "@devasign/shared/components/Dropdown/Regular";
import PopupModalLayout from "@devasign/shared/components/PopupModalLayout";
import { TIMELINE_TYPE, TimelineType } from "@/app/models/task.model";
import { useContext, useMemo, useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { ActiveTaskContext } from "../contexts/ActiveTaskContext";
import { TaskAPI } from "@/app/services/task.service";
import { handleApiErrorResponse, handleApiSuccessResponse } from "@/app/utils/helper";

/**
 * Timeline editor modal — sets or updates the completion deadline for a task.
 *
 * The timeline is stored in the API as total days. This modal presents a
 * user-friendly input (number + unit dropdown) and converts back before
 * submission:
 *   - Week(s) → value × 7 days
 *   - Day(s)  → value as-is
 *
 * Editing is locked once the task has been delegated (enforced by the
 * parent component), since changing the deadline mid-work would be unfair
 * to the contributor.
 *
 * `inValidForm` memoises a check to prevent no-op submissions when the
 * value hasn't changed from the current timeline.
 */

type SetTaskTimelineModalProps = {
    toggleModal: () => void;
};

const SetTaskTimelineModal = ({ toggleModal }: SetTaskTimelineModalProps) => {
    const { activeTask, setActiveTask } = useContext(ActiveTaskContext);
    const [loading, setLoading] = useState(false);
    const [timeline, setTimeline] = useState(
        getTimeline(activeTask!.timeline)
    );
    const [timelineType, setTimelineType] = useState(
        getTimelineType(activeTask!.timeline)
    );
    const inValidForm = useMemo(() => {
        if (timeline === getTimeline(activeTask!.timeline) &&
            timelineType === getTimelineType(activeTask!.timeline)
        ) {
            return true;
        }
        return false;
    }, [timeline, timelineType, activeTask]);

    const updateTimeline = async () => {
        setLoading(true);

        try {
            const newTimeline = timelineType === TIMELINE_TYPE.WEEK
                ? timeline * 7
                : timeline;

            const response = await TaskAPI.updateTaskTimeline(
                activeTask!.id,
                { newTimeline }
            );

            setActiveTask({ ...activeTask!, ...response.data });
            handleApiSuccessResponse(response);
            toggleModal();
        } catch (error) {
            handleApiErrorResponse(error, "Failed to update task timeline.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <PopupModalLayout title="Set Task Timeline" toggleModal={toggleModal}>
            <p className="mt-2.5 text-body-medium text-dark-100">
                Set completion timeline for this task (issue). You cannot update the
                timeline once the task has been delegated to a contributor.
            </p>
            <div className="w-full p-[15px] border border-primary-200 bg-dark-400 flex items-start gap-2.5 my-5">
                <p className="text-body-tiny tracking-[-3%] text-primary-100" style={{ lineHeight: "20px" }}>
                    #{activeTask?.issue.number}
                </p>
                <p className="text-body-medium font-bold text-light-100 line-clamp-2">
                    {activeTask?.issue.title}
                </p>
            </div>
            <div className="w-full flex gap-2.5">
                <input
                    type="number"
                    placeholder="0"
                    step="1"
                    className="grow py-2.5 px-[15px] bg-dark-400 border border-dark-200 text-body-medium text-light-100"
                    value={timeline}
                    onChange={(e) => setTimeline(Number(e.target.value))}
                    disabled={loading}
                />
                <RegularDropdown
                    defaultName={
                        (getTimelineType(activeTask!.timeline) === "DAY")
                            ? "Day(s)"
                            : "Week(s)"
                    }
                    options={[
                        { label: "Week(s)", value: "WEEK" },
                        { label: "Day(s)", value: "DAY" }
                    ]}
                    fieldName="label"
                    fieldValue="value"
                    extendedContainerClassName="h-full"
                    extendedButtonClassName="h-full text-body-medium text-light-100"
                    onChange={(value) => setTimelineType(value as TimelineType)}
                    buttonAttributes={{ disabled: loading }}
                />
            </div>
            <ButtonPrimary
                format="SOLID"
                text={loading ? "Updating..." : "Update Timeline"}
                sideItem={<FiArrowRight />}
                attributes={{
                    onClick: updateTimeline,
                    disabled: inValidForm || loading
                }}
                extendedClassName="w-fit mt-5"
            />
        </PopupModalLayout>
    );
};

export default SetTaskTimelineModal;

/** Converts the stored day-based timeline back to its display value.
 *  If divisible by 7, shows as weeks; otherwise shows as days. */
function getTimeline(timeline: number) {
    const value = timeline % 7 === 0
        ? timeline / 7
        : timeline;
    return value;
}

/** Infers the display unit (WEEK or DAY) from the stored day count. */
function getTimelineType(timeline: number) {
    const value = timeline % 7 === 0
        ? "WEEK"
        : "DAY";
    return value;
}
