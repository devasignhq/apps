"use client";
import { useToggle, useClickAway } from "ahooks";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DependencyList, EffectCallback, useEffect, useRef, useState } from "react";

/**
 * Custom hook to get and update search parameters from the URL search string
 * 
 * @returns {Object} Object containing searchParams, updateSearchParams, and removeSearchParams
 */
export function useCustomSearchParams() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    /**
     * Updates the URL search parameters and navigates to the new URL.
     * 
     * @param {Record<string, string | number | boolean>} params - An object containing the key-value pairs to update or add to the search parameters.
     * @param {boolean} [override=false] - If true, clears existing search parameters before applying the new ones.
     */
    const updateSearchParams = (params: Record<string, string | number | boolean>, override = false) => {
        const currentSearchParams = override
            ? new URLSearchParams()
            : new URLSearchParams(searchParams);

        if (Object.keys(params).length === 0) {
            return router.push(pathname);
        }

        Object.entries(params).forEach(([key, value]) => {
            currentSearchParams.set(key, value.toString());
        });

        let queryString = "";
        if (currentSearchParams.size !== 0) {
            queryString = `?${currentSearchParams.toString()}`;
        }
        const newUrl = `${pathname}${queryString}`;

        router.push(newUrl);
    };

    /**
     * Removes specified keys from the URL search parameters and navigates to the new URL.
     * 
     * @param {string | string[]} keys - A string or an array of strings representing the keys to remove from the search parameters.
     */
    const removeSearchParams = (keys: string | string[]) => {
        const currentSearchParams = new URLSearchParams(searchParams);
        const keysToRemove = Array.isArray(keys) ? keys : [keys];

        keysToRemove.forEach(key => {
            currentSearchParams.delete(key);
        });

        let queryString = "";
        if (currentSearchParams.size !== 0) {
            queryString = `?${currentSearchParams.toString()}`;
        }
        const newUrl = `${pathname}${queryString}`;

        router.push(newUrl);
    };

    return {
        searchParams,
        updateSearchParams,
        removeSearchParams
    };
}

/**
 * Hook to manage a popup or menu state.
 * 
 * @returns {Object} An object containing:
 * - `menuButtonRef`: Ref to be attached to the menu trigger button.
 * - `menuRef`: Ref to be attached to the menu container.
 * - `openMenu`: Boolean indicating if the menu is open.
 * - `toggleMenu`: Function to toggle the menu visibility.
 */
export function usePopup() {
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [openMenu, { toggle: toggleMenu }] = useToggle(false);

    useClickAway(() => toggleMenu(), [menuButtonRef, menuRef]);

    return {
        menuButtonRef,
        menuRef,
        openMenu,
        toggleMenu
    };
}

/**
 * Custom useEffect hook that ensures the effect is only called once per dependency change.
 * 
 * @param {EffectCallback} effect - The effect function to run.
 * @param {DependencyList} deps - The dependency list.
 */
export function useEffectOnce(effect: EffectCallback, deps: DependencyList = []) {
    const effectCalled = useRef(false);
    const prevDeps = useRef<DependencyList>(deps);

    useEffect(() => {
        const depsChanged = !deps.every((dep, i) => dep === prevDeps.current[i]);
        if (depsChanged) {
            effectCalled.current = false;
            prevDeps.current = deps;
        }

        if (effectCalled.current) return;
        effectCalled.current = true;

        return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

/**
 * Hook to track the current viewport width.
 * Updates dynamically when the window is resized.
 * 
 * @returns {number} The current viewport width in pixels.
 */
export function useViewPort() {
    const [viewPortWidth, setViewPortWidth] = useState(0);

    useEffect(() => {
        const handleResize = () => {
            setViewPortWidth(window.innerWidth);
        };

        handleResize();

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return viewPortWidth;
}
