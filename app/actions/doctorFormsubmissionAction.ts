"use server";

export async function doctorFormsubmissionAction(
  prevState: unknown,
  formData: FormData
) {
  void formData;

  return {
    ...(prevState as object),
    message: "Doctor form is ready, but saving is not connected yet.",
  };
}
