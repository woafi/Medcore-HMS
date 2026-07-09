"use client"
import { useActionState, useState } from "react";
import {
  BadgeDollarSign,
  BriefcaseMedical,
  Check,
  ChevronRight,
  Info,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import DoctorImageUpload from "@/components/DoctorImageUpload";

//Server-Action
import { doctorFormsubmissionAction } from "@/app/actions/doctorFormsubmissionAction";

const genderOptions = [
  { label: "Male", active: false },
  { label: "Female", active: false },
  { label: "Other", active: false },
];

const specializationOptions = [
  "Cardiologist",
  "Neurologist",
  "Dermatologist",
  "Orthopedic",
  "Pediatrician",
  "Psychiatrist",
  "Dentist",
  "ENT Specialist",
  "General Physician",
  "Gynecologist",
];

function SectionCard({ icon: Icon, iconClassName, title, children, muted = false }) {
  return (
    <section
      className={`rounded-2xl border p-6 shadow-sm lg:p-8 ${muted
        ? "border-blue-100 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20"
        : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
        }`}
    >
      <div className="mb-8 flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClassName ??
            "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function FormField({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : null}
    </div>
  );
}

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:bg-gray-950 dark:focus:ring-blue-900/40";

const intialState = {
  message: "",
  fieldErrors: {
    name: "",
    email: "",
    phone: "",
    doctor_id: "",
    room: "",
    gender: "",
    specialization: "",
    qualification: "",
    bio: "",
    profileImage: "",
    consultationFee: "",
    isActive: "",
  },
  values: {
    name: "",
    email: "",
    phone: "",
    doctor_id: "",
    room: "",
    gender: "",
    specialization: "",
    qualification: "",
    bio: "",
    profileImage: "",
    consultationFee: "",
    isActive: true,
  },
}

export default function AddDoctorPage() {
  const [state, formAction, pending] = useActionState(
    doctorFormsubmissionAction,
    intialState
  )
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

  //for cancel editing
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex flex-1 flex-col overflow-x-hidden bg-background text-gray-900 dark:text-gray-100">
      <main className="flex-1 overflow-y-auto relative">

        <form
          action={formAction}
          onKeyDown={handleTitleKeyDown}
          className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-6 py-8 lg:px-10"
        >
          {/* Form Text Title */}
          <div className="space-y-3">
            <nav className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              <span>Doctors</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-blue-600 dark:text-blue-400">Add New Doctor</span>
            </nav>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                Register New Doctor
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Add a new medical professional to the hospital directory with their
                identity, credentials, department assignment, and consultation details.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 space-y-6 lg:col-span-8">

              <SectionCard
                icon={UserRound}
                title="Personal Details"
                iconClassName="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                >
                <div className="flex flex-col gap-8 md:flex-row">
                {/* Image upload */}
                  <DoctorImageUpload
                    disabled={pending}
                    initialImageUrl={state.values.profileImage}
                    error={state.fieldErrors.profileImage}
                  />

                  <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Name */}
                    <FormField
                      label="Full Name"
                      error={state.fieldErrors.name}
                    >
                      <input
                        name="name"
                        type="text"
                        className={inputClassName}
                        disabled={pending}
                        placeholder="Full Name"
                        defaultValue={state.values.name}
                        required
                      />
                    </FormField>

                    <FormField
                      label="Email Address"
                      error={state.fieldErrors.email}
                    >
                      <input
                        name="email"
                        type="email"
                        className={inputClassName}
                        disabled={pending}
                        placeholder="example@hospital.com"
                        defaultValue={state.values.email}
                        required
                      />
                    </FormField>

                    <FormField
                      label="Phone Number"
                      error={state.fieldErrors.phone}
                    >
                      <input
                        name="phone"
                        type="tel"
                        className={inputClassName}
                        disabled={pending}
                        placeholder="01XXX-XXXXXX"
                        defaultValue={state.values.phone}
                        required
                      />
                    </FormField>

                    <FormField
                      label="Doc_Id"
                      error={state.fieldErrors.doctor_id}
                    >
                      <input
                        name="doctor_id"
                        type="text"
                        className={inputClassName}
                        disabled={pending}
                        placeholder="DOC-001"
                        defaultValue={state.values.doctor_id}
                        required
                      />
                    </FormField>

                    <FormField
                      label="Room Number"
                      error={state.fieldErrors.room}
                    >
                      <input
                        name="room"
                        type="number"
                        className={`${inputClassName} appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        disabled={pending}
                        placeholder="304"
                        defaultValue={state.values.room}
                        required
                      />
                    </FormField>

                    <FormField
                      label="Gender"
                      error={state.fieldErrors.gender}
                    >
                      <select
                        required
                        defaultValue={state.values.gender}
                        name="gender"
                        disabled={pending}
                        className="flex gap-2 border px-3 py-2 rounded-lg border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white transition"
                      >
                        <option value="" className="text-xs" disabled>
                          Select
                        </option>
                        {genderOptions.map((option) => (
                          <option
                            key={option.label}
                            className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition ${option.active
                              ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                              : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                              }`}
                            value={option.label}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                icon={ShieldCheck}
                title="Professional Credentials"
                iconClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                  <FormField
                    label="Specialization"
                    error={state.fieldErrors.specialization}
                  >
                    <select
                      defaultValue={state.values.specialization}
                      name="specialization"
                      disabled={pending}
                      required
                      className={inputClassName}
                    >
                      <option value="" disabled>
                        Select Primary Area
                      </option>
                      {specializationOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Qualification"
                    error={state.fieldErrors.qualification}
                  >
                    <input
                      name="qualification"
                      type="text"
                      className={inputClassName}
                      disabled={pending}
                      placeholder="MBBS, MPhil"
                      defaultValue={state.values.qualification}
                      required
                    />
                  </FormField>

                  {/* bio  */}
                  <div className="md:col-span-2">
                    <FormField
                      label="Bio"
                      error={state.fieldErrors.bio}
                    >
                      <textarea
                        name="bio"
                        rows={4}
                        className={`${inputClassName} resize-none`}
                        disabled={pending}
                        placeholder="MD, PhD - Harvard Medical School, Residency at Mayo Clinic..."
                        defaultValue={state.values.bio}
                        required
                      />
                    </FormField>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="col-span-12 lg:col-span-4">
              <div className="sticky top-6 space-y-6">
                <SectionCard
                  icon={BadgeDollarSign}
                  title="Consultation"
                  muted
                  iconClassName="bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                >
                  <div className="space-y-6">
                    <FormField
                      label="Base Fee ($)"
                      error={state.fieldErrors.consultationFee}
                    >
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">
                          $
                        </span>
                        <input
                          name="consultationFee"
                          type="number"
                          className={`${inputClassName} pl-8 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                          disabled={pending}
                          placeholder="150.00"
                          defaultValue={state.values.consultationFee}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </FormField>

                    {/* Toggle for active */}
                    <div className="rounded-2xl border border-blue-100 bg-white p-4 dark:border-blue-900/40 dark:bg-gray-900">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            Active Status
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Available for appointments
                          </p>
                        </div>
                        <input
                          type="hidden"
                          name="isActive"
                          value={String(isActive)}
                        />
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isActive}
                          disabled={pending}
                          onClick={() => setIsActive((current) => !current)}
                          className={`flex h-6 w-11 items-center rounded-full px-1 transition ${isActive
                            ? "bg-emerald-500"
                            : "bg-gray-300 dark:bg-gray-600"
                            } disabled:cursor-not-allowed disabled:opacity-70`}
                        >
                          <span
                            className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${isActive ? "ml-auto" : ""
                              }`}
                          />
                        </button>
                      </div>
                      {state.fieldErrors.isActive ? (
                        <p className="mt-2 text-xs text-red-500">
                          {state.fieldErrors.isActive}
                        </p>
                      ) : null}
                    </div>
                  </div>

                </SectionCard>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      <BriefcaseMedical className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        Onboarding checklist
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Complete identity, credentials, and consultation setup before
                        saving the new doctor profile.
                      </p>
                    </div>
                  </div>
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
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {pending ? "Saving..." : "Save Doctor"}
                <Check className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
