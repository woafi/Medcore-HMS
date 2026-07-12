"use client";

import { useState } from "react";
import EditPatientModal from "@/components/patient/EditPatientModal";

// ---------------------------------------------------------------------------
// Row action — opens the edit-patient modal for a single patient record
// ---------------------------------------------------------------------------

export default function EditPatientTrigger({ patient }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="cursor-pointer p-2 text-gray-400 transition-colors hover:text-blue-600 bg-gray-50 dark:bg-gray-700 rounded-lg"
        title="Edit Patient"
        aria-label={`Edit ${patient.fullname}`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
          />
        </svg>
      </button>

      {showModal ? (
        <EditPatientModal patient={patient} onClose={() => setShowModal(false)} />
      ) : null}
    </>
  );
}
