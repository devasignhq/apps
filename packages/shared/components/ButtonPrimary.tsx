"use client";
import { twMerge } from "tailwind-merge";

type ButtonPrimaryProps = {
    format: "SOLID" | "OUTLINE";
    text: string;
    sideItem?: React.ReactNode;
    attributes?: React.ButtonHTMLAttributes<HTMLButtonElement>;
    extendedClassName?: string;
    extendedSideItemClassName?: string;
}

const ButtonPrimary = ({
    format,
    text,
    sideItem,
    attributes = {},
    extendedClassName = "",
    extendedSideItemClassName = ""
}: ButtonPrimaryProps) => {
    return (
        <button 
            className={twMerge(`text-button-large font-extrabold p-2.5 hover:bg-light-100 hover:text-dark-500 
                flex items-center justify-center gap-[5px] whitespace-nowrap
                ${format === "SOLID"
            ? "bg-primary-100 text-dark-500"
            : "border border-primary-100 text-primary-100 hover:border-light-100"}
            `, extendedClassName)}
            {...attributes}
        >
            <span>{text}</span>
            {sideItem && <span className={twMerge("text-2xl leading-[1]", extendedSideItemClassName)}>{sideItem}</span>}
        </button>
    );
};
 
export default ButtonPrimary;
