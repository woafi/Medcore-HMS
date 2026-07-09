import Link from "next/link";
import { notFound } from "next/navigation";
import EditDoctorForm from "@/components/EditDoctorForm";
import prisma from "@/lib/prisma";

const emptyFieldErrors = {
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
};

function toTitleCaseGender(gender) {
  if (!gender) return "";
  return gender.charAt(0) + gender.slice(1).toLowerCase();
}

function buildInitialState(doctor) {
  return {
    message: "",
    fieldErrors: emptyFieldErrors,
    values: {
      name: doctor.name || "",
      email: doctor.user?.email || "",
      phone: doctor.user?.phone || "",
      doctor_id: doctor.doctor_id || "",
      room: doctor.room ? String(doctor.room) : "",
      gender: toTitleCaseGender(doctor.gender),
      specialization: doctor.specialization || "",
      qualification: doctor.qualification || "",
      bio: doctor.bio || "",
      profileImage: doctor.profileImage || "",
      consultationFee: doctor.consultationFee ? String(doctor.consultationFee) : "",
      isActive: Boolean(doctor.isActive),
    },
  };
}

export default async function EditDoctorPage({ searchParams }) {
  const params = await searchParams;
  const doctorId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!doctorId) {
    return (
      <div className="flex flex-1 flex-col overflow-x-hidden bg-background text-gray-900 dark:text-gray-100">
        <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-6 py-8 lg:px-10">
          <div className="max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              Select a Doctor to Edit
            </h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              This page needs a doctor record id. Return to the directory and use the
              edit action beside the doctor you want to update.
            </p>
            <Link
              href="/dashboard/doctors"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Back to Doctor Directory
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: {
      user: {
        select: {
          email: true,
          phone: true,
        },
      },
    },
  });


  if (!doctor) {
    notFound();
  }

  return <EditDoctorForm doctorId={doctor.id} initialState={buildInitialState(doctor)} />;
}
