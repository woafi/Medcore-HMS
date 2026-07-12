import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const entity = searchParams.get("entity");
  const term = cleanSearchTerm(searchParams.get("term"));

  if (!entity || !term) {
    return NextResponse.json({ results: [] });
  }

  try {
    let results: SearchResult[] = [];

    if (entity === "doctors") {
      const doctors = await prisma.doctor.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { doctor_id: { contains: term, mode: "insensitive" } },
            { specialization: { contains: term, mode: "insensitive" } },
            { qualification: { contains: term, mode: "insensitive" } },
            {
              user: {
                OR: [
                  { phone: { contains: term, mode: "insensitive" } },
                  { email: { contains: term, mode: "insensitive" } },
                ],
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

      results = doctors.map((doctor) => ({
        id: doctor.id,
        title: doctor.name,
        code: doctor.doctor_id,
        subtitle: doctor.specialization,
        contact: doctor.user?.phone || doctor.user?.email || "",
        image: doctor.profileImage,
        href: `/doctor/${doctor.id}/profile`,
      }));
    } else if (entity === "receptionists") {
      const receptionists = await prisma.receptionist.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { receptionists_id: { contains: term, mode: "insensitive" } },
            {
              user: {
                OR: [
                  { phone: { contains: term, mode: "insensitive" } },
                  { email: { contains: term, mode: "insensitive" } },
                ],
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

      results = receptionists.map((receptionist) => ({
        id: receptionist.id,
        title: receptionist.name,
        code: receptionist.receptionists_id,
        subtitle: `${receptionist.shift} Shift`,
        contact: receptionist.user?.phone || receptionist.user?.email || "",
        image: receptionist.profileImage,
        href: `/receptionist/${receptionist.id}/dashboard`,
      }));
    } else if (entity === "appointments") {
      const appointments = await prisma.appointment.findMany({
        where: {
          OR: [
            { patient: { fullname: { contains: term, mode: "insensitive" } } },
            { patient: { patientId: { contains: term, mode: "insensitive" } } },
            { patient: { phone: { contains: term, mode: "insensitive" } } },
            { doctor: { name: { contains: term, mode: "insensitive" } } },
            { doctor: { specialization: { contains: term, mode: "insensitive" } } },
            { doctor: { doctor_id: { contains: term, mode: "insensitive" } } },
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

      const dateFormatter = new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      results = appointments.map((appointment) => ({
        id: appointment.id,
        title: appointment.patient.fullname,
        code: appointment.patient.patientId,
        subtitle: `${appointment.doctor.name} · ${dateFormatter.format(appointment.date)}`,
        contact: `${appointment.doctor.specialization} · ${statusLabels[appointment.status] ?? appointment.status}`,
        image: appointment.patient.profileImage,
        href: `/patients/profile?id=${appointment.patient.id}`,
      }));
    } else if (entity === "patients") {
      const patients = await prisma.patient.findMany({
        where: {
          OR: [
            { fullname: { contains: term, mode: "insensitive" } },
            { patientId: { contains: term, mode: "insensitive" } },
            { phone: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
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

      const genderLabels: Record<string, string> = {
        MALE: "Male",
        FEMALE: "Female",
        OTHER: "Other",
      };

      results = patients.map((patient) => ({
        id: patient.id,
        title: patient.fullname,
        code: patient.patientId,
        subtitle: genderLabels[patient.gender] ?? patient.gender,
        contact: patient.phone || patient.email || "",
        image: patient.profileImage,
        href: `/patients/profile?id=${patient.id}`,
      }));
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Directory search error:", error);
    return NextResponse.json(
      { results: [], error: "Search is unavailable right now." },
      { status: 500 }
    );
  }
}
