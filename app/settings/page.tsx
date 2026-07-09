"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useMounted() {
    return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

export default function SettingPage() {
    const { setTheme, resolvedTheme } = useTheme();
    const mounted = useMounted();
    const isDark = mounted && resolvedTheme === "dark";

    return (
        <section className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
                    Settings
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Manage workspace preferences and display options.
                </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-foreground p-6 shadow-sm dark:border-slate-800">
                <h2 className="mb-6 text-base font-semibold text-gray-950 dark:text-white">
                    Appearance
                </h2>

                <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-foregd p-5 dark:border-slate-800">
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">
                            Dark Mode
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Toggle between light and dark themes
                        </p>
                    </div>

                    <button
                        type="button"
                        aria-label="Toggle theme"
                        onClick={() => setTheme(isDark ? "light" : "dark")}
                        className={`relative inline-flex h-9 w-16 items-center rounded-full shadow-inner ${
                            isDark ? "bg-primary" : "bg-gray-300"
                        }`}
                    >
                        <span
                            className={`inline-flex cursor-pointer h-7 w-7 items-center justify-center rounded-full bg-white text-[8px] font-bold text-gray-700 shadow-lg transition-transform ${
                                isDark ? "translate-x-8" : "translate-x-1"
                            }`}
                        >
                            
                        </span>
                    </button>
                </div>
            </div>
        </section>
    );
}
