"use client";
import { ROUTES } from "@/app/utils/data";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SettingsLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const currentPath = usePathname();
    const checkPath = (path: string) => currentPath.includes(path);
    
    return (
        <div className="h-[calc(100dvh-123px)] flex">
            <section className="min-w-[336px] w-[12%] h-full pt-5 pr-5 border-r border-dark-200 flex flex-col gap-2.5">
                {navItems.map((item) => (
                    <Link 
                        key={item.name}
                        href={item.path}
                        className={`p-[15px] text-title-large border-l-2 
                            ${checkPath(item.path) 
                        ? "bg-dark-400 border-light-200 text-light-200" 
                        : "border-transparent text-light-100 hover:bg-dark-400"}`
                        }
                    >
                        {item.name}
                    </Link>
                ))}
            </section>
            {children}
        </div>
    );
}

const navItems = [
    { name: "Manage Team", path: ROUTES.SETTINGS.MANAGE_TEAM },
    { name: "Plans & Billings", path: ROUTES.SETTINGS.PLANS_AND_BILLINGS }
];
