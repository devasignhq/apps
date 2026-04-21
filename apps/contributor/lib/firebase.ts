import { ROUTES } from "@/app/utils/data";
import { useClearStores } from "@/app/utils/hooks";
import { useLockFn, useAsyncEffect, clearCache } from "ahooks";
import { useRouter } from "next/navigation";
import { auth, getCurrentUser } from "@devasign/shared/lib/firebase";

export { auth, firestoreDB, storage, githubProvider, getCurrentUser } from "@devasign/shared/lib/firebase";

export function useLogoutUser() {
    const router = useRouter();
    const clearStores = useClearStores();

    const logoutUser = useLockFn(async () => {
        try {
            await auth.signOut();

            clearCache("");
            clearStores();
            router.push(ROUTES.AUTHENTICATE);
        } catch {
            alert("Something went wrong. Please try again.");
        }
    });

    return logoutUser;
};

// Checks if the user is signed out (used in pages where user needs to be authenticated before access is given)
export const useUnauthenticatedUserCheck = () => {
    const router = useRouter();

    useAsyncEffect(async () => {
        const user = await getCurrentUser();

        if (!user) {
            router.push(ROUTES.AUTHENTICATE);
        }
    }, [router]);

    return router;
};

// Checks if the user is signed in (used in authentication pages to redirect signed in users)
export const useAuthenticatedUserCheck = () => {
    const router = useRouter();

    useAsyncEffect(async () => {
        const user = await getCurrentUser();

        if (user) {
            router.push(ROUTES.TASKS);
        }
    }, [router]);

    return router;
};
