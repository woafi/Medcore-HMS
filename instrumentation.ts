export async function register() {
  // Instrumentation runs in every Next.js runtime; the scheduler relies on
  // node-cron and Prisma, so it must only start in the Node.js server.
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    console.log("Appointment scheduler skipped: non-Node.js runtime.");
    return;
  }

  console.log("Registering appointment scheduler in Node.js runtime.");
  const { startAppointmentScheduler } = await import("@/lib/appointmentCron");
  startAppointmentScheduler();
}
