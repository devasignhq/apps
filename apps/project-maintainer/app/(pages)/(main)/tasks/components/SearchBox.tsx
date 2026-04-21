"use client";
import { twMerge } from "tailwind-merge";
import { FiSearch } from "react-icons/fi";
import { MdCancel } from "react-icons/md";

type SearchBoxProps = {
    attributes: React.InputHTMLAttributes<HTMLInputElement>;
    enableSearchOption: boolean;
    displaySearchIcon: boolean;
    onSearchIconClick: () => void;
    onClearIconClick: () => void;
    extendedInputClassName?: string;
    extendedContainerClassName?: string;
}

const SearchBox = ({ 
    attributes, 
    enableSearchOption,
    displaySearchIcon,
    onSearchIconClick, 
    onClearIconClick, 
    extendedInputClassName, 
    extendedContainerClassName 
} : SearchBoxProps) => {
    return (
        <div className={twMerge("relative w-full", extendedContainerClassName)}>
            <button 
                className="w-fit text-xl text-light-100 absolute top-1/2 -translate-y-1/2 right-2.5"
                disabled={!enableSearchOption}
                onClick={() => {
                    if (displaySearchIcon) {
                        onSearchIconClick();
                    } else {
                        onClearIconClick();
                    }
                }}
            >
                {displaySearchIcon ? <FiSearch /> : <MdCancel />}
            </button>
            <input
                type="text"
                className={twMerge(
                    "w-full p-2.5 pr-[42px] bg-dark-400 border border-dark-100 text-body-small text-light-100", 
                    extendedInputClassName
                )}
                {...attributes}
            />
        </div>
    );
};
 
export default SearchBox;
