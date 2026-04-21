"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import PopupModalLayout from "@devasign/shared/components/PopupModalLayout";
import { FiArrowRight } from "react-icons/fi";
import { GoDotFill } from "react-icons/go";

type SwitchAccountPlanModalProps = {
    toggleModal: () => void;
};

const SwitchAccountPlanModal = ({ toggleModal }: SwitchAccountPlanModalProps) => {
    return (
        <PopupModalLayout 
            title="Switch Account Plan" 
            toggleModal={toggleModal}
            extendedModalClassName="w-[600px]"
        >
            <p className="mt-2.5 text-body-medium text-dark-100">
                Switch to this DevAsign account plan and get the full benefits listed below.
            </p>
            <div className="my-[30px] space-y-5">
                <h6 className="text-body-large font-bold flex items-center gap-2.5">
                    <span className="text-light-200">Enterprise</span>
                    <GoDotFill className="text-[10px] text-light-100" />
                    <span className="text-primary-100">$499</span>
                </h6>
                <h5 className="text-headline-small text-light-100">What you get on this plan:</h5>
                <ul className="text-body-tiny list-disc list-inside space-y-1 text-light-100">
                    <li>Manage UNLIMITED contributors</li>
                    <li>5 admin</li>
                    <li>1% pay-out fee</li>
                </ul>
            </div>
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
                    text="Proceed"
                    sideItem={<FiArrowRight />}
                    attributes={{
                        onClick: () => {}
                    }}
                />
            </div>
        </PopupModalLayout>
    );
};
 
export default SwitchAccountPlanModal;
