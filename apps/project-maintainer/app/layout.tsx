"use client";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastProvider from "@devasign/shared/components/ToastProvider";
import { Suspense } from "react";
import Statsig from "./statsig";

const geistMono = Geist_Mono({
    subsets: ["latin"],
    variable: "--font-geist-mono"
});

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <title>DevAsign (Project Maintainer)</title>
                <meta name="description" content="The Open Source Project Management Tool" />
            </head>
            <body className={`${geistMono.className} antialiased`}>
                <Statsig>
                    <ToastProvider>
                        <Suspense fallback={<h1 className="text-display-small text-light-100">Loading App...</h1>}>
                            {children}
                        </Suspense>
                    </ToastProvider>
                </Statsig>
            </body>
        </html>
    );
}
