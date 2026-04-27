"use client";
import { TaskDto } from "@/app/models/task.model";
import { createContext, Dispatch, SetStateAction } from "react";

/**
 * Cross-panel communication context for the tasks page.
 *
 * Bridges the task list sidebar, detail panel, and overview sidebar.
 * - `activeTask` / `setActiveTask`: The currently selected task, owned by
 *   the Tasks page and consumed by every child section and modal.
 * - `refreshActiveTask`: Re-fetches the active task from the API. Modals
 *   call this after mutations (e.g. bounty update, delegation) so the
 *   overview panel reflects the latest state without a full page reload.
 */

type ActiveTaskContextType = {
    activeTask: TaskDto | null;
    setActiveTask: Dispatch<SetStateAction<TaskDto | null>>;
    refreshActiveTask: () => void;
}

export const ActiveTaskContext = createContext<ActiveTaskContextType>({} as ActiveTaskContextType);
