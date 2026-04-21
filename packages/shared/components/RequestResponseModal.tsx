"use client";
import { IconType } from "react-icons/lib";
import ButtonPrimary from "./ButtonPrimary";

type RequestResponseModalProps = {
    Icon: IconType;
    title: string;
    description: React.ReactNode;
    buttonTitle: string;
    onButtonClick: () => void;
}

const RequestResponseModal = ({
    Icon,
    title,
    description,
    buttonTitle,
    onButtonClick
}: RequestResponseModalProps) => {
    return (
        <div className="fixed inset-0 z-[100] bg-[#0000004D] grid place-content-center backdrop-blur-[14px] pointer-events-none">
            <div className="w-[820px] max-h-[92dvh] p-10 popup-modal relative bg-dark-500 pointer-events-auto">
                <Icon className="text-[44px] text-primary-400 mx-auto" />
                <h2 className="text-headline-medium text-light-100 my-2.5 text-center">{title}</h2>
                <p className="text-body-medium text-dark-100 mb-[30px] text-center">{description}</p>
                <ButtonPrimary
                    format="OUTLINE"
                    text={buttonTitle}
                    attributes={{
                        onClick: onButtonClick
                    }}
                    extendedClassName="w-fit mx-auto"
                />
            </div>
        </div>
    );
};
 
export default RequestResponseModal;
