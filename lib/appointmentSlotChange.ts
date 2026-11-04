import { NextRequest } from "next/server";
import { appointmentSlotChange } from "@/app/api/appointmentSlotChange/route";

export async function changeAppointmentSlot(appointmentId: string) {
  const response = await appointmentSlotChange(
    new NextRequest(`http://localhost/api/appointmentSlotchange?appointmentId=${encodeURIComponent(appointmentId)}`)
  );
  return {
    status: response.status,
    body: (await response.json()) as unknown,
  };
}
