import type { Role } from "@prisma/client";

export type DoctorProfile = {
  id: string;
  doctor_id: string;
  name: string;
  specialization: string;
  qualification: string;
  profileImage: string | null;
  gender: string;
  isActive: boolean;
};

export type ReceptionistProfile = {
  id: string;
  receptionists_id: string;
  name: string;
  profileImage: string | null;
  gender: string;
  shift: string;
  isActive: boolean;
};

export type ApiUser = {
  id: string;
  email: string;
  role: Role;
  phone: string;
  doctor: DoctorProfile | null;
  receptionist: ReceptionistProfile | null;
};
