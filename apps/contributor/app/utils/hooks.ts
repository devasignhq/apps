import useUserStore from "../state-management/useUserStore";

export function useClearStores() {
    const { clearUserStore } = useUserStore();

    return () => {
        clearUserStore();
    };
}
