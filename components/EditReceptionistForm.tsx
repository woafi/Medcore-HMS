"use client";

import Link from "next/link";

type EditReceptionistFormProps = {
  receptionistId: string;
  initialState: {
    values: {
      name: string;
      email: string;
      phone: string;
      receptionists_id: string;
      gender: string;
      shift: string;
      isActive: boolean;
    };
  };
};

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-950";

export default function EditReceptionistForm({
  initialState,
}: EditReceptionistFormProps) {
  const values = initialState.values;

  return (
    <section className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Receptionists / Edit
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
          Edit Receptionist
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
            Receptionist ID
            <input className={inputClassName} defaultValue={values.receptionists_id} />
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Gender
            <input className={inputClassName} defaultValue={values.gender} />
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Shift
            <input className={inputClassName} defaultValue={values.shift} />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">
          <Link
            href="/admin/dashboard/receptionists"
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
