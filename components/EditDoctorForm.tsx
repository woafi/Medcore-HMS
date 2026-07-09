"use client";

import Link from "next/link";

type EditDoctorFormProps = {
  doctorId: string;
  initialState: {
    values: {
      name: string;
      email: string;
      phone: string;
      doctor_id: string;
      room: string;
      gender: string;
      specialization: string;
      qualification: string;
      bio: string;
      consultationFee: string;
      isActive: boolean;
    };
  };
};

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-950";

export default function EditDoctorForm({ initialState }: EditDoctorFormProps) {
  const values = initialState.values;

  return (
    <section className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Doctors / Edit
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
          Edit Doctor
        </h1>
      </div>

      <form className="rounded-lg border border-gray-200 bg-foreground p-6 shadow-sm dark:border-gray-800">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Full name
            <input className={inputClassName} defaultValue={values.name} />
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
            <input className={inputClassName} defaultValue={values.email} />
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone
            <input className={inputClassName} defaultValue={values.phone} />
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Doctor ID
            <input className={inputClassName} defaultValue={values.doctor_id} />
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Room
            <input className={inputClassName} defaultValue={values.room} />
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Specialization
            <input className={inputClassName} defaultValue={values.specialization} />
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Qualification
            <input className={inputClassName} defaultValue={values.qualification} />
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Consultation fee
            <input className={inputClassName} defaultValue={values.consultationFee} />
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
            Bio
            <textarea
              className="min-h-28 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-950"
              defaultValue={values.bio}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">
          <Link
            href="/admin/dashboard/doctors"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </Link>
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </section>
  );
}
