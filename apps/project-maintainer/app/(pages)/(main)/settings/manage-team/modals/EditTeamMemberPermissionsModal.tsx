"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import PopupModalLayout from "@devasign/shared/components/PopupModalLayout";
import { useState } from "react";
import { FiCheck } from "react-icons/fi";
import { IoIosCheckbox } from "react-icons/io";
import { MdOutlineCheckBoxOutlineBlank } from "react-icons/md";

type EditTeamMemberPermissionsModalProps = {
    toggleModal: () => void;
};

const EditTeamMemberPermissionsModal = ({ toggleModal }: EditTeamMemberPermissionsModalProps) => {
    const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
        permissions.reduce((acc, _, index) => ({ ...acc, [`${index}`]: false }), {})
    );

    const toggleItems = (field: string) => {
        setSelectedItems(previousValue => {
            if (previousValue[field]) {
                return { ...previousValue, [field]: false };
            }
            return { ...previousValue, [field]: true };
        });
    };

    return (
        <PopupModalLayout title="Edit Collaborator Permissions" toggleModal={toggleModal}>
            <div className="flex items-center gap-[30px] mt-[30px]">
                <div className="w-full space-y-2.5 text-body-medium">
                    <p className="text-dark-100 font-bold">GitHub @</p>
                    <p className="text-light-100">Lenny_malcolm</p>
                </div>
                <div className="w-full space-y-2.5 text-body-medium">
                    <p className="text-dark-100 font-bold">Email Address</p>
                    <p className="text-light-100">lenny.malcolm@gmail.com</p>
                </div>
            </div>
            <div className="h-px w-full bg-dark-200 my-[30px]" />
            <ul className="flex flex-col gap-3 list-none items-start">
                {permissions.map((permission, index) => (
                    <li
                        key={index}
                        className="flex items-center gap-2.5 cursor-pointer"
                        onClick={() => toggleItems(`${index}`)}
                    >
                        {selectedItems[`${index}`] ? (
                            <IoIosCheckbox className="text-[18px] text-primary-100" />
                        ) : (
                            <MdOutlineCheckBoxOutlineBlank className="text-[18px] text-dark-100" />
                        )}
                        <span className={`text-body-medium ${selectedItems[`${index}`] ? "text-light-200" : "text-light-100"}`}>
                            {permission}
                        </span>
                    </li>
                ))}
            </ul>
            <p className="my-[30px] text-body-medium text-dark-100">
                Set the permissions you want this collaborator to have in this project.
                Ensure you trust them before assigning wallet control to them.
            </p>
            <div className="flex gap-2.5">
                <ButtonPrimary
                    format="OUTLINE"
                    text="Cancel"
                    attributes={{
                        onClick: () => { }
                    }}
                />
                <ButtonPrimary
                    format="SOLID"
                    text="Update"
                    sideItem={<FiCheck />}
                    attributes={{
                        onClick: () => { }
                    }}
                />
            </div>
        </PopupModalLayout>
    );
};

export default EditTeamMemberPermissionsModal;

const permissions = [
    "Create tasks and assign bounties",
    "View and edit tasks",
    "View and edit project settings",
    "View and edit project members",
    "View and edit project billing"
];
