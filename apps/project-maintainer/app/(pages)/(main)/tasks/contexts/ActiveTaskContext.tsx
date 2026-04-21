"use client";
import { TaskDto } from "@/app/models/task.model";
import { createContext, Dispatch, SetStateAction } from "react";

type ActiveTaskContextType = {
    activeTask: TaskDto | null;
    setActiveTask: Dispatch<SetStateAction<TaskDto | null>>;
    refreshActiveTask: () => void;
}

export const ActiveTaskContext = createContext<ActiveTaskContextType>({} as ActiveTaskContextType);
