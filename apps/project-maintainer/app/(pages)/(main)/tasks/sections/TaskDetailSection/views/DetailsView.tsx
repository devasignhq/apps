"use client";
import Link from "next/link";
import { useContext } from "react";
import { ActiveTaskContext } from "../../../contexts/ActiveTaskContext";
import MarkdownFormatter from "@/app/components/MarkdownFormatter";

/**
 * Read-only view of the GitHub issue associated with the active task.
 *
 * Renders the issue title, labels, URL, and body (as rendered Markdown).
 * The body is passed through `MarkdownFormatter` which sanitises and
 * renders GitHub-flavoured Markdown (fenced code blocks, tables, etc.).
 * This view is shared across both the "Description" tab and the OPEN-only
 * single-view mode.
 */

const DetailsView = () => {
    const { activeTask } = useContext(ActiveTaskContext);
    
    return (
        <>
            <h6 className="px-5 my-10 text-headline-small text-light-100">
                {activeTask?.issue.title}
            </h6>
            {activeTask && activeTask.issue.labels?.length > 0 && (
                <div className="px-5 text-body-medium space-y-2.5 mb-[30px]">
                    <p className="font-bold text-dark-100">Issue Label(s)</p>
                    <div className="flex gap-1.5 flex-wrap">
                        {activeTask.issue.labels.map((label) => (
                            <p 
                                key={label.id}
                                className="py-0.5 px-[7px] bg-primary-300 text-body-tiny font-bold text-light-200"
                            >
                                {label.name}
                            </p>
                        ))}
                    </div>
                </div>
            )}
            <div className="px-5 text-body-medium space-y-2.5 mb-[30px]">
                <p className="font-bold text-dark-100">Issue URL</p>
                <Link 
                    href={activeTask?.issue.url || ""} 
                    target="_blank" 
                    className="text-primary-400 hover:text-light-200"
                >
                    {activeTask?.issue.url}
                </Link>
            </div>
            <div className="text-body-medium space-y-2.5">
                <p className="px-5 font-bold text-dark-100">Issue Description</p>
                <div className="px-5 overflow-y-auto">
                    <MarkdownFormatter body={activeTask?.issue.body || ""} />
                </div>
            </div>
        </>
    );
};
 
export default DetailsView;
