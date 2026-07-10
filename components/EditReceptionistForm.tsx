"use client";

import { useActionState, useState } from "react";
import { Check, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import ReceptionistImageUpload from "@/components/ReceptionistImageUpload";
import { receptionistEditFormsubmissionAction } from "@/app/actions/receptionistFormsubmissionAction";

export default function EditReceptionistForm({ receptionistId, initialState }) {
  const [state, formAction, pending] = useActionState(
    receptionistEditFormsubmissionAction,
    initialState
  );
  const [isActive, setIsActive] = useState(
    state.values.isActive === true || state.values.isActive === "on"
  );
  const [selectedShift, setSelectedShift] = useState(state.values.shift);
  const router = useRouter();

  const handleTitleKeyDown = (e) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "Enter" || e.key === "NumpadEnter")
    ) {
      e.preventDefault();
      e.currentTarget.requestSubmit();
    }
  };

  return (
    <main className="flex-1 overflow-x-hidden bg-background text-gray-900 dark:text-gray-100">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
        <div className="mb-10">
          <nav className="mb-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Admin</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Receptionists</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-semibold text-[#137fec]">Edit</span>
          </nav>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Edit Receptionist
          </h2>
        </div>

        <form className="space-y-8" action={formAction} onKeyDown={handleTitleKeyDown}>
          <input type="hidden" name="id" value={receptionistId} />

          {state.message ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              {state.message}
            </div>
          ) : null}

          <div className="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-800">
            <div className="mb-8 flex items-center gap-4 border-b border-gray-200 pb-4 dark:border-gray-700">
              <svg className="h-6 w-6 text-[#137fec]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Personal Profile
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <ReceptionistImageUpload
                disabled={pending}
                initialImageUrl={state.values.profileImage}
                error={state.fieldErrors.profileImage}
              />

              <div className="space-y-6 md:col-span-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <input
                    className="w-full rounded-lg border-none bg-gray-100 px-4 py-3 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-[#137fec]/20 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-gray-700 dark:focus:bg-gray-600"
                    name="name"
                    type="text"
                    disabled={pending}
                    placeholder="Full Name"
                    defaultValue={state.values.name}
                    required
                  />
                  {state.fieldErrors.name ? (
                    <p className="text-sm text-red-500">{state.fieldErrors.name}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Gender
                  </label>
                  <div className="flex gap-4">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        required
                        value="Male"
                        defaultChecked={state.values.gender === "Male"}
                        disabled={pending}
                        className="hidden peer"
                      />
                      <div className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-gray-600 transition-all peer-checked:bg-[#137fec] peer-checked:text-white dark:bg-gray-700 dark:text-gray-400">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-bold">Male</span>
                      </div>
                    </label>

                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="Female"
                        defaultChecked={state.values.gender === "Female"}
                        disabled={pending}
                        className="hidden peer"
                      />
                      <div className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-gray-600 transition-all peer-checked:bg-[#137fec] peer-checked:text-white dark:bg-gray-700 dark:text-gray-400">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-bold">Female</span>
                      </div>
                    </label>

                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="Other"
                        defaultChecked={state.values.gender === "Other"}
                        disabled={pending}
                        className="hidden peer"
                      />
                      <div className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-gray-600 transition-all peer-checked:bg-[#137fec] peer-checked:text-white dark:bg-gray-700 dark:text-gray-400">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-bold">Other</span>
                      </div>
                    </label>
                  </div>
                  {state.fieldErrors.gender ? (
                    <p className="text-sm text-red-500">{state.fieldErrors.gender}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-800">
            <div className="mb-8 flex items-center gap-4 border-b border-gray-200 pb-4 dark:border-gray-700">
              <svg className="h-6 w-6 text-[#137fec]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Account Credentials
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <input
                  className="w-full rounded-lg border-none bg-gray-100 px-4 py-3 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-[#137fec]/20 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-gray-700 dark:focus:bg-gray-600"
                  type="email"
                  name="email"
                  disabled={pending}
                  placeholder="eleanor.v@sanctuary.hospital"
                  defaultValue={state.values.email}
                  required
                />
                {state.fieldErrors.email ? (
                  <p className="text-sm text-red-500">{state.fieldErrors.email}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <input
                  className="w-full rounded-lg border-none bg-gray-100 px-4 py-3 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-[#137fec]/20 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-gray-700 dark:focus:bg-gray-600"
                  type="tel"
                  name="phone"
                  disabled={pending}
                  placeholder="01XXXXXXXXX"
                  defaultValue={state.values.phone}
                  required
                />
                {state.fieldErrors.phone ? (
                  <p className="text-sm text-red-500">{state.fieldErrors.phone}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-800">
            <div className="mb-8 flex items-center gap-4 border-b border-gray-200 pb-4 dark:border-gray-700">
              <svg className="h-6 w-6 text-[#137fec]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Operational Details
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Receptionist ID
                  </label>
                  <input
                    className="w-full rounded-lg border-none bg-gray-100 px-4 py-3 font-mono text-sm font-semibold text-[#137fec] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-gray-700"
                    type="text"
                    name="receptionists_id"
                    disabled={pending}
                    placeholder="REC-001"
                    defaultValue={state.values.receptionists_id}
                    required
                  />
                  {state.fieldErrors.receptionists_id ? (
                    <p className="text-sm text-red-500">
                      {state.fieldErrors.receptionists_id}
                    </p>
                  ) : null}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Unique receptionist identifier.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Account Status
                  </label>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-700/30">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white">
                        Active Profile
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Enable account active status to sign in and use reception tools
                      </span>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="hidden" name="isActive" value={isActive ? "on" : "off"} />
                      <input
                        type="checkbox"
                        checked={isActive}
                        disabled={pending}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="h-6 w-11 rounded-full bg-gray-300 peer peer-checked:bg-green-500 peer-focus:outline-none after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-gray-600"></div>
                    </label>
                  </div>
                  {state.fieldErrors.isActive ? (
                    <p className="text-sm text-red-500">{state.fieldErrors.isActive}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Shift Assignment
                </label>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center rounded-lg border-2 border-transparent bg-gray-50 p-4 transition-all has-[:checked]:border-[#137fec] has-[:checked]:bg-[#137fec]/5 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700">
                    <input
                      className="h-5 w-5 accent-[#137fec]"
                      name="shift"
                      type="radio"
                      required
                      value="Morning"
                      checked={selectedShift === "Morning"}
                      disabled={pending}
                      onChange={(e) => setSelectedShift(e.target.value)}
                    />
                    <div className="ml-4 flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white">Morning Shift</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">06:00 AM - 02:00 PM</span>
                    </div>
                    <svg className="ml-auto h-6 w-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </label>

                  <label className="flex cursor-pointer items-center rounded-lg border-2 border-transparent bg-gray-50 p-4 transition-all has-[:checked]:border-[#137fec] has-[:checked]:bg-[#137fec]/5 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700">
                    <input
                      className="h-5 w-5 accent-[#137fec]"
                      name="shift"
                      type="radio"
                      value="Evening"
                      checked={selectedShift === "Evening"}
                      disabled={pending}
                      onChange={(e) => setSelectedShift(e.target.value)}
                    />
                    <div className="ml-4 flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white">Evening Shift</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">02:00 PM - 10:00 PM</span>
                    </div>
                    <svg className="ml-auto h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </label>

                  <label className="flex cursor-pointer items-center rounded-lg border-2 border-transparent bg-gray-50 p-4 transition-all has-[:checked]:border-[#137fec] has-[:checked]:bg-[#137fec]/5 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700">
                    <input
                      className="h-5 w-5 accent-[#137fec]"
                      name="shift"
                      type="radio"
                      value="Night"
                      checked={selectedShift === "Night"}
                      disabled={pending}
                      onChange={(e) => setSelectedShift(e.target.value)}
                    />
                    <div className="ml-4 flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white">Night Shift</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">10:00 PM - 06:00 AM</span>
                    </div>
                    <svg className="ml-auto h-6 w-6 text-[#137fec]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </label>
                </div>
                {state.fieldErrors.shift ? (
                  <p className="text-sm text-red-500">{state.fieldErrors.shift}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-20 mt-2 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white/95 px-6 py-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:border-gray-700 dark:bg-gray-800/95">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Info className="h-4 w-4" />
              <span>Unsaved changes detected.</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={pending}
                className="cursor-pointer rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={pending}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {pending ? "Saving..." : "Save receptionist"}
                <Check className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
