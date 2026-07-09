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
        <div className="max-w-4xl bg-background mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-foreground rounded-2xl p-8 mb-6 shadow-xl border border-gray-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-primary mb-6">
                    Appearance
                </h2>

                <div className="flex items-center justify-between p-5 bg-foregd dark:bg-foregd rounded-xl border border-gray-300 dark:border-slate-700 shadow-xl">
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
        </div>
    );
}
