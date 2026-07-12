import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type SearchContext = {
  profileBasePath?: string;
};

type SearchResult = {
  id: string;
  title: string;
  code: string;
  subtitle: string;
  contact: string;
  image: string | null;
  href: string;
};

function cleanSearchTerm(term: unknown): string {
  return String(term || "").trim().slice(0, 80);
}

export async function searchDirectory(
  entity: string,
  term: string,
  context: SearchContext = {}
): Promise<SearchResult[]> {
  const query = cleanSearchTerm(term);

  if (!query) {
    return [];
  }

  if (entity === "doctors") {
    const doctors = await prisma.doctor.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { doctor_id: { contains: query, mode: "insensitive" } },
          { specialization: { contains: query, mode: "insensitive" } },
          { qualification: { contains: query, mode: "insensitive" } },
          {
            user: {
              is: {
                OR: [
                  { phone: { contains: query, mode: "insensitive" } },
                  { email: { contains: query, mode: "insensitive" } },
                ],
              },
            },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        doctor_id: true,
        name: true,
        specialization: true,
        profileImage: true,
        user: {
          select: {
            phone: true,
            email: true,
          },
        },
      },
    });

    return doctors.map((doctor) => ({
      id: doctor.id,
      title: doctor.name,
      code: doctor.doctor_id,
      subtitle: doctor.specialization,
      contact: doctor.user?.phone || doctor.user?.email || "",
      image: doctor.profileImage,
      href: `/doctorprofile/${doctor.id}`,
    }));
  }

  if (entity === "receptionists") {
    const receptionists = await prisma.receptionist.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { receptionists_id: { contains: query, mode: "insensitive" } },
          {
            user: {
              is: {
                OR: [
                  { phone: { contains: query, mode: "insensitive" } },
                  { email: { contains: query, mode: "insensitive" } },
                ],
              },
            },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        receptionists_id: true,
        shift: true,
        profileImage: true,
        user: {
          select: {
            phone: true,
            email: true,
          },
        },
      },
    });

    return receptionists.map((receptionist) => ({
      id: receptionist.id,
      title: receptionist.name,
      code: receptionist.receptionists_id,
      subtitle: `${receptionist.shift} Shift`,
      contact: receptionist.user?.phone || receptionist.user?.email || "",
      image: receptionist.profileImage,
      href: `/receptionprofile/${receptionist.id}`,
    }));
  }

  if (entity === "appointments") {
    const appointments = await prisma.appointment.findMany({
      where: {
        OR: [
          { patient: { fullname: { contains: query, mode: "insensitive" } } },
          { patient: { patientId: { contains: query, mode: "insensitive" } } },
          { patient: { phone: { contains: query, mode: "insensitive" } } },
          { doctor: { name: { contains: query, mode: "insensitive" } } },
          { doctor: { specialization: { contains: query, mode: "insensitive" } } },
          { doctor: { doctor_id: { contains: query, mode: "insensitive" } } },
        ],
      },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      take: 6,
      select: {
        id: true,
        date: true,
        startTime: true,
        status: true,
        patient: {
          select: {
            id: true,
            fullname: true,
            patientId: true,
            profileImage: true,
          },
        },
        doctor: {
          select: {
            name: true,
            specialization: true,
          },
        },
      },
    });

    const statusLabels: Record<string, string> = {
      SCHEDULED: "Scheduled",
      WAITING: "Waiting",
      IN_PROGRESS: "In Progress",
      CHECKED_IN: "Checked In",
    };

    const profileBase =
      typeof context.profileBasePath === "string" ? context.profileBasePath : "";

    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return appointments.map((appointment) => ({
      id: appointment.id,
      title: appointment.patient.fullname,
      code: appointment.patient.patientId,
      subtitle: `${appointment.doctor.name} · ${dateFormatter.format(appointment.date)}`,
      contact: `${appointment.doctor.specialization} · ${statusLabels[appointment.status] ?? appointment.status}`,
      image: appointment.patient.profileImage,
      href: `/patientprofile/${appointment.patient.id}`,
    }));
  }

  if (entity === "patients") {
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { fullname: { contains: query, mode: "insensitive" } },
          { patientId: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        patientId: true,
        fullname: true,
        phone: true,
        email: true,
        profileImage: true,
        gender: true,
      },
    });

    const genderLabels: Record<string, string> = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };

    return patients.map((patient) => ({
      id: patient.id,
      title: patient.fullname,
      code: patient.patientId,
      subtitle: genderLabels[patient.gender] ?? patient.gender,
      contact: patient.phone || patient.email || "",
      image: patient.profileImage,
      href:`/patientprofile/${patient.id}`,
    }));
  }

  return [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entity = searchParams.get("entity") || "";
  const term = searchParams.get("term") || "";

  const results = await searchDirectory(entity, term);

  return NextResponse.json({ results });
}

