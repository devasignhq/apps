import useUserStore from "../state-management/useUserStore";

/**
 * Hook to clear all stores.
 */
export function useClearStores() {
    const { clearUserStore } = useUserStore();

    return () => {
        clearUserStore();
    };
}
