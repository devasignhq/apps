import { toast } from "react-toastify";
import { ApiResponse, ErrorResponse, PaginatedApiResponse } from "@devasign/shared/models/_global";
import { TaskStatus } from "../models/task.model";

export function formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });
}

export function formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

export function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-GB", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });
}

export function formatTimeline(timeline: number) {
    const weeks = Math.floor(timeline / 7);
    const days = timeline % 7;

    let displayValue = "";

    if (weeks === 0) {
        displayValue = `${days} day${days !== 1 ? "s" : ""}`;
    } else {
        displayValue = `${weeks} week${weeks !== 1 ? "s" : ""}`;
        if (days > 0) {
            displayValue += ` and ${days} day${days !== 1 ? "s" : ""}`;
        }
    }

    return {
        displayValue,
        weeks,
        days
    };
};

/** ie Converts `ELAPSED_CONTRACT` to `Elapsed Contract` */
export const enumToStringConverter = (value: string) => {
    if (!value) return value;
    const splittedValues = value.split("_");

    const newValue = splittedValues.reduce((acc, value) => {
        return acc += `${value.slice(0, 1) + value.slice(1).toLowerCase()} `;
    }, "");

    return newValue.trim();
};
/**
 * Formats a numeric value into a localized string representation with proper currency formatting.
 * 
 * This function takes a numeric input and converts it to a formatted string based on the specified locale.
 * It handles different numeric types and provides fallback formatting if the specified locale is invalid.
 * 
 * @param value - The numeric value to format. Can be a number, string, or bigint.
 * @param standard - The locale string (e.g., 'en-US') or array of locales for formatting.
 *                  Defaults to 'en-US' if not provided or if specified locale is invalid.
 * @param dec - The number of decimal places to show. Defaults to 2 if not specified.
 * @param noDecimals - If true, removes decimal formatting completely. If false, uses decimal places as specified by dec.
 * @returns A formatted string representation of the number. Returns "--" for null or undefined values.
 * 
 * @example
 * moneyFormat(1234.56) // Returns "1,234.56"
 * moneyFormat(1234.56, 'de-DE') // Returns "1.234,56"
 * moneyFormat(1234.56, 'en-US', 3) // Returns "1,234.560"
 * moneyFormat(1234.56, 'en-US', 2, true) // Returns "1,235"
 */
export function moneyFormat(
    value: number | string | bigint,
    standard?: string | string[],
    dec?: number,
    noDecimals?: boolean
) {
    const decimal = (noDecimals || dec === 0)
        ? 0
        : dec || 2;

    const options: Intl.NumberFormatOptions = {
        minimumFractionDigits: decimal,
        maximumFractionDigits: decimal
    };

    try {
        // Use default locale if none provided or invalid
        const locale = standard || "en-US";
        const nf = new Intl.NumberFormat(locale, options);
        return (value || value === 0) ? nf.format(Number(value)) : "--";
    } catch {
        // Fallback to basic locale if the provided one fails
        const nf = new Intl.NumberFormat("en-US", options);
        return (value || value === 0) ? nf.format(Number(value)) : "--";
    }
}

/**
 * Converts a GitHub API URL to a GitHub web URL
 * @param apiUrl - The GitHub API URL (e.g., "https://api.github.com/repos/owner/repo/issues/123")
 * @returns The corresponding GitHub web URL (e.g., "https://github.com/owner/repo/issues/123")
 */
export function convertGitHubApiUrlToWebUrlRegex(apiUrl: string): string {
    const match = apiUrl.match(/^https:\/\/api\.github\.com\/repos\/(.+)$/);

    if (!match) {
        return apiUrl;
    }

    return `https://github.com/${match[1]}`;
}

export function taskStatusFormatter(status: TaskStatus) {
    switch (status) {
        case "IN_PROGRESS":
            return ["In Progress", "bg-indicator-400 text-dark-500"];
        case "MARKED_AS_COMPLETED":
            return ["Review", "bg-light-100 text-dark-500"];
        case "COMPLETED":
            return ["Bounty Paid", "bg-indicator-100 text-dark-500"];
        default:
            return ["Applied", "bg-indicator-300 text-dark-500"];
    }
}

export const openInNewTab = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
};

export const handleApiSuccessResponse = (
    response: ApiResponse<unknown> | PaginatedApiResponse<unknown>
) => {
    toast.success(response.message);
    if (response.warning) {
        toast.warning(response.warning);
    }
};

export const handleApiErrorResponse = (err: unknown, altMessage: string) => {
    const error = err as ErrorResponse;
    if (error.message) {
        toast.error(error.message);
        return;
    }
    toast.error(altMessage);
};
