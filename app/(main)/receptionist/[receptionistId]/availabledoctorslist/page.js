import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { 
  Stethoscope, 
  GraduationCap, 
  BadgeCheck, 
  MapPin, 
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  Users
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function DoctorsPage({ params }) {
  const { receptionistId } = await params;
  console.log("Receptionist ID from URL:", receptionistId);

  if (!receptionistId) {
    redirect("/");
  }

  try {
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      select: {
        id: true,
        doctor_id: true,
        name: true,
        specialization: true,
        profileImage: true,
        qualification: true,
        consultationFee: true,
        gender: true,
        room: true,
        bio: true,
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
      orderBy: [{ specialization: "asc" }, { name: "asc" }],
    });

    // Group doctors by specialization
    const doctorsBySpecialization = doctors.reduce((acc, doctor) => {
      const spec = doctor.specialization || "General";
      if (!acc[spec]) {
        acc[spec] = [];
      }
      acc[spec].push(doctor);
      return acc;
    }, {});

    const specializations = Object.keys(doctorsBySpecialization).sort();

    return (
      <main className="min-h-screen bg-background flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl space-y-6 p-6 pb-20">
          {/* Header Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-6 shadow-xl shadow-primary/20">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                  <Stethoscope className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white">
                    Medical Specialists Directory
                  </h1>
                  <p className="mt-1 text-sm font-medium text-white/90">
                    {doctors.length} expert doctors • {specializations.length} specializations
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Doctors List */}
          {specializations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 p-16 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/50">
              <div className="rounded-full bg-gray-100 p-6 dark:bg-gray-800">
                <Stethoscope className="h-16 w-16 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-gray-100">
                No Doctors Available
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                There are currently no active doctors in the system
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {specializations.map((specialization) => (
                <section key={specialization} className="space-y-4">
                  {/* Specialization Header */}
                  <div className="flex items-center gap-3 rounded-xl bg-white/60 p-4 backdrop-blur-sm dark:bg-gray-900/60">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-50">
                          {specialization}
                        </h2>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/20">
                          <Users className="h-3.5 w-3.5" />
                          {doctorsBySpecialization[specialization].length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Doctors Table */}
                  <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-lg dark:border-gray-800/60 dark:bg-gray-900/90">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        {/* Table Header */}
                        <thead className="bg-gray-50/80 backdrop-blur-sm dark:bg-gray-800/80">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                              Doctor
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                              Qualification
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                              Contact
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                              Room
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                              Fee
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                              Patients
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                              Action
                            </th>
                          </tr>
                        </thead>

                        {/* Table Body */}
                        <tbody className="divide-y divide-gray-200/60 dark:divide-gray-800/60">
                          {doctorsBySpecialization[specialization].map((doctor, index) => (
                            <tr
                              key={doctor.id}
                              className="group transition-all hover:bg-primary/5 dark:hover:bg-primary/10"
                            >
                              {/* Doctor Info */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  {/* Profile Image */}
                                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl ring-2 ring-gray-200 transition-all group-hover:ring-primary dark:ring-gray-700">
                                    {doctor.profileImage ? (
                                      <Image
                                        src={doctor.profileImage}
                                        alt={doctor.name}
                                        fill
                                        className="object-cover"
                                        sizes="56px"
                                      />
                                    ) : (
                                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                        <Stethoscope className="h-6 w-6 text-primary/60" />
                                      </div>
                                    )}
                                    {/* Active Badge */}
                                    <div className="absolute -right-1 -top-1">
                                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900">
                                        <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                                      </span>
                                    </div>
                                  </div>

                                  {/* Name & ID */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-base font-bold text-gray-900 dark:text-gray-50 truncate">
                                        {doctor.name}
                                      </p>
                                      <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                        {doctor.doctor_id}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {doctor.gender}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Qualification */}
                              <td className="px-6 py-4">
                                <div className="flex items-start gap-2">
                                  <GraduationCap className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-2 max-w-xs">
                                    {doctor.qualification}
                                  </p>
                                </div>
                              </td>

                              {/* Contact */}
                              <td className="px-6 py-4">
                                <div className="space-y-1.5">
                                  {doctor.user.phone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                                      <span className="font-medium">{doctor.user.phone}</span>
                                    </div>
                                  )}
                                  {doctor.user.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                                      <span className="font-medium truncate max-w-[180px]">
                                        {doctor.user.email}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Room */}
                              <td className="px-6 py-4">
                                {doctor.room ? (
                                  <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 dark:bg-blue-950/30">
                                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm font-bold text-blue-900 dark:text-blue-300">
                                      Room {doctor.room}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400 dark:text-gray-600">
                                    Not assigned
                                  </span>
                                )}
                              </td>

                              {/* Consultation Fee */}
                              <td className="px-6 py-4">
                                <div className="text-left">
                                  <p className="text-lg font-black text-gray-900 dark:text-gray-50">
                                    ৳{Number(doctor.consultationFee).toFixed(0)}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    per visit
                                  </p>
                                </div>
                              </td>

                              {/* Appointments Count */}
                              <td className="px-6 py-4">
                                <div className="inline-flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-1.5 dark:bg-purple-950/30">
                                  <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                  <span className="text-sm font-bold text-purple-900 dark:text-purple-300">
                                    {doctor._count.appointments}
                                  </span>
                                </div>
                              </td>

                              {/* Action Button */}
                              <td className="px-6 py-4 text-right">
                                <Link
                                  href={`/receptionist/${receptionistId}/doctors/doctordetails?doctorId=${doctor.id}`}
                                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95"
                                >
                                  View Profile
                                  <ChevronRight className="h-4 w-4" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error loading doctors:", error);
    return (
      <main className="mx-auto max-w-7xl p-6">
        <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-6 shadow-lg dark:border-red-900/40 dark:from-red-950/30 dark:to-red-950/20">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-red-500/10 p-2">
              <Stethoscope className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900 dark:text-red-300">
                Failed to Load Doctors
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                An error occurred while fetching doctor information. Please refresh the page or contact support.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }
}