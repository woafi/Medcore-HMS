"use client";

import { useActionState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  Pencil,
  Phone,
  Save,
  ShieldPlus,
  UserRound,
  X,
} from "lucide-react";
import { patientEditFormsubmissionAction } from "@/app/actions/patientEditFormsubmissionAction";
import PatientImageUpload from "@/components/PatientImageUpload";
import { buildEditPatientInitialState } from "@/lib/patientFormHelpers";
import {
  bloodGroups,
  Field,
  inputClassName,
  SectionTitle,
} from "@/components/patient/PatientFormUI";

// ---------------------------------------------------------------------------
// Footer submit button for the edit-patient modal
// ---------------------------------------------------------------------------

function EditSubmitButton({ pending, success }) {
  return (
    <button
      type="submit"
      disabled={pending || success}
      className={`cursor-pointer inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all disabled:cursor-not-allowed ${
        success
          ? "bg-emerald-500 shadow-emerald-500/25"
          : "bg-blue-600 shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-60"
      }`}
    >
      {success ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
      {pending ? "Saving..." : success ? "Saved" : "Save Changes"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Edit patient modal — form body mirrors Register New Patient layout
// ---------------------------------------------------------------------------

export default function EditPatientModal({ patient, onClose }) {
  const params = useParams();
  const router = useRouter();
  const receptionistId = Array.isArray(params?.receptionistId)
    ? params.receptionistId[0]
    : params?.receptionistId || "";

  const [state, formAction, pending] = useActionState(
    patientEditFormsubmissionAction,
    buildEditPatientInitialState(patient)
  );

  const handleTitleKeyDown = (e) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "Enter" || e.key === "NumpadEnter")
    ) {
      e.preventDefault();
      e.currentTarget.form.requestSubmit();
    }
  };

  // Refresh the patient list and close after a successful save
  useEffect(() => {
    if (!state.success) return undefined;

    router.refresh();
    const timeout = window.setTimeout(() => {
      onClose?.();
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [state.success]);

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close edit patient modal"
        className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <form
          action={formAction}
          onKeyDown={handleTitleKeyDown}
          className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-background shadow-2xl dark:border-gray-800"
        >
          <input type="hidden" name="id" value={patient.id} />
          <input type="hidden" name="receptionistId" value={receptionistId} />

          {/* Modal header */}
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                <Pencil className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold leading-none tracking-tight text-gray-900 dark:text-white">
                  Edit Patient Details
                </h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Patient ID:{" "}
                  <span className="font-mono font-semibold">{patient.patientId}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6">
            {/* Status banner */}
            {state.message ? (
              <div
                className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
                  state.success
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                    : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300"
                }`}
              >
                {state.success ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span className="font-semibold">{state.message}</span>
              </div>
            ) : null}

            {/* Personal information */}
            <section>
              <SectionTitle icon={UserRound} title="Personal Information" />
              <div className="flex flex-col gap-6 md:flex-row">
                <PatientImageUpload
                  disabled={pending || state.success}
                  initialImageUrl={state.values.profileImage}
                  error={state.fieldErrors.profileImage}
                />

                <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Full Name" error={state.fieldErrors.fullname}>
                      <input
                        name="fullname"
                        type="text"
                        className={inputClassName}
                        placeholder="e.g. Amina Rahman"
                        defaultValue={state.values.fullname}
                        disabled={pending || state.success}
                        required
                      />
                    </Field>
                  </div>
                  <Field label="Gender" error={state.fieldErrors.gender}>
                    <select
                      name="gender"
                      className={inputClassName}
                      defaultValue={state.values.gender}
                      disabled={pending || state.success}
                      required
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>
                  <Field label="Date of Birth" error={state.fieldErrors.dateOfBirth}>
                    <input
                      name="dateOfBirth"
                      type="date"
                      className={inputClassName}
                      defaultValue={state.values.dateOfBirth}
                      disabled={pending || state.success}
                    />
                  </Field>
                </div>
              </div>
            </section>

            {/* Contact details */}
            <section>
              <SectionTitle icon={Mail} title="Contact Details" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Phone Number" error={state.fieldErrors.phone}>
                  <input
                    name="phone"
                    type="tel"
                    className={inputClassName}
                    placeholder="01XXX-XXXXXX"
                    defaultValue={state.values.phone}
                    disabled={pending || state.success}
                    required
                  />
                </Field>
                <Field label="Email Address" error={state.fieldErrors.email}>
                  <input
                    name="email"
                    type="email"
                    className={inputClassName}
                    placeholder="patient@example.com"
                    defaultValue={state.values.email}
                    disabled={pending || state.success}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Residential Address" error={state.fieldErrors.address}>
                    <input
                      name="address"
                      type="text"
                      className={inputClassName}
                      placeholder="Street, city, district"
                      defaultValue={state.values.address}
                      disabled={pending || state.success}
                    />
                  </Field>
                </div>
              </div>
            </section>

            {/* Emergency contact */}
            <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-800/30 dark:bg-amber-900/10">
              <SectionTitle icon={Phone} title="Emergency Contact" tone="amber" />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Full Name" error={state.fieldErrors.emergencyName}>
                  <input
                    name="emergencyName"
                    type="text"
                    className={`${inputClassName} bg-white dark:bg-gray-800`}
                    placeholder="Relative's name"
                    defaultValue={state.values.emergencyName}
                    disabled={pending || state.success}
                  />
                </Field>
                <Field label="Relationship" error={state.fieldErrors.relationship}>
                  <input
                    name="relationship"
                    type="text"
                    className={`${inputClassName} bg-white dark:bg-gray-800`}
                    placeholder="e.g. Spouse"
                    defaultValue={state.values.relationship}
                    disabled={pending || state.success}
                  />
                </Field>
                <Field label="Emergency Phone" error={state.fieldErrors.emergencyPhone}>
                  <input
                    name="emergencyPhone"
                    type="tel"
                    className={`${inputClassName} bg-white dark:bg-gray-800`}
                    placeholder="+880 17XX-XXXXXX"
                    defaultValue={state.values.emergencyPhone}
                    disabled={pending || state.success}
                  />
                </Field>
              </div>
            </section>

            {/* Medical snapshot */}
            <section>
              <SectionTitle icon={ShieldPlus} title="Medical Snapshot" tone="red" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Blood Group" error={state.fieldErrors.bloodGroup}>
                  <select
                    name="bloodGroup"
                    className={inputClassName}
                    defaultValue={state.values.bloodGroup}
                    disabled={pending || state.success}
                    required
                  >
                    {bloodGroups.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Age" error={state.fieldErrors.age}>
                  <input
                    name="age"
                    type="number"
                    min={0}
                    max={150}
                    className={`${inputClassName} appearance-none pl-8 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                    placeholder="Years"
                    defaultValue={state.values.age}
                    disabled={pending || state.success}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Known Allergies" error={state.fieldErrors.allergies}>
                    <textarea
                      name="allergies"
                      rows={2}
                      className={`${inputClassName} resize-none`}
                      placeholder="Medication or environmental allergies"
                      defaultValue={state.values.allergies}
                      disabled={pending || state.success}
                    />
                  </Field>
                </div>
              </div>
            </section>
          </div>

          {/* Modal footer */}
          <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/40">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <EditSubmitButton pending={pending} success={state.success} />
          </footer>
        </form>
      </div>
    </>
  );
}
