import nodemailer from "nodemailer";

const BANGLADESH_TIME_ZONE = "Asia/Dhaka";

type AppointmentReminderEmail = {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  appointmentDate: Date;
  appointmentStartTime: Date;
};

type MissedAppointmentRescheduleEmail = {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  missedAppointmentDate: Date;
  missedStartTime: Date;
  rescheduleUrl: string;
};

type NoSlotAvailableEmail = {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  missedAppointmentDate: Date;
  missedStartTime: Date;
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
              <p style="margin:0 0 8px"><strong>Doctor:</strong> ${safeDoctorName}</p>
              <p style="margin:0 0 8px"><strong>Date:</strong> ${appointmentDateLabel}</p>
              <p style="margin:0"><strong>Time:</strong> ${appointmentTimeLabel} (Bangladesh time)</p>
            </div>
            <p>If you need assistance, please contact the hospital reception.</p>
          </div>
        </div>
      </div>`,
  });
}

export async function sendMissedAppointmentRescheduleEmail({
  patientEmail,
  patientName,
  doctorName,
  missedAppointmentDate,
  missedStartTime,
  rescheduleUrl,
}: MissedAppointmentRescheduleEmail): Promise<void> {
  const safePatientName = escapeHtml(patientName);
  const safeDoctorName = escapeHtml(doctorName);
  const missedAppointmentDateLabel = escapeHtml(
    formatAppointmentDate(missedAppointmentDate)
  );
  const missedStartTimeLabel = escapeHtml(formatAppointmentTime(missedStartTime));
  const safeUrl = escapeHtml(rescheduleUrl);

  await getTransporter().sendMail({
    from: process.env.EMAIL_USER,
    to: patientEmail,
    subject:
      "MedCore Hospital: you missed your appointment – book another slot today",
    text: `Dear ${patientName},\n\nWe noticed that you were unable to attend your scheduled appointment with ${doctorName} on ${formatAppointmentDate(missedAppointmentDate)} at ${formatAppointmentTime(missedStartTime)} (Bangladesh time).\n\nDoctor: ${doctorName}\nDate: ${formatAppointmentDate(missedAppointmentDate)}\nMissed time: ${formatAppointmentTime(missedStartTime)} (Bangladesh time)\n\nIf you would still like to see the doctor today, you can book the next available slot with one click below.\n\n${rescheduleUrl}\n\nThis link is valid for today only. If you would like to visit on a different day, please contact the hospital directly, and our team will be happy to help you.\n\nKind regards,\nMedCore Hospital`,
    html: `
      <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,sans-serif;color:#1e293b">
        <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
          <div style="background:#0f766e;color:#ffffff;padding:24px 32px"><strong style="font-size:20px">MedCore Hospital</strong></div>
          <div style="padding:32px">
            <h1 style="font-size:22px;margin:0 0 16px">Book another slot today</h1>
            <p>Dear ${safePatientName},</p>
            <p>We noticed that you were unable to attend your scheduled appointment with ${safeDoctorName} on ${missedAppointmentDateLabel} at ${missedStartTimeLabel} (Bangladesh time).</p>
            <p>If you would still like to see the doctor today, you can book the next available slot with one click below.</p>
            <div style="background:#f8fafc;border-left:4px solid #0f766e;padding:16px;margin:20px 0">
              <p style="margin:0 0 8px"><strong>Doctor:</strong> ${safeDoctorName}</p>
              <p style="margin:0 0 8px"><strong>Date:</strong> ${missedAppointmentDateLabel}</p>
              <p style="margin:0"><strong>Missed time:</strong> ${missedStartTimeLabel} (Bangladesh time)</p>
            </div>
            <p><a href="${safeUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Book the next available slot today</a></p>
            <p>If the button does not work, copy this link into your browser:<br />${safeUrl}</p>
            <p>This link is valid for today only. If you would like to visit on a different day, please contact the hospital directly, and our team will be happy to help you.</p>
            <p>Kind regards,<br />MedCore Hospital</p>
          </div>
        </div>
      </div>`,
  });
}

export async function sendNoSlotAvailableEmail({
  patientEmail,
  patientName,
  doctorName,
  missedAppointmentDate,
  missedStartTime,
}: NoSlotAvailableEmail): Promise<void> {
  const safePatientName = escapeHtml(patientName);
  const safeDoctorName = escapeHtml(doctorName);
  const missedAppointmentDateLabel = escapeHtml(
    formatAppointmentDate(missedAppointmentDate)
  );
  const missedStartTimeLabel = escapeHtml(formatAppointmentTime(missedStartTime));

  await getTransporter().sendMail({
    from: process.env.EMAIL_USER,
    to: patientEmail,
    subject:
      "MedCore Hospital: you missed your appointment – please contact us to reschedule",
    text: `Dear ${patientName},\n\nWe noticed that you were unable to attend your appointment with ${doctorName} on ${formatAppointmentDate(missedAppointmentDate)} at ${formatAppointmentTime(missedStartTime)} (Bangladesh time).\n\nWe are sorry to let you know that no other free slot is available with the doctor for today.\n\nDoctor: ${doctorName}\nDate: ${formatAppointmentDate(missedAppointmentDate)}\nMissed time: ${formatAppointmentTime(missedStartTime)} (Bangladesh time)\n\nTo book a new appointment on another day, please contact hospital reception, and our team will be glad to help you find a suitable time.\n\nKind regards,\nMedCore Hospital`,
    html: `
      <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,sans-serif;color:#1e293b">
        <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
          <div style="background:#0f766e;color:#ffffff;padding:24px 32px"><strong style="font-size:20px">MedCore Hospital</strong></div>
          <div style="padding:32px">
            <h1 style="font-size:22px;margin:0 0 16px">Please contact us to reschedule</h1>
            <p>Dear ${safePatientName},</p>
            <p>We noticed that you were unable to attend your appointment with ${safeDoctorName} on ${missedAppointmentDateLabel} at ${missedStartTimeLabel} (Bangladesh time).</p>
            <p>We are sorry to let you know that no other free slot is available with the doctor for today.</p>
            <div style="background:#f8fafc;border-left:4px solid #0f766e;padding:16px;margin:20px 0">
              <p style="margin:0 0 8px"><strong>Doctor:</strong> ${safeDoctorName}</p>
              <p style="margin:0 0 8px"><strong>Date:</strong> ${missedAppointmentDateLabel}</p>
              <p style="margin:0"><strong>Missed time:</strong> ${missedStartTimeLabel} (Bangladesh time)</p>
            </div>
            <p>To book a new appointment on another day, please contact hospital reception, and our team will be glad to help you find a suitable time.</p>
            <p>Kind regards,<br />MedCore Hospital</p>
          </div>
        </div>
      </div>`,
  });
}
