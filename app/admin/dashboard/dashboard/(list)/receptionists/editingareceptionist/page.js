import Link from "next/link";
import { notFound } from "next/navigation";
import EditReceptionistForm from "@/components/EditReceptionistForm";
import prisma from "@/lib/prisma";

const emptyFieldErrors = {
  name: "",
  email: "",
  phone: "",
  receptionists_id: "",
  gender: "",
  shift: "",
  profileImage: "",
  isActive: "",
};

function toTitleCaseGender(gender) {
  if (!gender) return "";
  return gender.charAt(0) + gender.slice(1).toLowerCase();
}

function buildInitialState(receptionist) {
  return {
    message: "",
    fieldErrors: emptyFieldErrors,
    values: {
      name: receptionist.name || "",
      email: receptionist.user?.email || "",
      phone: receptionist.user?.phone || "",
      receptionists_id: receptionist.receptionists_id || "",
      gender: toTitleCaseGender(receptionist.gender),
      shift: receptionist.shift || "",
      profileImage: receptionist.profileImage || "",
      isActive: Boolean(receptionist.isActive),
    },
  };
}

export default async function EditReceptionistPage({ searchParams }) {
  const params = await searchParams;
  const receptionistId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!receptionistId) {
    return (
      <div className="flex flex-1 flex-col overflow-x-hidden bg-background text-gray-900 dark:text-gray-100">
        <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-6 py-8 lg:px-10">
          <div className="max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              Select a Receptionist to Edit
            </h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              This page needs a receptionist record id. Return to the directory and
              use the edit action beside the receptionist you want to update.
            </p>
            <Link
              href="/dashboard/receptionists"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Back to Receptionist Directory
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const receptionist = await prisma.receptionist.findUnique({
    where: { id: receptionistId },
    include: {
      user: {
        select: {
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!receptionist) {
    notFound();
  }

  return (
    <EditReceptionistForm
      receptionistId={receptionist.id}
      initialState={buildInitialState(receptionist)}
    />
  );
}
