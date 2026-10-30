"use client";

import { useActionState, useState, useTransition, type KeyboardEvent } from "react";
import { AlertCircle } from "lucide-react";

import { loginAction, demoLoginAction, type LoginState } from "@/app/actions/loginAction";
import PasswordInput from "@/components/PasswordInput";
import SubmitButton from "@/components/SubmitButton";
import FormInput from "@/components/FormInput";

const initialState: LoginState = {
  message: "",
  fieldErrors: { phone: "", password: "" },
  values: { phone: "", password: "" },
};

export default function Login() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState
  );

  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [demoError, setDemoError] = useState("");
  const [, startTransition] = useTransition();

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "Enter" || e.key === "NumpadEnter")
    ) {
      e.preventDefault();
      e.currentTarget.requestSubmit();
    }
  };

  const handleDemoLogin = (role: string) => {
    setDemoError("");
    setDemoLoading(role);
    startTransition(async () => {
      const result = await demoLoginAction(role);
      if (result && !result.success) {
        setDemoError(result.message);
        setDemoLoading(null);
      }
    });
  };

  return (
    <div className="flex min-h-dvh w-full bg-gray-50 font-sans text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      {/* Left Side: Hero / Brand Image */}
      <div
        className="relative hidden overflow-hidden bg-cover bg-center lg:flex lg:w-1/2"
        style={{ backgroundImage: "url('/loginPageImage.png')" }}
      >
        <div className="absolute inset-0 z-0 bg-slate-950/35 backdrop-blur-[2px]" />
        <div className="relative z-10 w-full flex flex-col justify-center px-16 text-gray-900 dark:text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined select-none">
                medical_services
              </span>
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
            <span className="text-sm font-medium">
              Trusted by leading medical professionals
            </span>
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

          {/* Form Input */}
          <form
            action={formAction}
            onKeyDown={handleTitleKeyDown}
            className="space-y-6"
          >
            {/* Telephone number Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <FormInput
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="01XXX-XXXXXX"
                  defaultValue={state.values.phone}
                  disabled={pending || demoLoading !== null}
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
                disabled={pending || demoLoading !== null}
                defaultValue={state.values.password}
                required
              />
            </div>

            <SubmitButton />
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200">
                Quick Demo Access
              </h2>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                1-Click Login • No password needed
              </span>
            </div>

            {demoError && (
              <p className="mb-3 text-xs text-red-600 dark:text-red-400 font-medium">
                {demoError}
              </p>
            )}

            <div className="grid grid-cols-1 gap-2.5">
              {/* Demo Admin */}
              <button
                type="button"
                onClick={() => handleDemoLogin("ADMIN")}
                disabled={demoLoading !== null || pending}
                className="group flex flex-col items-center justify-center p-3 rounded-lg border border-blue-200 bg-white hover:bg-blue-600 hover:text-white dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-blue-600 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 font-bold text-sm text-gray-800 group-hover:text-white dark:text-gray-100">
                  <svg
                    className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span>Admin</span>
                </div>
                <span className="text-[11px] text-gray-500 group-hover:text-blue-100 dark:text-gray-400 mt-0.5">
                  {demoLoading === "ADMIN" ? (
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Logging in...
                    </span>
                  ) : (
                    "Demo Admin"
                  )}
                </span>
              </button>

              {/* Demo Doctor */}
              <button
                type="button"
                onClick={() => handleDemoLogin("DOCTOR")}
                disabled={demoLoading !== null || pending}
                className="group flex flex-col items-center justify-center p-3 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-600 hover:text-white dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-emerald-600 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 font-bold text-sm text-gray-800 group-hover:text-white dark:text-gray-100">
                  <svg
                    className="w-4 h-4 text-emerald-600 group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>Doctor</span>
                </div>
                <span className="text-[11px] text-gray-500 group-hover:text-emerald-100 dark:text-gray-400 mt-0.5">
                  {demoLoading === "DOCTOR" ? (
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Logging in...
                    </span>
                  ) : (
                    "Demo Doctor"
                  )}
                </span>
              </button>

              {/* Demo Receptionist */}
              <button
                type="button"
                onClick={() => handleDemoLogin("RECEPTIONIST")}
                disabled={demoLoading !== null || pending}
                className="group flex flex-col items-center justify-center p-3 rounded-lg border border-purple-200 bg-white hover:bg-purple-600 hover:text-white dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-purple-600 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 font-bold text-sm text-gray-800 group-hover:text-white dark:text-gray-100">
                  <svg
                    className="w-4 h-4 text-purple-600 group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Receptionist</span>
                </div>
                <span className="text-[11px] text-gray-500 group-hover:text-purple-100 dark:text-gray-400 mt-0.5">
                  {demoLoading === "RECEPTIONIST" ? (
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Logging in...
                    </span>
                  ) : (
                    "Demo Receptionist"
                  )}
                </span>
              </button>

              {/* Demo Patient */}
              <button
                type="button"
                onClick={() => handleDemoLogin("PATIENT")}
                disabled={demoLoading !== null || pending}
                className="group flex flex-col items-center justify-center p-3 rounded-lg border border-amber-200 bg-white hover:bg-amber-600 hover:text-white dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-amber-600 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 font-bold text-sm text-gray-800 group-hover:text-white dark:text-gray-100">
                  <svg
                    className="w-4 h-4 text-amber-600 group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>Patient</span>
                </div>
                <span className="text-[11px] text-gray-500 group-hover:text-amber-100 dark:text-gray-400 mt-0.5">
                  {demoLoading === "PATIENT" ? (
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Logging in...
                    </span>
                  ) : (
                    "Demo Patient"
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
