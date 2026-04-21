import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { UserDto } from "../models/user.model";

type UserStore = {
    currentUser: UserDto | null,
    setCurrentUser: (data: UserDto) => void,
    clearUserStore: () => void,
}

const useUserStore = create(
    persist<UserStore>(
        (set) => ({
            currentUser: null,
            setCurrentUser: (data: UserDto) => {
                set({ currentUser: data });
            },
            clearUserStore: () => {
                set({ currentUser: null });
            }
        }),
        {
            name: "@user",
            storage: createJSONStorage(() => localStorage)
        }
    )
);

export default useUserStore;
