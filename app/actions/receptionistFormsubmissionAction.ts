"use server";

export async function receptionistFormsubmissionAction(
  prevState: unknown,
  formData: FormData
) {
  void formData;

  return {
    ...(prevState as object),
    message: "Receptionist form is ready, but saving is not connected yet.",
  };
}
