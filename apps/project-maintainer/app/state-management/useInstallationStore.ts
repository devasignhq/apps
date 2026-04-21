import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { InstallationDto } from "../models/installation.model";

type InstallationStore = {
    activeInstallation: InstallationDto | null,
    installationList: InstallationDto[],
    setActiveInstallation: (data: InstallationDto) => void,
    setInstallationList: (data: InstallationDto[]) => void,
    clearInstallationStore: () => void,
}

const useInstallationStore = create<InstallationStore>()(
    persist(
        (set) => ({
            activeInstallation: null,
            installationList: [],
            setActiveInstallation: (data: InstallationDto) => {
                set({ activeInstallation: data });
            },
            setInstallationList: (data: InstallationDto[]) => {
                set({ installationList: data });
            },
            clearInstallationStore: () => {
                set({ activeInstallation: null, installationList: [] });
            }
        }),
        {
            name: "@installation",
            storage: createJSONStorage(() => localStorage)
        }
    )
);

export default useInstallationStore;
