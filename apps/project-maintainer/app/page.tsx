"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getCurrentUser } from "@/lib/firebase";
import { ROUTES } from "@/app/utils/data";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const user = await getCurrentUser();
            if (user) {
                router.push(ROUTES.TASKS);
            } else {
                router.push(ROUTES.ACCOUNT);
            }
        };

        checkUser();
    }, [router]);

    return (
        <div className="min-h-screen grid place-content-center">
            <Image
                src="/davasign-logo.svg"
                alt="DevAsign Logo"
                width={0}
                height={0}
                priority
                className="h-[60px] w-auto animate-pulse mb-10"
            />
        </div>
    );
}
