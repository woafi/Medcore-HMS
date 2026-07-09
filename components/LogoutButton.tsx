"use client"

import { logoutAction } from "@/app/actions/logoutAction"
import { useFormStatus } from "react-dom"
import { LogOut } from 'lucide-react';


function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className={`cursor-pointer flex items-center justify-center gap-2 w-full p-3 rounded-lg transition-all
            ${pending
                ? "bg-red-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-800 active:scale-95"
            } text-white`}
        >
            {pending ? (
                <>
                    {/* Spinner */}
                    <svg
                        className="w-5 h-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                        />
                    </svg>
                    <span className="hidden lg:block">Logging out...</span>
                </>
            ) : (
                <>
                    {/* Logout Icon */}
                    <LogOut />

                    <span className="hidden lg:block font-medium">
                        Logout
                    </span>
                </>
            )}
        </button>
    );
}

const LogoutButton = () => {
    return (
        <form action={logoutAction}>
            <SubmitButton />
        </form>
    );
};

export default LogoutButton;