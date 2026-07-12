"use client"
import { useState } from "react";
import AddPatientModal from "@/components/NewPatientModal";
import Button from "./Button";

export default function AddNewPatientModal() {
    const [showModal, setShowModal] = useState(false);

    function handleModal() {
        setShowModal(true)
    }

    return (
        <div>
            <Button
                text="Add Patient"
                onClick={handleModal}
                iconType="add" />

            {showModal && <AddPatientModal onClose={() => setShowModal(false)} />}
        </div>
    )
}