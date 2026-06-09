"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase";
import { ROUTES } from "@/app/utils/data";
import { FiFilePlus } from "react-icons/fi";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";

export default function NotFound() {
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const user = await getCurrentUser();
            if (!user) {
                router.push(ROUTES.AUTHENTICATE);
            }
        };

        checkUser();
    }, [router]);

    return (
        <div className="min-h-screen grid place-content-center">
            <div className="min-w-[336px] w-[10%] mx-auto">
                <FiFilePlus className="text-[44px] text-primary-400 mx-auto" />
                <h2 className="text-headline-medium text-light-100 mt-2.5 mb-6 text-center">
                    Page Not Found
                </h2>
                <ButtonPrimary
                    format="OUTLINE"
                    text="Go To Tasks Page"
                    attributes={{
                        onClick: () => router.push(ROUTES.TASKS)
                    }}
                    extendedClassName="w-fit mx-auto"
                />
            </div>
        </div>
    );
}
