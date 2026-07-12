import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import {
  Stethoscope,
  Calendar,
  Clock,
  FileText,
  Briefcase,
  Award,
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const STATUS_COLORS = {
  Available: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  Emergency_Only: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    icon: AlertCircle,
  },
  Off_duty: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-500 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700",
    icon: XCircle,
  },
};

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function formatTimeRange(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
  };

  return `${formatTime(start)} - ${formatTime(end)}`;
}

function SlotBadge({ isBooked, startTime, endTime }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:scale-105 ${
        isBooked
          ? "bg-gradient-to-br from-red-50 to-red-100 text-red-900 dark:from-red-950/40 dark:to-red-900/30 dark:text-red-300 border-2 border-red-300 dark:border-red-800"
          : "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-900 dark:from-emerald-950/40 dark:to-emerald-900/30 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-800"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="font-bold">{formatTimeRange(startTime, endTime)}</span>
        </div>
        {isBooked ? (
          <span className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-black text-white">
            <XCircle className="h-3 w-3" />
            BOOKED
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-black text-white">
            <CheckCircle2 className="h-3 w-3" />
            FREE
          </span>
        )}
      </div>
    </div>
  );
}

export default async function DoctorDetailsPage({ params, searchParams }) {
  const { receptionistId } = await params;
  const doctor = await searchParams;
  const doctorId = doctor.doctorId;

  if (!doctorId || !receptionistId) {
    redirect(`/receptionist/${receptionistId}/doctors`);
  }

  try {
    // Fetch doctor details with user info
    const doctor = await prisma.doctor.findFirst({
      where: {
        OR: [{ id: doctorId }, { doctor_id: doctorId }],
        isActive: true,
      },
      select: {
        id: true,
        doctor_id: true,
        name: true,
        specialization: true,
        qualification: true,
        room: true,
        bio: true,
        profileImage: true,
        consultationFee: true,
        gender: true,
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
    });

    if (!doctor) {
      return (
        <main className="mx-auto max-w-7xl p-6 pb-20">
          <Link
            href={`/receptionist/${receptionistId}/doctors`}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-all hover:shadow-md dark:bg-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Doctors
          </Link>
          <div className="mt-6 rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-6 shadow-lg dark:border-red-900/40 dark:from-red-950/30 dark:to-red-950/20">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-red-500/10 p-2">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900 dark:text-red-300">
                  Doctor Not Found
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                  The requested doctor could not be found or may have been deactivated.
                </p>
              </div>
            </div>
          </div>
        </main>
      );
    }

    // Fetch availabilities with slots
    const availabilities = await prisma.availability.findMany({
      where: { doctorId: doctor.id },
      include: {
        available_slots: {
          orderBy: { startTime: "asc" },
        },
      },
    });

    // Build availability map
    const availabilityMap = availabilities.reduce((acc, avail) => {
      acc[avail.day] = {
        status: avail.status,
        slots: avail.available_slots.map((slot) => ({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          is_booked: slot.is_booked,
        })),
      };
      return acc;
    }, {});

    // Fetch booked appointments for this doctor
    const bookedAppointments = await prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      select: {
        slotId: true,
      },
    });

    const bookedSlotIds = new Set(
      bookedAppointments
        .filter((appt) => appt.slotId)
        .map((appt) => appt.slotId)
    );

    // Mark booked slots
    Object.keys(availabilityMap).forEach((day) => {
      availabilityMap[day].slots.forEach((slot) => {
        if (slot.is_booked || bookedSlotIds.has(slot.id)) {
          slot.is_booked = true;
        }
      });
    });

    // Calculate statistics
    const totalSlots = Object.values(availabilityMap).reduce(
      (sum, day) => sum + day.slots.length,
      0
    );
    const bookedSlots = Object.values(availabilityMap).reduce(
      (sum, day) => sum + day.slots.filter((s) => s.is_booked).length,
      0
    );
    const availableSlots = totalSlots - bookedSlots;

    return (
      <main className="min-h-screen bg-background flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl space-y-6 p-6 pb-20">
          {/* Back Button */}
          <Link
            href={`/receptionist/${receptionistId}/doctors`}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-md transition-all hover:shadow-lg dark:bg-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Doctors Directory
          </Link>

          {/* Doctor Profile Card */}
          <div className="overflow-hidden rounded-3xl border border-gray-200/60 bg-white shadow-xl dark:border-gray-800/60 dark:bg-gray-900/90">
            {/* Header with Gradient */}
            <div className="relative h-32 bg-gradient-to-r from-primary via-primary/90 to-primary/80">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
            </div>

            {/* Profile Content */}
            <div className="relative px-8 pb-8">
              <div className="grid gap-8 md:grid-cols-[280px_1fr]">
                {/* Profile Image */}
                <div className="-mt-20">
                  <div className="relative h-56 w-56 overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-primary/5 to-primary/10 shadow-xl dark:border-gray-900">
                    {doctor.profileImage ? (
                      <Image
                        src={doctor.profileImage}
                        alt={doctor.name}
                        fill
                        className="object-cover"
                        sizes="224px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Stethoscope className="h-24 w-24 text-primary/40" />
                      </div>
                    )}
                    {/* Active Status Badge */}
                    <div className="absolute bottom-3 right-3">
                      <span className="flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                        <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="mt-4 space-y-2">
                    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 dark:from-blue-950/30 dark:to-blue-900/20">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <CalendarCheck className="h-5 w-5" />
                        <span className="text-sm font-semibold">Total Appointments</span>
                      </div>
                      <p className="mt-1 text-2xl font-black text-blue-900 dark:text-blue-300">
                        {doctor._count.appointments}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Doctor Information */}
                <div className="space-y-6 pt-4">
                  {/* Name and Title */}
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-gray-50">
                          Dr. {doctor.name}
                        </h1>
                        <p className="mt-2 text-xl font-bold text-primary">
                          {doctor.specialization}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary ring-1 ring-primary/20">
                            <Award className="h-4 w-4" />
                            {doctor.doctor_id}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-xl bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700 dark:bg-purple-950/30 dark:text-purple-300">
                            <User className="h-4 w-4" />
                            {doctor.gender}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Qualification */}
                    <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 dark:from-gray-800/50 dark:to-gray-900/30">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Award className="h-5 w-5" />
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          Qualification
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-bold text-gray-900 dark:text-gray-50">
                        {doctor.qualification}
                      </p>
                    </div>

                    {/* Room */}
                    {doctor.room && (
                      <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 dark:from-blue-950/30 dark:to-blue-900/20">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <MapPin className="h-5 w-5" />
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            Room Number
                          </span>
                        </div>
                        <p className="mt-2 text-lg font-black text-blue-900 dark:text-blue-300">
                          Room {doctor.room}
                        </p>
                      </div>
                    )}

                    {/* Consultation Fee */}
                    <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 dark:from-emerald-950/30 dark:to-emerald-900/20">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <Briefcase className="h-5 w-5" />
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          Consultation Fee
                        </span>
                      </div>
                      <p className="mt-2 text-2xl font-black text-emerald-900 dark:text-emerald-300">
                        ৳{Number(doctor.consultationFee).toFixed(0)}
                      </p>
                    </div>

                    {/* Phone */}
                    {doctor.user.phone && (
                      <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 dark:from-purple-950/30 dark:to-purple-900/20">
                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                          <Phone className="h-5 w-5" />
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            Phone
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-bold text-purple-900 dark:text-purple-300">
                          {doctor.user.phone}
                        </p>
                      </div>
                    )}

                    {/* Email */}
                    {doctor.user.email && (
                      <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 dark:from-orange-950/30 dark:to-orange-900/20 sm:col-span-2">
                        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                          <Mail className="h-5 w-5" />
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            Email
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-bold text-orange-900 dark:text-orange-300 truncate">
                          {doctor.user.email}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {doctor.bio && (
                    <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 p-6 dark:from-gray-800/50 dark:to-gray-900/30">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <FileText className="h-5 w-5" />
                        <span className="text-sm font-semibold uppercase tracking-wide">
                          About Doctor
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {doctor.bio}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="overflow-hidden rounded-3xl border border-gray-200/60 bg-white shadow-xl dark:border-gray-800/60 dark:bg-gray-900/90">
            {/* Schedule Header */}
            <div className="border-b border-gray-200/60 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6 dark:border-gray-800/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-primary/10 p-3 ring-2 ring-primary/20">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-gray-50">
                      Weekly Schedule & Availability
                    </h2>
                    <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Real-time slot availability and booking status
                    </p>
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="hidden lg:flex items-center gap-4">
                  <div className="rounded-xl bg-emerald-50 px-4 py-2 text-center dark:bg-emerald-950/30">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Available
                    </p>
                    <p className="text-xl font-black text-emerald-900 dark:text-emerald-300">
                      {availableSlots}
                    </p>
                  </div>
                  <div className="rounded-xl bg-red-50 px-4 py-2 text-center dark:bg-red-950/30">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                      Booked
                    </p>
                    <p className="text-xl font-black text-red-900 dark:text-red-300">
                      {bookedSlots}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Grid */}
            <div className="p-6">
              <div className="space-y-6">
                {DAY_ORDER.map((day) => {
                  const availability = availabilityMap[day];

                  if (!availability) {
                    return (
                      <div
                        key={day}
                        className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 dark:border-gray-800 dark:bg-gray-800/30"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-gray-200 p-2 dark:bg-gray-700">
                              <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-gray-50">
                              {day}
                            </h3>
                          </div>
                          <span className="rounded-full bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            OFF DUTY
                          </span>
                        </div>
                        <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
                          No scheduled availability
                        </p>
                      </div>
                    );
                  }

                  const statusConfig =
                    STATUS_COLORS[availability.status] || STATUS_COLORS.Available;
                  const StatusIcon = statusConfig.icon;
                  const daySlots = availability.slots.length;
                  const dayBooked = availability.slots.filter((s) => s.is_booked).length;
                  const dayAvailable = daySlots - dayBooked;

                  return (
                    <div
                      key={day}
                      className="rounded-2xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-sm dark:border-gray-800/60 dark:from-gray-900/50 dark:to-gray-800/30"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-xl ${statusConfig.bg} p-2.5 ring-2 ${statusConfig.border}`}>
                            <Calendar className={`h-5 w-5 ${statusConfig.text}`} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-gray-50">
                              {day}
                            </h3>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {dayAvailable} available • {dayBooked} booked
                            </p>
                          </div>
                        </div>
                        <span
                          className={`flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-sm font-bold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          <StatusIcon className="h-4 w-4" />
                          {availability.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      {availability.slots && availability.slots.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {availability.slots.map((slot) => (
                            <SlotBadge
                              key={slot.id}
                              isBooked={slot.is_booked}
                              startTime={slot.startTime}
                              endTime={slot.endTime}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            No time slots configured
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-8 rounded-2xl border border-gray-200/60 bg-gradient-to-br from-gray-50 to-white p-6 dark:border-gray-800/60 dark:from-gray-800/30 dark:to-gray-900/30">
                <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Legend
                </h4>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-lg border-2 border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Available Slot
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-lg border-2 border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Booked Slot
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Available
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Emergency Only
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error loading doctor details:", error);
    return (
      <main className="mx-auto max-w-7xl p-6 pb-20">
        <Link
          href={`/receptionist/${receptionistId}/doctors`}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-all hover:shadow-md dark:bg-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Doctors
        </Link>
        <div className="mt-6 rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-6 shadow-lg dark:border-red-900/40 dark:from-red-950/30 dark:to-red-950/20">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-red-500/10 p-2">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900 dark:text-red-300">
                Failed to Load Doctor Details
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