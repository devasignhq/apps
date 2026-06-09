"use client";
import { TaskDto } from "@/app/models/task.model";
import { createContext } from "react";

/**
 * Shared context that bridges the task list sidebar with the detail/conversation panels.
 *
 * Provided by the Tasks page, this context allows child components (TaskOverviewSection,
 * ConversationSection, modals) to read and update the currently selected task without
 * prop-drilling through multiple layout layers.
 */

export const ActiveTaskContext = createContext<{
    activeTask: TaskDto | null;
    setActiveTask: React.Dispatch<React.SetStateAction<TaskDto | null>>
}>({
    activeTask: null,
    setActiveTask: () => {}
});
