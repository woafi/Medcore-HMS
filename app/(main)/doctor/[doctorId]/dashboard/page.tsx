import DoctorDailySummaryMetrics from "@/components/DoctorDailySummaryMetrics";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

type Params = Promise<{ doctorId: string }>;

export default async function DoctorDashboardPage({ params }: { params: Params }) {
  const { doctorId } = await params;

  const doctor = await prisma.doctor.findFirst({
    where: {
      OR: [{ userId: doctorId }, { id: doctorId }, { doctor_id: doctorId }],
    },
    select: {
      id: true,
      userId: true,
      doctor_id: true,
      name: true,
      specialization: true,
      room: true,
    },
  });

  if (!doctor) {
    notFound();
  }

  const pusherConfig = {
    key: process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY || "",
    cluster:
      process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER || "",
    channel: "doctor-dashboard",
    event: "appointments-updated",
  };

  return (
    <div className="relative flex-1 overflow-x-hidden bg-background text-gray-900 dark:text-gray-100 font-sans">
      <DoctorDailySummaryMetrics
        doctor={doctor}
        doctorId={doctorId}
        pusherConfig={pusherConfig}
      />
    </div>
  );
}
