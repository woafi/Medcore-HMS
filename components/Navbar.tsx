"use client";

import Link from "next/link";

import UserInfo from "./UserInfo";

export default function Navbar() {
    // Get current date in a readable format
    const getCurrentDate = () => {
        const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' } as const;
        return new Date().toLocaleDateString('en-US', options);
    };

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-foreground px-4 shadow-sm dark:border-slate-800 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex items-center gap-3 lg:hidden">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <span className="material-symbols-outlined select-none">medical_services</span>
                    </div>
                    <span className="hidden text-lg font-bold text-primary sm:block">MedCare HMS</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <span className="material-symbols-outlined text-[20px] leading-none">
                        calendar_month
                    </span>
                    <span className="text-sm font-medium">{getCurrentDate()}</span>
                </div>

                <div className="flex gap-2">
                    <Link href="/settings" className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">
                        <span className="material-symbols-outlined text-[22px] leading-none">
                            settings
                        </span>
                    </Link>
                </div>

                <UserInfo />
            </div>
        </header>
    )
}
