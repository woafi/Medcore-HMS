import nodemailer from "nodemailer";

const BANGLADESH_TIME_ZONE = "Asia/Dhaka";

type AppointmentReminderEmail = {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  appointmentDate: Date;
  appointmentStartTime: Date;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };

    return entities[character];
  });
}

function formatAppointmentDate(date: Date): string {
  return new Intl.DateTimeFormat("en-BD", {
    timeZone: BANGLADESH_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatAppointmentTime(date: Date): string {
  return new Intl.DateTimeFormat("en-BD", {
    timeZone: BANGLADESH_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASSWORD;

  console.log(user)
  console.log(password)

  if (!user || !password) {
    throw new Error("EMAIL_USER and EMAIL_PASSWORD must be configured to send appointment reminders.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass: password },
  });
}

export async function sendAppointmentReminderEmail({
  patientEmail,
  patientName,
  doctorName,
  appointmentDate,
  appointmentStartTime,
}: AppointmentReminderEmail): Promise<void> {
  const safePatientName = escapeHtml(patientName);
  const safeDoctorName = escapeHtml(doctorName);
  const appointmentDateLabel = formatAppointmentDate(appointmentDate);
  const appointmentTimeLabel = formatAppointmentTime(appointmentStartTime);

  await getTransporter().sendMail({
    from: process.env.EMAIL_USER,
    to: patientEmail,
    subject: "MedCore Hospital: appointment check-in reminder",
    text: `Dear ${patientName}, we have not recorded your check-in for your appointment with ${doctorName} on ${appointmentDateLabel} at ${appointmentTimeLabel} (Bangladesh time). Please contact hospital reception if you need assistance.`,
    html: `
      <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,sans-serif;color:#1e293b">
        <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
          <div style="background:#0f766e;color:#ffffff;padding:24px 32px"><strong style="font-size:20px">MedCore Hospital</strong></div>
          <div style="padding:32px">
            <h1 style="font-size:22px;margin:0 0 16px">Appointment check-in reminder</h1>
            <p>Dear ${safePatientName},</p>
            <p>We have not yet recorded your check-in for the appointment below.</p>
            <div style="background:#f8fafc;border-left:4px solid #0f766e;padding:16px;margin:20px 0">
              <p style="margin:0 0 8px"><strong>Doctor:</strong> Dr. ${safeDoctorName}</p>
              <p style="margin:0 0 8px"><strong>Date:</strong> ${appointmentDateLabel}</p>
              <p style="margin:0"><strong>Time:</strong> ${appointmentTimeLabel} (Bangladesh time)</p>
            </div>
            <p>If you need assistance, please contact the hospital reception.</p>
          </div>
        </div>
      </div>`,
  });
}
