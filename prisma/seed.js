// prisma/seed.js

const { PrismaClient, Role, Gender, Day, Status, Shift, BloodGroup, AppointmentStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// =========================
// HELPERS
// =========================

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBool() {
  return Math.random() > 0.5;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function createSlotTime(date, hourStart, hourEnd) {
  const start = new Date(date);
  start.setHours(hourStart, 0, 0, 0);

  const end = new Date(date);
  end.setHours(hourEnd, 0, 0, 0);

  return { start, end };
}

// =========================
// CONSTANTS
// =========================

const specializations = [
  "Cardiologist",
  "Neurologist",
  "Dermatologist",
  "Orthopedic",
  "Pediatrician",
  "Psychiatrist",
  "Dentist",
  "ENT Specialist",
  "General Physician",
  "Gynecologist",
];

const qualifications = [
  "MBBS",
  "MBBS, FCPS",
  "MBBS, MD",
  "MBBS, MS",
  "MBBS, BCS",
];

const doctorNames = [
  "Dr. John Smith",
  "Dr. Sarah Ahmed",
  "Dr. Michael Lee",
  "Dr. Emily Brown",
  "Dr. David Wilson",
  "Dr. Olivia Taylor",
  "Dr. Daniel Garcia",
  "Dr. Sophia Martinez",
  "Dr. James Anderson",
  "Dr. Mia Thomas",
  "Dr. Ethan White",
  "Dr. Charlotte Harris",
  "Dr. Benjamin Clark",
  "Dr. Amelia Lewis",
  "Dr. Noah Walker",
  "Dr. Isabella Hall",
  "Dr. William Allen",
  "Dr. Ava Young",
  "Dr. Lucas King",
  "Dr. Grace Scott",
];

const receptionistNames = [
  "Alice",
  "Sophia",
  "Emma",
  "Liam",
  "Noah",
  "Mason",
  "Olivia",
  "Ava",
  "Ethan",
  "James",
];

const patientNames = [
  "Rahim",
  "Karim",
  "Sakib",
  "Tamim",
  "Ayesha",
  "Fatema",
  "Nusrat",
  "Mim",
  "Hasan",
  "Jannat",
  "Rafi",
  "Tanvir",
  "Nabila",
  "Arif",
  "Shuvo",
  "Farhan",
  "Anika",
  "Mehedi",
  "Sadia",
  "Rifat",
];

const slotTemplates = [
  { start: 6, end: 8 },
  { start: 8, end: 10 },
  { start: 10, end: 12 },
  { start: 13, end: 15 },
  { start: 15, end: 17 },
];

const workingDays = [
  Day.Monday,
  Day.Tuesday,
  Day.Wednesday,
  Day.Thursday,
  Day.Friday,
  Day.Saturday,
];

const bloodGroups = Object.values(BloodGroup);

// =========================
// MAIN SEED
// =========================

async function main() {
  console.log("🌱 Seeding database...");

  // =========================
  // CLEAN DATABASE
  // =========================

  await prisma.appointment.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.receptionist.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  // =========================
  // PASSWORDS
  // =========================

  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const doctorPassword = await bcrypt.hash("Doctor@123", 10);
  const receptionPassword = await bcrypt.hash("Reception@123", 10);

  // =========================
  // ADMIN
  // =========================

  await prisma.user.create({
    data: {
      email: "admin@hms.com",
      password: adminPassword,
      phone: "01700000000",
      role: Role.ADMIN,
    },
  });

  // =========================
  // DOCTORS + AVAILABILITY + SLOTS
  // =========================

  const createdDoctors = [];

  for (let i = 0; i < 20; i++) {
    const user = await prisma.user.create({
      data: {
        email: `doctor${i + 1}@hms.com`,
        password: doctorPassword,
        phone: `018100000${String(i).padStart(2, "0")}`,
        role: Role.DOCTOR,
      },
    });

    const doctor = await prisma.doctor.create({
      data: {
        doctor_id: `DOC-${String(i + 1).padStart(3, "0")}`,
        name: doctorNames[i],
        specialization: randomItem(specializations),
        qualification: randomItem(qualifications),
        room: 101 + i,
        bio: `Experienced ${randomItem(specializations)} doctor.`,
        gender: randomBool() ? Gender.MALE : Gender.FEMALE,
        consultationFee: Math.floor(Math.random() * 1000) + 500,
        isActive: true,
        userId: user.id,
      },
    });

    createdDoctors.push(doctor);

    // Create Availabilities + Slots
    for (const day of workingDays) {
      const availability = await prisma.availability.create({
        data: {
          day,
          status: randomItem([
            Status.Available,
            Status.Emergency_Only,
            Status.Off_duty,
          ]),
          doctorId: doctor.id,
        },
      });

      // Create 5 slots
      for (const slot of slotTemplates) {
        const today = new Date();

        const { start, end } = createSlotTime(
          today,
          slot.start,
          slot.end
        );

        await prisma.slot.create({
          data: {
            startTime: start,
            endTime: end,
            availabilityId: availability.id,
          },
        });
      }
    }
  }

  // =========================
  // RECEPTIONISTS
  // =========================

  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: `reception${i + 1}@hms.com`,
        password: receptionPassword,
        phone: `019200000${String(i).padStart(2, "0")}`,
        role: Role.RECEPTIONIST,
      },
    });

    await prisma.receptionist.create({
      data: {
        name: receptionistNames[i],
        receptionists_id: `REC-${String(i + 1).padStart(3, "0")}`,
        gender: randomBool() ? Gender.MALE : Gender.FEMALE,
        shift: randomItem([
          Shift.Morning,
          Shift.Evening,
          Shift.Night,
        ]),
        isActive: true,
        userId: user.id,
      },
    });
  }

  // =========================
  // PATIENTS
  // =========================

  const createdPatients = [];

  for (let i = 0; i < 20; i++) {
    const patient = await prisma.patient.create({
      data: {
        patientId: `PAT-${String(i + 1).padStart(3, "0")}`,
        fullname: patientNames[i],
        age: Math.floor(Math.random() * 60) + 18,
        gender: randomBool() ? Gender.MALE : Gender.FEMALE,
        phone: `016300000${String(i).padStart(2, "0")}`,
        email: `patient${i + 1}@mail.com`,
        address: "Dhaka, Bangladesh",
        bloodGroup: randomItem(bloodGroups),
        allergies: randomBool() ? "Dust Allergy" : null,
        emergencyName: "Emergency Contact",
        emergencyPhone: "01799999999",
        relationship: "Brother",
      },
    });

    createdPatients.push(patient);
  }

  // =========================
  // APPOINTMENTS
  // =========================

  for (let i = 0; i < 10; i++) {
    const doctor = randomItem(createdDoctors);
    const patient = randomItem(createdPatients);

    const availableSlots = await prisma.slot.findMany({
      where: {
        is_booked: false,
        availability: {
          doctorId: doctor.id,
          status: Status.Available,
        },
      },
      include: {
        availability: true,
      },
    });

    if (availableSlots.length === 0) continue;

    const slot = randomItem(availableSlots);

    const appointmentDate = randomDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7 days ahead
    );

    const now = new Date();

    const status =
      appointmentDate < now
        ? AppointmentStatus.CHECKED_IN
        : AppointmentStatus.SCHEDULED;

    await prisma.appointment.create({
      data: {
        date: appointmentDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status,
        patientId: patient.id,
        doctorId: doctor.id,
        slotId: slot.id,
      },
    });

    // Mark slot booked
    await prisma.slot.update({
      where: {
        id: slot.id,
      },
      data: {
        is_booked: true,
      },
    });
  }

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });