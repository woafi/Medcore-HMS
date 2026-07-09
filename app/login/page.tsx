"use client";

import { useActionState, type KeyboardEvent } from "react";
import { AlertCircle } from "lucide-react";

import { loginAction, type LoginState } from "@/app/actions/loginAction";
import PasswordInput from "@/components/PasswordInput";
import SubmitButton from "@/components/SubmitButton";
import FormInput from "@/components/FormInput";

const initialState: LoginState = {
  message: "",
  fieldErrors: { phone: "", password: "" },
  values: { phone: "", password: "" },
};

const demoAccounts = [
  { role: "Admin", phone: "01700000000", password: "Admin@123" },
  { role: "Doctor", phone: "01810000013", password: "Doctor@123" },
  { role: "Receptionist", phone: "01920000009", password: "Reception@123" },
] as const;

export default function Login() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState
  );

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "Enter" || e.key === "NumpadEnter")
    ) {
      e.preventDefault();
      e.currentTarget.requestSubmit();
    }
  };

  return (
    <div className="flex min-h-dvh w-full bg-gray-50 font-sans text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      {/* Left Side: Hero / Brand Image */}
      <div className="relative hidden overflow-hidden bg-cover bg-center lg:flex lg:w-1/2" style={{ backgroundImage: "url('/loginPageImage.png')" }}>
        <div className="absolute inset-0 z-0 bg-slate-950/35 backdrop-blur-[2px]" />
        <div className="relative z-10 w-full flex flex-col justify-center px-16 text-gray-900 dark:text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined select-none">medical_services</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">MedCore HMS</span>
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-6 text-white">
            Your Health <br />
            <span className="text-blue-600">Secured</span>
          </h1>
          <div className="mt-12 flex items-center gap-4 bg-white/50 dark:bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/50 w-fit">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                D1
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                D2
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                +50
              </div>
            </div>
            <span className="text-sm font-medium">Trusted by leading medical professionals</span>
          </div>
        </div>
      </div>

      {/* Right Side: Authentication Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">

          {/* Error */}
          {state.message && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                {state.message}
              </p>
            </div>
          )}

          {/* form Input */}
          <form action={formAction} onKeyDown={handleTitleKeyDown} className="space-y-6">
            {/* Telephone number Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <FormInput
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="01XXX-XXXXXX"
                  defaultValue={state.values.phone}
                  disabled={pending}
                  error={Boolean(state.fieldErrors.phone)}
                />
              </div>
              {state.fieldErrors.phone && (
                <p className="mt-1.5 text-sm text-red-500">
                  {state.fieldErrors.phone}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <PasswordInput
                placeholder="••••••••"
                error={state.fieldErrors.password}
                name="password"
                disabled={pending}
                defaultValue={state.values.password}
                required
              />
            </div>

            <SubmitButton />
          </form>

          <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50/80 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
            <h2 className="text-sm font-bold text-blue-900 dark:text-blue-200">
              Demo Accounts
            </h2>
            <div className="mt-3 space-y-3">
              {demoAccounts.map((account) => (
                <div
                  key={account.role}
                  className="rounded-lg border border-white/80 bg-white/80 p-3 text-sm shadow-sm dark:border-blue-900/50 dark:bg-gray-900/60"
                >
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {account.role} Account
                  </div>
                  <div className="mt-2 grid gap-1 text-gray-600 dark:text-gray-300">
                    <p>
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        Phone:
                      </span>{" "}
                      {account.phone}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        Password:
                      </span>{" "}
                      {account.password}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
