"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import MoneyInput from "@devasign/shared/components/Input/MoneyInput";
import PopupModalLayout from "@devasign/shared/components/PopupModalLayout";
import { useContext, useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { ActiveTaskContext } from "../contexts/ActiveTaskContext";
import Image from "next/image";
import { TaskAPI } from "@/app/services/task.service";
import { handleApiErrorResponse, handleApiSuccessResponse } from "@/app/utils/helper";
import { useCustomSearchParams } from "@devasign/shared/hooks";

/**
 * Bounty editor modal — updates the USDC amount escrowed for a task.
 *
 * The bounty can only be edited for OPEN tasks with zero applications
 * (enforced by the parent TaskOverviewSection). The new bounty value
 * is sanitised (commas stripped) before being sent to the API.
 *
 * The submit button is disabled when the value hasn't changed or the
 * input is empty, preventing no-op API calls. On success, the task list
 * is refreshed via the `refresh` URL param.
 *
 * Note: The updated bounty will be reflected on the GitHub issue only
 * after the user reloads the issue page, since the API updates the issue
 * label asynchronously.
 */

type SetTaskBountyModalProps = {
    toggleModal: () => void;
};

const SetTaskBountyModal = ({ toggleModal }: SetTaskBountyModalProps) => {
    const { activeTask, setActiveTask } = useContext(ActiveTaskContext);
    const { updateSearchParams } = useCustomSearchParams();
    const [newBounty, setNewBounty] = useState("");
    const [loading, setLoading] = useState(false);

    const updateBounty = async () => {
        setLoading(true);

        try {
            const response = await TaskAPI.updateTaskBounty(
                activeTask!.id,
                { newBounty: newBounty.replace(/,/g, "") }
            );

            setActiveTask({ ...activeTask!, ...response.data });
            handleApiSuccessResponse(response);
            updateSearchParams({ refresh: true });
            toggleModal();
        } catch (error) {
            handleApiErrorResponse(error, "Failed to update task bounty.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <PopupModalLayout title="Set Task Bounty" toggleModal={toggleModal}>
            <p className="mt-2.5 text-body-medium text-dark-100">
                Set bounty for this task (issue) for contributors to take on.
                Reload the GitHub issue URL to see bounty update.
            </p>
            <div className="w-full p-[15px] border border-primary-200 bg-dark-400 flex items-start gap-2.5 mt-5 mb-2.5">
                <p className="text-body-tiny tracking-[-3%] text-primary-100" style={{ lineHeight: "20px" }}>
                    #{activeTask?.issue.number}
                </p>
                <p className="text-body-medium font-bold text-light-100 line-clamp-2">
                    {activeTask?.issue.title}
                </p>
            </div>
            <div className="relative">
                <Image
                    src="/usdc.svg"
                    alt="$"
                    width={16}
                    height={16}
                    className="absolute top-1/2 -translate-y-1/2 left-2.5"
                />
                <MoneyInput
                    attributes={{
                        id: "bounty",
                        name: "bounty",
                        placeholder: "0.00",
                        className: "w-full p-2.5 pl-[42px] bg-dark-400 border border-dark-100 text-body-small text-light-100",
                        value: newBounty,
                        disabled: loading
                    }}
                    defaultValue={activeTask?.bounty}
                    setValue={(value) => setNewBounty(value)}
                />
            </div>
            <ButtonPrimary
                format="SOLID"
                text={loading ? "Updating..." : "Update Bounty"}
                sideItem={<FiArrowRight />}
                attributes={{
                    onClick: updateBounty,
                    disabled: Boolean(newBounty === activeTask?.bounty.toString() || !newBounty.trim()) || loading
                }}
                extendedClassName="w-fit mt-5"
            />
        </PopupModalLayout>
    );
};

export default SetTaskBountyModal;
