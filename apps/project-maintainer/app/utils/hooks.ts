import { useAsyncEffect, useLockFn } from "ahooks";
import { useState } from "react";
import useUserStore from "../state-management/useUserStore";
import useInstallationStore from "../state-management/useInstallationStore";
import useTaskStore from "../state-management/useTaskStore";
import { RepositoryDto } from "@devasign/shared/models/github.model";
import { InstallationAPI } from "../services/installation.service";

/**
 * Hook that returns a function to clear all stores
 */
export function useClearStores() {
    const { clearUserStore } = useUserStore();
    const { clearInstallationStore } = useInstallationStore();
    const { clearTaskStore } = useTaskStore();

    return () => {
        clearUserStore();
        clearInstallationStore();
        clearTaskStore();
    };
}

/**
 * Hook that returns the repositories of the active installation
 */
export function useGetInstallationRepositories() {
    const { activeInstallation } = useInstallationStore();
    const [repositories, setRepositories] = useState<RepositoryDto[]>([]);
    const [loading, setLoading] = useState(false);

    // useLockFn is used to prevent the effect from running multiple times
    useAsyncEffect(useLockFn(async () => {
        if (!activeInstallation) return;

        setLoading(true);

        try {
            const response = await InstallationAPI.getInstallationRepositories(
                activeInstallation.id
            );

            setRepositories(response.data);
        } catch { } finally {
            setLoading(false);
        }
    }), [activeInstallation]);

    return { repositories, loading };
}
