import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRoleHome } from "@/lib/getRoleHome";

type Gender = "MALE" | "FEMALE" | "OTHER";
type BloodGroup = string | null;

type PageProps = {
  params: Promise<{ patientId: string }>;
};

function formatGender(gender: Gender | null | undefined): string {
  const labels: Record<string, string> = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };
  return gender ? labels[gender] ?? gender : "—";
}

function formatBloodGroup(bloodGroup: string | null | undefined): string {
  if (!bloodGroup) return "—";
  return bloodGroup
    .replace(/_Positive$/, "+")
    .replace(/_Negative$/, "-")
    .replace(/_/g, " ");
}

function calculateAge(dateOfBirth: Date | null | undefined, storedAge: number | null | undefined): number | null {
  if (storedAge != null) return storedAge;
  if (!dateOfBirth) return null;

  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

function initialsFromName(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function ContactRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <svg
        className="w-5 h-5 shrink-0 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
      <div className="text-sm min-w-0">
        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">{label}</p>
        <div className="font-medium text-gray-900 dark:text-white break-words">{children}</div>
      </div>
    </div>
  );
}

export default async function PatientMyProfilePage({
  params,
}: PageProps) {
  const { patientId } = await params;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Patients can only see their own profile, other roles are sent to their home
  if (
    currentUser.role !== "PATIENT" ||
    (patientId !== currentUser.id &&
      patientId !== currentUser.userid)
  ) {
    redirect(getRoleHome(currentUser));
  }

  const patient = await prisma.patient.findFirst({
    where: {
      OR: [{ id: patientId }, { patientId: patientId }, { userId: patientId }],
    },
  });

  if (!patient) {
    notFound();
  }

  const age = calculateAge(patient.dateOfBirth, patient.age);
  const initials = initialsFromName(patient.fullname);
  const emergencyLabel = [patient.emergencyName, patient.relationship]
    .filter(Boolean)
    .join(patient.emergencyName && patient.relationship ? " · " : "");

  return (
    <div className="flex-1 overflow-y-auto bg-background text-gray-900 dark:text-gray-100">
      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-blue-100 shrink-0">
              {patient.profileImage ? (
                <Image
                  src={patient.profileImage}
                  alt={patient.fullname}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {initials}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white truncate">
                My Profile
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                {patient.fullname} · {patient.patientId}
              </p>
            </div>
            <Link
              href={`/patient/${patient.id}/dashboard`}
              className="ml-auto flex items-center gap-2 px-4 h-10 text-sm font-bold text-blue-700 border border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
            >
              Dashboard
            </Link>
          </div>

          {/* Identity card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="relative w-24 h-24 rounded-full border-4 border-gray-50 dark:border-gray-800 shadow-sm overflow-hidden bg-blue-100 shrink-0">
                {patient.profileImage ? (
                  <Image
                    src={patient.profileImage}
                    alt={patient.fullname}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                    {initials}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {patient.fullname}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">
                  {patient.patientId}
                </p>
                <div className="flex gap-2 mt-3 flex-wrap justify-center sm:justify-start">
                  <span className="px-2 py-1 bg-blue-600/10 text-blue-600 text-xs font-bold rounded-lg uppercase tracking-wider">
                    {formatGender(patient.gender)}
                  </span>
                  {age != null ? (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                      {age} years
                    </span>
                  ) : null}
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                    Blood Group {formatBloodGroup(patient.bloodGroup)}
                  </span>
                </div>
              </div>
            </div>

            {patient.allergies ? (
              <div className="mt-5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-tight">Active Allergies</span>
                </div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                  {patient.allergies}
                </p>
              </div>
            ) : null}
          </div>

          {/* Contact information */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <ContactRow
                icon="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                label="Phone"
              >
                {patient.phone || "—"}
              </ContactRow>
              <ContactRow
                icon="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                label="Email"
              >
                {patient.email || "—"}
              </ContactRow>
              <ContactRow
                icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                label="Emergency Contact"
              >
                {emergencyLabel || "—"}
                {patient.emergencyPhone ? (
                  <p className="text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                    {patient.emergencyPhone}
                  </p>
                ) : null}
              </ContactRow>
              <ContactRow
                icon="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                label="Address"
              >
                {patient.address || "—"}
              </ContactRow>
            </div>
          </div>

          {/* Record details */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
              Record Details
            </h3>
            <div className="text-sm space-y-2">
              <p>
                <span className="text-gray-500 dark:text-gray-400">Date of birth: </span>
                <span className="font-medium">{formatDate(patient.dateOfBirth)}</span>
              </p>
              <p>
                <span className="text-gray-500 dark:text-gray-400">Registered: </span>
                <span className="font-medium">{formatDate(patient.createdAt)}</span>
              </p>
              <p>
                <span className="text-gray-500 dark:text-gray-400">Last updated: </span>
                <span className="font-medium">{formatDateTime(patient.updatedAt)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
