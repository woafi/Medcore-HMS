import Pusher from "pusher";

const appId = process.env.PUSHER_APP_ID;
const key = process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER;

export const PUSHER_DASHBOARD_CHANNEL = "reception-dashboard";
export const PUSHER_DOCTOR_DASHBOARD_CHANNEL = "doctor-dashboard";
export const PUSHER_ADMIN_DASHBOARD_CHANNEL = "admin-dashboard";
export const PUSHER_APPOINTMENTS_EVENT = "appointments-updated";
export const PUSHER_ADMIN_DASHBOARD_EVENT = "admin-dashboard-updated";

export const pusherServer =
  appId && key && secret && cluster
    ? new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      })
    : null;

// Notify reception dashboard of appointment updates
export async function notifyReceptionDashboard(payload = {}) {
  if (!pusherServer) return;

  await pusherServer.trigger(
    PUSHER_DASHBOARD_CHANNEL,
    PUSHER_APPOINTMENTS_EVENT,
    payload
  );
}

// Notify doctor dashboard of appointment updates
export async function notifyDoctorDashboard(payload = {}) {
  if (!pusherServer) return;

  await pusherServer.trigger(
    PUSHER_DOCTOR_DASHBOARD_CHANNEL,
    PUSHER_APPOINTMENTS_EVENT,
    payload
  );
}

// Notify admin dashboard of staff, patient, and appointment changes
export async function notifyAdminDashboard(payload = {}) {
  if (!pusherServer) return;

  await pusherServer.trigger(
    PUSHER_ADMIN_DASHBOARD_CHANNEL,
    PUSHER_ADMIN_DASHBOARD_EVENT,
    payload
  );
}
