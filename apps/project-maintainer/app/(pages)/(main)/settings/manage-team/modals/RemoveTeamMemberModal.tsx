"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import PopupModalLayout from "@devasign/shared/components/PopupModalLayout";
import { IoMdClose } from "react-icons/io";

type RemoveTeamMemberModalProps = {
    toggleModal: () => void;
};

const RemoveTeamMemberModal = ({ toggleModal }: RemoveTeamMemberModalProps) => {
    return (
        <PopupModalLayout title="Remove Team Member" toggleModal={toggleModal}>
            <div className="flex items-center gap-[30px] my-[30px]">
                <div className="w-full space-y-2.5 text-body-medium">
                    <p className="text-dark-100 font-bold">GitHub @</p>
                    <p className="text-light-100">Lenny_malcolm</p>
                </div>
                <div className="w-full space-y-2.5 text-body-medium">
                    <p className="text-dark-100 font-bold">Email Address</p>
                    <p className="text-light-100">lenny.malcolm@gmail.com</p>
                </div>
            </div>
            <div className="h-[1px] w-full bg-dark-200" />
            <p className="my-[30px] text-body-medium text-dark-100">
                By removing this collaborator, they won’t have access to 
                manage this project anymore till you add them back.
            </p>
            <div className="flex gap-2.5">
                <ButtonPrimary
                    format="OUTLINE"
                    text="Cancel"
                    attributes={{
                        onClick: () => {}
                    }}
                />
                <ButtonPrimary
                    format="SOLID"
                    text="Remove"
                    sideItem={<IoMdClose />}
                    attributes={{
                        onClick: () => {}
                    }}
                />
            </div>
        </PopupModalLayout>
    );
};
 
export default RemoveTeamMemberModal;
