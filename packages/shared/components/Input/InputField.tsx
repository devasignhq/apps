"use client";
import { IconType } from "react-icons/lib";
import { twMerge } from "tailwind-merge";
import Image from "next/image";

type InputFieldProps = {
    Icon?: IconType;
    imageSrc?: string;
    imageAlt?: string;
    attributes?: React.InputHTMLAttributes<HTMLInputElement>;
    extendedInputClassName?: string;
    extendedContainerClassName?: string;
}

const InputField = ({ 
    Icon, 
    imageSrc, 
    imageAlt,
    attributes, 
    extendedInputClassName, 
    extendedContainerClassName 
} : InputFieldProps) => {
    return (
        <div className={twMerge("relative w-full", extendedContainerClassName)}>
            {Icon && <Icon className="text-xl text-light-100 absolute top-1/2 -translate-y-1/2 left-2.5" />}
            {imageSrc && (
                <Image 
                    src={imageSrc} 
                    alt={imageAlt || ""}
                    width={20}
                    height={20}
                    className="absolute top-1/2 -translate-y-1/2 left-2.5" 
                />
            )}
            <input
                type="text"
                className={twMerge(
                    "w-full p-2.5 pl-[42px] bg-dark-400 border border-dark-100 text-body-small text-light-100", 
                    extendedInputClassName
                )}
                {...attributes}
            />
        </div>
    );
};
 
export default InputField;
