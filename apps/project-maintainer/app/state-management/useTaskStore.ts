import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CreateTaskDto, TaskDto } from "../models/task.model";

type TaskStore = {
    activeTask: TaskDto | null,
    taskList: TaskDto[],
    draftTasks: CreateTaskDto[],
    setActiveTask: (data: TaskDto) => void,
    setTaskList: (data: TaskDto[]) => void,
    setDraftTasks: (data: CreateTaskDto[]) => void,
    clearTaskStore: () => void,
}

const useTaskStore = create(
    persist<TaskStore>(
        (set) => ({
            activeTask: null,
            taskList: [],
            draftTasks: [],
            setActiveTask: (data: TaskDto) => {
                set({ activeTask: data });
            },
            setTaskList: (data: TaskDto[]) => {
                set({ taskList: data });
            },
            setDraftTasks: (data: CreateTaskDto[]) => {
                set({ draftTasks: data });
            },
            clearTaskStore: () => {
                set({ 
                    activeTask: null, 
                    taskList: [],
                    draftTasks: []
                });
            }
        }),
        {
            name: "@task",
            storage: createJSONStorage(() => localStorage)
        }
    )
);

export default useTaskStore;
