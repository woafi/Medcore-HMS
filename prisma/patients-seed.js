// prisma/patients-seed.js

const { PrismaClient, Role, Gender, BloodGroup } = require("@prisma/client");
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

// =========================
// CONSTANTS
// =========================

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

const addresses = [
  "Dhaka, Bangladesh",
  "Chattogram, Bangladesh",
  "Sylhet, Bangladesh",
  "Khulna, Bangladesh",
  "Rajshahi, Bangladesh",
];

const allergies = [
  "Dust Allergy",
  "Pollen Allergy",
  "Penicillin Allergy",
  "Food Allergy",
];

const relationships = [
  "Brother",
  "Sister",
  "Father",
  "Mother",
  "Spouse",
  "Son",
  "Daughter",
];

const emergencyPhones = [
  "01711111111",
  "01822222222",
  "01933333333",
];

const bloodGroups = Object.values(BloodGroup);

// =========================
// MAIN SEED
// =========================

async function main() {
  console.log("🧑 Seeding patients...");

  // =========================
  // PASSWORD
  // =========================

  const PATIENT_PASSWORD = process.env.PATIENT_PASSWORD;

  if (!PATIENT_PASSWORD) {
    throw new Error("PATIENT_PASSWORD is not defined in the .env file");
  }

  // =========================
  // CLEAN PATIENT DATA
  // =========================

  const existingPatients = await prisma.patient.findMany({
    select: { id: true },
  });

  await prisma.appointment.deleteMany({
    where: {
      patientId: {
        in: existingPatients.map((p) => p.id),
      },
    },
  });

  await prisma.patient.deleteMany();

  // =========================
  // PATIENTS
  // =========================

  const patientPassword = await bcrypt.hash(PATIENT_PASSWORD, 10);

  const availableNames = [...patientNames];

  for (let i = 0; i < 10; i++) {
    const name = availableNames.splice(
      Math.floor(Math.random() * availableNames.length),
      1
    )[0];

    const age = Math.floor(Math.random() * 60) + 18;

    const user = await prisma.user.create({
      data: {
        email: `patient${i + 1}@hms.com`,
        password: patientPassword,
        phone: `016${String(i).padStart(2, "0")}54321${i}`,
        role: Role.PATIENT,
      },
    });

    await prisma.patient.create({
      data: {
        patientId: `PAT-${String(i + 1).padStart(3, "0")}`,
        fullname: name,
        dateOfBirth: randomDate(
          new Date(new Date().getFullYear() - age - 1),
          new Date(new Date().getFullYear() - age)
        ),
        age,
        gender: randomBool() ? Gender.MALE : Gender.FEMALE,
        phone: `016300000${String(i).padStart(2, "0")}`,
        email: `patient${i + 1}@mail.com`,
        address: randomItem(addresses),
        bloodGroup: randomItem(bloodGroups),
        allergies: randomBool() ? randomItem(allergies) : null,
        emergencyName: randomItem(patientNames),
        emergencyPhone: randomItem(emergencyPhones),
        relationship: randomItem(relationships),
        isActive: true,
        userId: user.id,
      },
    });
  }

  console.log("✅ Patients seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
