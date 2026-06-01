"use client";

import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/app/utils/data";

const ExtensionSuccessPage = () => {
    const [ideLink, setIdeLink] = useState("");
    const router = useRouter();

    useEffect(() => {
        const link = localStorage.getItem("ideLink");
        if (link) {
            setIdeLink(link);
            window.location.href = link;
        } else {
            router.push(ROUTES.ACCOUNT);
        }
    }, [router]);

    return (
        <div className="sm:pt-[105px] pt-[80px]">
            <h1 className="text-display-large text-light-100">Authentication successful, continue on your IDE</h1>
            <p className="text-body-medium text-dark-100 sm:pt-[42px] pt-6 sm:pb-10 pb-8">
                You can safely close this window if your IDE has already opened.
                Else, click below to open it manually.
            </p>
            <ButtonPrimary
                format="SOLID"
                text="Open IDE"
                attributes={{
                    onClick: () => {
                        window.location.href = ideLink;
                    }
                }}
                extendedClassName="w-[150px]"
            />
        </div>
    );
};

export default ExtensionSuccessPage;
