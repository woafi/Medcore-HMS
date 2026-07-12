import ReceptionDailySummaryMetrics from "@/components/ReceptionDailySummaryMetrics";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";


export default async function ReceptionPage({ params }) {
  const { receptionistId } = await params;

  const receptionist = await prisma.receptionist.findFirst({
    where: {
      OR: [{ userId: receptionistId }, { id: receptionistId }],
    },
    select: {
      id: true,
      userId: true,
      name: true,
      receptionists_id: true,
    },
  });

  if (!receptionist) {
    notFound();
  }

  const pusherConfig = {
    key: process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY || "",
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER || "",
    channel: "reception-dashboard",
    event: "appointments-updated",
  };

  return (
    <div className="relative flex-1 overflow-x-hidden bg-background text-gray-900 dark:text-gray-100 font-sans">
      <DailySummaryMetrics
        receptionist={receptionist}
        receptionistId={receptionistId}
        pusherConfig={pusherConfig}
      />
    </div>
  );
}
