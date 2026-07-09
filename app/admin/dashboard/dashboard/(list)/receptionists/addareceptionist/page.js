'use client';

import { useActionState, useState } from "react";
import { Check, Info, } from "lucide-react";
import { useRouter } from "next/navigation";
import ReceptionistImageUpload from "@/components/ReceptionistImageUpload";

//Server-Action
import { receptionistFormsubmissionAction } from "@/app/actions/receptionistFormsubmissionAction";

const initialState = {
  message: "",
  fieldErrors: {
    name: "",
    email: "",
    phone: "",
    receptionists_id: "",
    gender: "",
    shift: "",
    profileImage: "",
    isActive: "",
  },
  values: {
    name: "",
    email: "",
    phone: "",
    receptionists_id: "",
    gender: "",
    shift: "",
    profileImage: "",
    isActive: "on",
  },
};

export default function AddReceptionist() {
  const [state, formAction, pending] = useActionState(
    receptionistFormsubmissionAction,
    initialState
  );
  const [isActive, setIsActive] = useState(state.values.isActive);

  const handleTitleKeyDown = (e) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "Enter" || e.key === "NumpadEnter")
    ) {
      e.preventDefault();
      e.currentTarget.form.requestSubmit();
    }
  };

  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const [selectedShift, setSelectedShift] = useState(state.values.shift);

  return (
    <main className="flex-1 overflow-x-hidden bg-background text-gray-900 dark:text-gray-100">
      {/* Form Content */}
      <div className="px-6 py-8 lg:px-10 w-full max-w-[1400px] mx-auto">
        {/* Header & Breadcrumbs */}
        <div className="mb-10">
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span>Admin</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Receptionists</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-[#137fec] font-semibold">New</span>
          </nav>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Add New Receptionist
          </h2>
        </div>

        <form className="space-y-8" action={formAction} onKeyDown={handleTitleKeyDown}>
          {/* Section: Personal Profile */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
              <svg className="w-6 h-6 text-[#137fec]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Personal Profile</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Image Upload */}
              <ReceptionistImageUpload 
                disabled={pending}
                initialImageUrl={state.values.profileImage}
                error={state.fieldErrors.profileImage}
              />

              {/* Personal Information */}
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Full Name</label>
                  <input
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#137fec]/20 focus:bg-white dark:focus:bg-gray-600 transition-all"
                    name="name"
                    type="text"
                    disabled={pending}
                    placeholder="Dr. John Doe"
                    defaultValue={state.values.name}
                    required
                  />
                  {state.fieldErrors.name && (
                    <p className="text-red-500 text-sm">{state.fieldErrors.name}</p>
                  )}
                </div>
                {/* Gender */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Gender
                  </label>

                  <div className="flex gap-4">

                    {/* Male */}
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        required
                        value="Male"
                        defaultChecked={state.values.gender === "Male"}
                        className="hidden peer"
                      />

                      <div className="py-3 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2 peer-checked:bg-[#137fec] peer-checked:text-white transition-all">
                        <svg
                          className="w-5 h-5"
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

                        <span className="font-bold">Male</span>
                      </div>
                    </label>

                    {/* Female */}
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="gender" 
                        value="Female"
                        defaultChecked={state.values.gender === "Female"}
                        className="hidden peer"
                      />

                      <div className="py-3 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2 peer-checked:bg-[#137fec] peer-checked:text-white transition-all">
                        <svg
                          className="w-5 h-5"
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

                        <span className="font-bold">Female</span>
                      </div>
                    </label>

                    {/* Other */}
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="Other"
                        defaultChecked={state.values.gender === "Other"}
                        className="hidden peer"
                      />

                      <div className="py-3 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2 peer-checked:bg-[#137fec] peer-checked:text-white transition-all">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>

                        <span className="font-bold">Other</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Account Credentials */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
              <svg className="w-6 h-6 text-[#137fec]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Account Credentials</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Address</label>
                <input
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#137fec]/20 focus:bg-white dark:focus:bg-gray-600 transition-all"
                  type="email"
                  name="email"
                  disabled={pending}
                  placeholder="eleanor.v@sanctuary.hospital"
                  defaultValue={state.values.email}
                  required
                />
                {state.fieldErrors.email && (
                  <p className="text-red-500 text-sm">{state.fieldErrors.email}</p>
                )}
              </div>
              {/* Phone Number */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Phone Number</label>
                <input
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#137fec]/20 focus:bg-white dark:focus:bg-gray-600 transition-all"
                  type="tel"
                  name="phone"
                  disabled={pending}
                  placeholder="01XXX-XXXXXX"
                  defaultValue={state.values.phone}
                  required
                />
                {state.fieldErrors.phone && (
                  <p className="text-red-500 text-sm">{state.fieldErrors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Operational Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
              <svg className="w-6 h-6 text-[#137fec]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Operational Details</h3>
            </div>
            {/* Receptionist ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Receptionist ID</label>
                  <input
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-sm font-mono text-[#137fec] font-semibold"
                    type="text"
                    name="receptionists_id"
                    disabled={pending}
                    placeholder="REC-001"
                    defaultValue={state.values.receptionists_id}
                    required
                  />
                  {state.fieldErrors.receptionists_id && (
                    <p className="text-red-500 text-sm">{state.fieldErrors.receptionists_id}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">Auto-generated unique identifier.</p>
                </div>
                {/* Account Status */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Account Status</label>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white">Active Profile</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Enable account active status to sign in and use reception tools
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        name="isActive"
                        type="checkbox"
                        defaultChecked={state.values.isActive === "on"}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Shift Assignment</label>
                <div className="space-y-3">
                  <label className="flex items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all has-[:checked]:border-[#137fec] has-[:checked]:bg-[#137fec]/5">
                    <input
                      className="w-5 h-5 accent-[#137fec] border-gray-300 dark:border-gray-600"
                      name="shift"
                      type="radio"
                      required
                      value="Morning"
                      defaultChecked={state.values.shift === "Morning"}
                      onChange={(e) => setSelectedShift(e.target.value)}
                    />
                    <div className="ml-4 flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white">Morning Shift</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">06:00 AM - 02:00 PM</span>
                    </div>
                    <svg className="w-6 h-6 ml-auto text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </label>
                  <label className="flex items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all has-[:checked]:border-[#137fec] has-[:checked]:bg-[#137fec]/5">
                    <input
                      className="w-5 h-5 accent-[#137fec] border-gray-300 dark:border-gray-600"
                      name="shift"
                      type="radio"
                      value="Evening"
                      defaultChecked={state.values.shift === "Evening"}
                      onChange={(e) => setSelectedShift(e.target.value)}
                    />
                    <div className="ml-4 flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white">Evening Shift</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">02:00 PM - 10:00 PM</span>
                    </div>
                    <svg className="w-6 h-6 ml-auto text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </label>
                  <label className="flex items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all has-[:checked]:border-[#137fec] has-[:checked]:bg-[#137fec]/5">
                    <input
                      className="w-5 h-5 accent-[#137fec] border-gray-300 dark:border-gray-600"
                      name="shift"
                      type="radio"
                      value="Night"
                      defaultChecked={state.values.shift === "Night"}
                      // checked={selectedShift === 'night'}
                      onChange={(e) => setSelectedShift(e.target.value)}
                    />
                    <div className="ml-4 flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white">Night Shift</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">10:00 PM - 06:00 AM</span>
                    </div>
                    <svg className="w-6 h-6 ml-auto text-[#137fec]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </label>
                </div>
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
                onClick={handleBack}
                disabled={pending}
                className="cursor-pointer rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={pending}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
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