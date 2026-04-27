"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import PopupModalLayout from "@devasign/shared/components/PopupModalLayout";
import { useContext, useState } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { ActiveTaskContext } from "../contexts/ActiveTaskContext";
import { handleApiErrorResponse, handleApiSuccessResponse, moneyFormat } from "@/app/utils/helper";
import { TaskAPI } from "@/app/services/task.service";
import { useCustomSearchParams } from "@devasign/shared/hooks";

/**
 * Destructive action modal — permanently deletes a task and removes
 * the bounty label from the associated GitHub issue.
 *
 * On deletion, the escrowed bounty amount is refunded to the installation's
 * wallet balance. The task list is refreshed via the `refresh` URL param,
 * and the active task is set to null to clear the detail panel.
 */

type DeleteTaskModalProps = {
    toggleModal: () => void;
};

const DeleteTaskModal = ({ toggleModal }: DeleteTaskModalProps) => {
    const { activeTask, setActiveTask } = useContext(ActiveTaskContext);
    const { updateSearchParams } = useCustomSearchParams();
    const [loading, setLoading] = useState(false);

    const deleteTask = async () => {
        setLoading(true);

        try {
            const response = await TaskAPI.deleteTask(activeTask!.id);

            setActiveTask(null);
            handleApiSuccessResponse(response);
            updateSearchParams({ refresh: true }, true);
            toggleModal();
        } catch (error) {
            handleApiErrorResponse(error, "Failed to delete task.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <PopupModalLayout title="Delete Task" toggleModal={toggleModal}>
            <p className="mt-2.5 text-body-medium text-dark-100">
                By deleting this task, the assigned bounty will be removed from the
                corresponding GitHub Issue and the bounty amount will be refunded.
            </p>
            <div className="w-full p-[15px] border border-dark-200 flex items-start gap-2.5 my-5 whitespace-nowrap">
                <p className="text-body-tiny tracking-[-3%] text-primary-100" style={{ lineHeight: "20px" }}>
                    #{activeTask?.issue.number}
                </p>
                <div className="py-0.5 px-[7px] bg-primary-300 text-body-tiny font-bold text-light-200 max-w-[150px] truncate">
                    {activeTask?.issue.labels
                        .map(label => label.name)
                        .map((name, index, array) =>
                            index === array.length - 1 ? name : `${name}, `
                        )
                        .join("")}
                </div>
                <p className="grow text-body-medium font-bold text-light-100 truncate">
                    {activeTask?.issue.title}
                </p>
                <p className="text-body-tiny font-bold tracking-[-3%] text-primary-100" style={{ lineHeight: "20px" }}>
                    {moneyFormat(activeTask?.bounty || "")} USDC
                </p>
            </div>
            <ButtonPrimary
                format="SOLID"
                text={loading ? "Deleting..." : "Delete"}
                sideItem={<FaRegTrashAlt />}
                attributes={{
                    onClick: deleteTask,
                    disabled: loading
                }}
                extendedSideItemClassName="text-xl"
                extendedClassName="w-fit"
            />
        </PopupModalLayout>
    );
};

export default DeleteTaskModal;
