"use client";
import { TaskDto } from "@/app/models/task.model";
import { createContext } from "react";

export const ActiveTaskContext = createContext<{
    activeTask: TaskDto | null;
    setActiveTask: React.Dispatch<React.SetStateAction<TaskDto | null>>
}>({
    activeTask: null,
    setActiveTask: () => {}
});
