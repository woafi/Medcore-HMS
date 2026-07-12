"use client"
import { useState } from "react";
import BookAppointmentModal from "@/components/BookAppointmentModal";
import Button from "./Button";

const BookAppointment = () => {
    const [showModal, setShowModal] = useState(false);

    function handleModal() {
        setShowModal(true)
    }

    return (
        <div>
            <Button
                text="Book New Appointment"
                onClick={handleModal}
                iconType="add" />

            {showModal && <BookAppointmentModal onClose={() => setShowModal(false)} />}
        </div>
    )
}

export default BookAppointment

