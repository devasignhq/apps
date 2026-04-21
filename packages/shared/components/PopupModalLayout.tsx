"use client";
import { IoMdClose } from "react-icons/io";
import { twMerge } from "tailwind-merge";

type PopupModalLayoutProps = {
    children: React.ReactNode;
    title: string;
    toggleModal: () => void;
    extendedModalClassName?: string;
    disableCloseButton?: boolean;
}

const PopupModalLayout = ({
    children,
    title,
    toggleModal,
    extendedModalClassName,
    disableCloseButton
}: PopupModalLayoutProps) => {
    return (
        <div className="fixed inset-0 z-[100] bg-[#0000004D] grid place-content-center backdrop-blur-[14px] pointer-events-none">
            <div className={twMerge("w-[820px] max-h-[92dvh] p-10 pt-[30px] popup-modal relative bg-dark-500 flex flex-col overflow-hidden pointer-events-auto", extendedModalClassName)}>
                <div className="flex items-center justify-between">
                    <h2 className="text-display-small text-light-100">
                        {title}
                    </h2>
                    <button 
                        className="gradient-border-btn relative p-2.5 bg-dark-400 text-light-100 text-2xl"
                        onClick={toggleModal}
                        disabled={disableCloseButton}
                    >
                        <IoMdClose />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};
 
export default PopupModalLayout;
