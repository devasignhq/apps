"use client";
import React, { useState, ReactNode, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
    children: ReactNode;
    message?: string | ReactNode;
    position?: "top" | "bottom" | "left" | "right";
    delay?: number;
    className?: string;
    disabled?: boolean;
}

const Tooltip = ({
    children,
    message = "Press Enter to search after typing your search term",
    position = "top",
    delay = 200,
    className = "",
    disabled = false
}: TooltipProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const updatePosition = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            });
        }
    }, []);

    const showTooltip = () => {
        updatePosition();
        const id = setTimeout(() => {
            setIsVisible(true);
        }, delay);
        setTimeoutId(id);
    };

    const hideTooltip = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }
        setIsVisible(false);
    };

    useEffect(() => {
        if (isVisible) {
            window.addEventListener("scroll", updatePosition, true);
            window.addEventListener("resize", updatePosition);
        }
        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [isVisible, updatePosition]);

    const getPositionStyles = () => {
        const offset = 10;
        switch (position) {
            case "top":
                return {
                    top: `${coords.top - offset}px`,
                    left: `${coords.left + coords.width / 2}px`,
                    transform: "translate(-50%, -100%)"
                };
            case "bottom":
                return {
                    top: `${coords.top + coords.height + offset}px`,
                    left: `${coords.left + coords.width / 2}px`,
                    transform: "translateX(-50%)"
                };
            case "left":
                return {
                    top: `${coords.top + coords.height / 2}px`,
                    left: `${coords.left - offset}px`,
                    transform: "translate(-100%, -50%)"
                };
            case "right":
                return {
                    top: `${coords.top + coords.height / 2}px`,
                    left: `${coords.left + coords.width + offset}px`,
                    transform: "translateY(-50%)"
                };
            default:
                return {};
        }
    };

    const getArrowClasses = () => {
        switch (position) {
            case "top":
                return "top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-dark-300";
            case "bottom":
                return "bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-dark-300";
            case "left":
                return "left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-dark-300";
            case "right":
                return "right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-dark-300";
            default:
                return "top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-dark-300";
        }
    };

    return (
        <div
            ref={triggerRef}
            className={`relative inline-block ${className}`}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
        >
            {children}

            {isVisible && !disabled && typeof document !== "undefined" && createPortal(
                <div
                    className="fixed z-[10000] px-3 py-2 text-sm text-white bg-dark-300 rounded-md shadow-lg whitespace-nowrap pointer-events-none transition-none"
                    style={getPositionStyles()}
                    role="tooltip"
                >
                    {message}
                    {/* Arrow */}
                    <div
                        className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`}
                    />
                </div>,
                document.body
            )}
        </div>
    );
};

export default Tooltip;
