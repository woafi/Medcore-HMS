// ---------------------------------------------------------------------------
// Patient form helpers — shared serialization for edit/create flows
// ---------------------------------------------------------------------------

type GenderEnum = "MALE" | "FEMALE" | "OTHER";
type BloodGroupEnum =
  | "A_Positive"
  | "A_Negative"
  | "B_Positive"
  | "B_Negative"
  | "AB_Positive"
  | "AB_Negative"
  | "O_Positive"
  | "O_Negative";

interface PrismaPatientLike {
  id: string;
  patientId: string;
  fullname: string | null;
  gender: string;
  dateOfBirth: Date | string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergencyName: string | null;
  relationship: string | null;
  emergencyPhone: string | null;
  bloodGroup: string;
  age: number | null;
  allergies: string | null;
  profileImage: string | null;
}

interface SerializedPatientForEdit {
  id: string;
  patientId: string;
  fullname: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  emergencyName: string;
  relationship: string;
  emergencyPhone: string;
  bloodGroup: string;
  age: string;
  allergies: string;
  profileImage: string;
}

const GENDER_TO_FORM: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

/** Format a stored DateTime as YYYY-MM-DD for <input type="date" /> */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return "";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toISOString().slice(0, 10);
}

/** Map Prisma Gender enum to the select values used in patient forms */
export function genderForForm(gender: string): string {
  return GENDER_TO_FORM[gender] ?? "";
}

/**
 * Convert a Prisma patient record into a plain object safe to pass
 * from a Server Component to the edit-patient client modal.
 */
export function serializePatientForEditForm(patient: PrismaPatientLike): SerializedPatientForEdit {
  return {
    id: patient.id,
    patientId: patient.patientId,
    fullname: patient.fullname ?? "",
    gender: genderForForm(patient.gender),
    dateOfBirth: formatDateForInput(patient.dateOfBirth),
    phone: patient.phone ?? "",
    email: patient.email ?? "",
    address: patient.address ?? "",
    emergencyName: patient.emergencyName ?? "",
    relationship: patient.relationship ?? "",
    emergencyPhone: patient.emergencyPhone ?? "",
    bloodGroup: patient.bloodGroup ?? "O_Positive",
    age: patient.age != null ? String(patient.age) : "",
    allergies: patient.allergies ?? "",
    profileImage: patient.profileImage ?? "",
  };
}

/** Empty field-error map reused by the edit-patient server action state */
export const emptyPatientFieldErrors: Record<string, string> = {
  fullname: "",
  gender: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  address: "",
  emergencyName: "",
  relationship: "",
  emergencyPhone: "",
  bloodGroup: "",
  age: "",
  allergies: "",
  profileImage: "",
};

interface EditPatientFormValues {
  fullname: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  emergencyName: string;
  relationship: string;
  emergencyPhone: string;
  bloodGroup: string;
  age: string;
  allergies: string;
  profileImage: string;
}

interface EditPatientInitialState {
  success: boolean;
  message: string;
  fieldErrors: Record<string, string>;
  values: EditPatientFormValues;
}

/** Build the initial useActionState payload for EditPatientModal */
export function buildEditPatientInitialState(patient: SerializedPatientForEdit): EditPatientInitialState {
  return {
    success: false,
    message: "",
    fieldErrors: { ...emptyPatientFieldErrors },
    values: {
      fullname: patient.fullname,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      emergencyName: patient.emergencyName,
      relationship: patient.relationship,
      emergencyPhone: patient.emergencyPhone,
      bloodGroup: patient.bloodGroup,
      age: patient.age,
      allergies: patient.allergies,
      profileImage: patient.profileImage,
    },
  };
}
