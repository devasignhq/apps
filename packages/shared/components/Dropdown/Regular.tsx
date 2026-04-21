"use client";
import { usePopup } from "@devasign/shared/hooks";
import { useState } from "react";
import { IoIosCheckbox, IoMdArrowDropdown } from "react-icons/io";
import { MdOutlineCheckBoxOutlineBlank } from "react-icons/md";
import { twMerge } from "tailwind-merge";

type RegularDropdownProps = {
    defaultName?: string | number;
    onChange: (value: string | number | (string | number)[]) => void;
    extendedButtonClassName?: string;
    buttonAttributes?: React.ButtonHTMLAttributes<HTMLButtonElement>;
    extendedContainerClassName?: string;
    title?: string;
} & ({
    options: (string | number)[];
} | {
    options: Record<string, unknown>[];
    fieldName: string;
    fieldValue: string;
})

const RegularDropdown = ({
    defaultName,
    options,
    onChange,
    extendedButtonClassName,
    buttonAttributes,
    extendedContainerClassName,
    title,
    ...otherProps
}: RegularDropdownProps) => {
    const { menuButtonRef, menuRef, openMenu, toggleMenu } = usePopup();
    const [selectedItem, setSelectedItem] = useState<string | number>(defaultName || "");

    const getContent = (option: string | number | Record<string, unknown>, field: "fieldName" | "fieldValue") => {
        return typeof option === "object"
            ? ((option as Record<string, unknown>)[(otherProps as { [key: string]: string })[field]] as string | number)
            : option;
    };

    const selectItem = (option: string | number | Record<string, unknown>) => {
        setSelectedItem(getContent(option, "fieldName"));
        if (onChange) onChange(getContent(option, "fieldValue"));
        toggleMenu();
    };

    return (
        <div className={twMerge("relative whitespace-nowrap", extendedContainerClassName)}>
            <button
                type="button"
                ref={menuButtonRef}
                className={twMerge("py-[5px] pl-[15px] pr-2.5 border border-dark-200 text-body-tiny text-light-100 flex items-center gap-[5px]", extendedButtonClassName)}
                onClick={toggleMenu}
                {...buttonAttributes}
            >
                <span>{title || selectedItem}</span>
                <IoMdArrowDropdown className={`text-2xl ${openMenu && "rotate-180"}`} />
            </button>
            {openMenu && (
                <div
                    ref={menuRef}
                    className="fixed top-[var(--dropdown-top)] left-[var(--dropdown-left)] px-2.5 py-[15px] max-h-[350px] 
                    bg-dark-400 dropdown-box shadow-[-20px_4px_40px_0px_#000000] z-[110] overflow-y-auto"
                    style={{
                        "--dropdown-top": `${menuButtonRef.current?.getBoundingClientRect().top}px`,
                        "--dropdown-left": `${menuButtonRef.current?.getBoundingClientRect().right as number + 7}px`
                    } as React.CSSProperties}
                >
                    <ul className="flex flex-col gap-3 list-none items-start">
                        {options.map((option, index) => (
                            <li
                                key={index}
                                className="flex items-center gap-2.5"
                            >
                                {selectedItem === getContent(option, "fieldName") ? (
                                    <IoIosCheckbox className="text-[18px] text-primary-100" />
                                ) : (
                                    <MdOutlineCheckBoxOutlineBlank className="text-[18px] text-dark-100" />
                                )}
                                <button
                                    type="button"
                                    className="text-body-small text-light-100 whitespace-nowrap"
                                    onClick={() => selectItem(option)}
                                >
                                    {getContent(option, "fieldName")}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default RegularDropdown;
