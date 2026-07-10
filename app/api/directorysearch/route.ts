import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

type SearchResult = {
  href: string;
  id: string;
  image: string | null;
  title: string;
  code: string;
  subtitle: string;
  contact: string;
};

export async function GET(request: NextRequest) {
  try {
    const tokenUser = await getCurrentUser();
    if (!tokenUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entity = searchParams.get("entity");
    const term = searchParams.get("term")?.trim();

    if (!entity || !term) {
      return NextResponse.json({ results: [] });
    }

    let results: SearchResult[] = [];

    if (entity === "doctors") {
      const doctors = await prisma.doctor.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { doctor_id: { contains: term, mode: "insensitive" } },
            { user: { phone: { contains: term } } },
            { user: { email: { contains: term, mode: "insensitive" } } },
          ],
        },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { phone: true, email: true } },
        },
      });

      results = doctors.map((doctor) => ({
        href: `/admin/dashboard/doctors/editingadoctor?id=${doctor.id}`,
        id: doctor.id,
        image: doctor.profileImage,
        title: doctor.name,
        code: doctor.doctor_id,
        subtitle: doctor.specialization,
        contact: doctor.user?.phone || doctor.user?.email || "",
      }));
    } else if (entity === "receptionists") {
      const receptionists = await prisma.receptionist.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { receptionists_id: { contains: term, mode: "insensitive" } },
            { user: { phone: { contains: term } } },
            { user: { email: { contains: term, mode: "insensitive" } } },
          ],
        },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { phone: true, email: true } },
        },
      });

      results = receptionists.map((receptionist) => ({
        href: `/admin/dashboard/receptionists/editingareceptionist?id=${receptionist.id}`,
        id: receptionist.id,
        image: receptionist.profileImage,
        title: receptionist.name,
        code: receptionist.receptionists_id,
        subtitle: receptionist.gender,
        contact: receptionist.user?.phone || receptionist.user?.email || "",
      }));
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Directory search error:", error);
    return NextResponse.json(
      { error: "Search is unavailable right now." },
      { status: 500 }
    );
  }
}
