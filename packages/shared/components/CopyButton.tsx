"use client";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { LuCopy, LuCheck } from "react-icons/lu";

type CopyButtonProps = {
    text: string;
    extendedClassName?: string;
};

const CopyButton = ({ text, extendedClassName }: CopyButtonProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            alert("Failed to copy text. Please try again.");
        }
    };

    return (
        <button
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy to clipboard"}
            className={twMerge(
                "p-1 rounded transition-colors", 
                "text-2xl text-dark-100 hover:text-light-100",
                extendedClassName
            )}
        >
            {copied ? <LuCheck /> : <LuCopy />}
        </button>
    );
};

export default CopyButton;
