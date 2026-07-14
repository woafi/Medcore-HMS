# 🏥 MedCore-HMS

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)

</div>

<div align="center">

### 🌐 [Live Demo](https://medcore-hms-live.vercel.app) | 📦 [GitHub Repository](https://github.com/woafi/Medcore-HMS)

</div>

A comprehensive, production-ready hospital management system built with Next.js 16, featuring client-side rendering with SSG for static pages and demonstrating modern full-stack development practices. The application provides complete management of hospital operations including appointments, patient records, doctor management, and multi-role dashboard systems.

> ⚠️ **Deployment Note**: This project is deployed on **Vercel** with **PostgreSQL database on Supabase Free Tier**. The application primarily uses **Client-Side Rendering (CSR)** with **Static Site Generation (SSG)** for static pages. Image uploads are handled through **Cloudinary** for efficient media management.

## ✨ Key Features

### 🏢 Admin Dashboard
- **Comprehensive Analytics**: Real-time KPIs and system metrics
- **Patient Management**: Complete patient registration, profile management, and medical history
- **Doctor Management**: Doctor profiles, specializations, availability scheduling
- **Appointment Management**: View, manage, and track all appointments
- **Receptionist Management**: Manage reception staff and their assignments
- **System Logs**: Monitor system activities and audit trails
- **Role-Based Access Control**: Fine-grained permission management

### 👨‍⚕️ Doctor Dashboard
- **Appointment Schedule**: View upcoming appointments with patient details
- **Patient Directory**: Access complete patient information and medical records
- **Availability Management**: Set and manage consultation availability
- **Daily Summary**: View daily appointment summaries and metrics
- **Patient Search**: Advanced search functionality for patient lookup

### 🎫 Receptionist Dashboard
- **Appointment Booking**: Easy appointment scheduling interface
- **Patient Check-in**: Manage patient arrivals and check-ins
- **Availability Viewing**: Check doctor availability in real-time
- **Appointment Tracking**: Monitor appointment status
- **Quick Actions**: Fast access to common tasks

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control (RBAC)**: Multiple user roles (Super Admin, Admin, Doctor, Receptionist)
- **Password Hashing**: bcrypt for secure password storage
- **Session Management**: Secure session handling with Jose
- **Protected Routes**: Server-side and client-side route protection

### 🎨 User Experience
- **Dark Mode**: System-wide dark/light mode with persistent preferences
- **Real-time Updates**: Pusher integration for live notifications
- **Modern UI/UX**: Clean, intuitive interface with Material Design icons
- **Smooth Navigation**: Optimized page transitions and loading states
- **Form Validation**: Client-side and server-side validation with Zod

## 🛠️ Tech Stack

### Frontend
| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router, Server Components) |
| **Runtime** | React 19 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Icons** | Lucide React, Material Design Symbols |
| **Calendar** | React Calendar |
| **Real-time** | Pusher.js |
| **Theme Management** | Next Themes |
| **Image Upload** | Cloudinary |

### Backend
| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (Server Actions, API Routes) |
| **Runtime** | Node.js |
| **Database** | PostgreSQL (hosted on Supabase) |
| **ORM** | Prisma |
| **Authentication** | JWT (jose), bcrypt |
| **Real-time** | Pusher |
| **Validation** | Zod |

### Deployment & Hosting
| Service | Platform |
|---------|----------|
| **Frontend & Backend** | Vercel (Free Tier) |
| **Database** | Supabase PostgreSQL (Free Tier) |
| **Real-time** | Pusher (Free Plan) |
| **Image Storage** | Cloudinary |

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** for version control
- **PostgreSQL** (v14 or higher) OR Supabase account for cloud database

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/woafi/Medcore-HMS.git
cd Medcore-HMS
```

### 2. Setup PostgreSQL Database

You can use either a local PostgreSQL installation or Supabase (cloud-hosted PostgreSQL):

#### Option A: Local PostgreSQL

```bash
# Open PostgreSQL prompt
psql -U postgres

# Create the database
CREATE DATABASE hospital_management_db;

# Exit PostgreSQL prompt
\q
```

#### Option B: Supabase (Recommended for Production)

1. Create a free account at [Supabase](https://supabase.com/)
2. Create a new project
3. Go to Project Settings → Database
4. Copy the connection string (format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)

### 3. Environment Setup

Create a `.env.local` file in the root directory:

#### For Local PostgreSQL:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/hospital_management_db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXT_PUBLIC_API_URL="http://localhost:3000"
PUSHER_APP_ID="your-pusher-app-id"
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="mt1"
PUSHER_SECRET="your-pusher-secret"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

#### For Supabase (Production):
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXT_PUBLIC_API_URL="https://medcore-hms-live.vercel.app"
PUSHER_APP_ID="your-pusher-app-id"
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="mt1"
PUSHER_SECRET="your-pusher-secret"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

### 4. Install Dependencies

```bash
npm install
# or
yarn install
```

### 5. Setup Prisma & Database

```bash
# Generate Prisma Client
npx prisma generate

# Push database schema
npx prisma db push

# Optional: Seed the database with demo data
npx prisma db seed
```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## 🧪 Demo Credentials

After setting up the database, use these demo credentials to login:

**Admin Account**
- phone: 01700000000
- Password: Admin@123

**Doctor Account**
- phone: 01810000013
- Password: Doctor@123

**Receptionist Account**
- phone: 01920000009
- Password: Reception@123

## 📁 Project Structure

```
Medcore-HMS/
├── app/
│   ├── actions/                         # Server Actions
│   │   ├── appointmentActions.ts        # Appointment operations
│   │   ├── availabilityActions.ts       # Doctor availability management
│   │   ├── doctorFormsubmissionAction.ts # Doctor form submission
│   │   ├── loginAction.ts               # Authentication
│   │   ├── logoutAction.ts              # Logout
│   │   ├── patientEditFormsubmissionAction.ts # Patient profile updates
│   │   ├── patientFormsubmissionAction.ts # Patient registration
│   │   └── receptionistFormsubmissionAction.ts # Receptionist management
│   ├── api/                             # API Routes
│   │   ├── admindashboard/              # Admin dashboard endpoints
│   │   ├── doctordashboard/             # Doctor dashboard endpoints
│   │   ├── doctors/                     # Doctor management endpoints
│   │   └── receptiondashboard/          # Reception dashboard endpoints
│   ├── dashboard/                       # Dashboard pages
│   │   ├── layout.tsx                   # Dashboard layout wrapper
│   │   ├── page.tsx                     # Main dashboard page
│   │   └── (list)/                      # Dashboard sub-pages
│   ├── doctor/                          # Doctor pages
│   │   ├── layout.tsx                   # Doctor layout
│   │   └── [doctorId]/                  # Dynamic doctor profile
│   ├── receptionist/                    # Receptionist pages
│   │   ├── layout.tsx                   # Receptionist layout
│   │   └── [receptionistId]/            # Dynamic receptionist profile
│   ├── settings/                        # Settings pages
│   │   └── page.tsx                     # User settings
│   ├── globals.css                      # Global styles
│   ├── layout.tsx                       # Root layout
│   ├── not-found.tsx                    # 404 page
│   └── page.tsx                         # Home page
│
├── components/                          # Reusable Components
│   ├── AdminDashboard.tsx               # Admin dashboard layout
│   ├── AdminSideNav.tsx                 # Admin navigation
│   ├── AppointmentButton.tsx            # Appointment action button
│   ├── AppointmentCalender.tsx          # Appointment calendar
│   ├── AppointmentSearchBar.tsx         # Appointment search
│   ├── BookAppointment.tsx              # Appointment booking
│   ├── BookAppointmentModal.tsx         # Appointment modal
│   ├── DoctorDashboard.tsx              # Doctor dashboard layout
│   ├── DoctorSideNav.tsx                # Doctor navigation
│   ├── DailySummaryMetrics.tsx          # Daily KPI metrics
│   ├── KPICard.tsx                      # KPI card component
│   ├── TypeaheadSearch.tsx              # Doctor search with autocomplete
│   ├── WeeklyAvailability.tsx           # Weekly schedule display
│   ├── patient/                         # Patient components
│   │   ├── PatientFormUI.tsx            # Patient form
│   │   ├── EditPatientModal.tsx         # Patient edit modal
│   │   └── EditPatientTrigger.tsx       # Edit trigger button
│   └── ...                              # Other UI components
│
├── Design/                              # Design references and prototypes
│   ├── executive_management_dashboard/  # Dashboard design
│   ├── doctor_consultation_workspace/   # Doctor workspace design
│   ├── comprehensive_patient_profile/   # Patient profile design
│   └── ...                              # Other design assets
│
├── lib/                                 # Utility functions
│   ├── auth.ts                          # Authentication utilities
│   ├── dashboardLog.ts                  # Dashboard logging
│   ├── getRoleHome.ts                   # Role-based home routing
│   ├── navLinks.ts                      # Navigation link definitions
│   ├── patientFormHelpers.ts            # Form helpers
│   ├── prisma.ts                        # Prisma client instance
│   ├── pusher.ts                        # Pusher configuration
│   ├── timeFormat.ts                    # Time formatting utilities
│   └── userTypes.ts                     # TypeScript type definitions
│
├── prisma/
│   ├── schema.prisma                    # Database schema
│   ├── seed.js                          # Database seeding script
│   └── migrations/                      # Migration history
│
├── public/                              # Static assets
│
├── next.config.ts                       # Next.js configuration
├── postcss.config.mjs                   # PostCSS configuration
├── eslint.config.mjs                    # ESLint configuration
├── tsconfig.json                        # TypeScript config
├── package.json                         # Project dependencies
└── README.md                            # Project documentation
```

## 🏗️ Database Schema

### User Roles
- **SUPER_ADMIN**: Full system access
- **ADMIN**: Hospital administration and management
- **DOCTOR**: Medical staff with patient appointments
- **RECEPTIONIST**: Front desk operations

### Key Models
- **User**: Authentication and role management
- **Doctor**: Doctor profiles and specializations
- **Patient**: Patient information and medical records
- **Appointment**: Appointment bookings and tracking
- **Availability**: Doctor consultation availability
- **Receptionist**: Reception staff management

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/login` | Login with credentials |
| `POST` | `/api/logout` | Logout user |
| `POST` | `/api/register` | Register new account |

### Admin Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admindashboard` | Get admin dashboard data |
| `GET` | `/api/admindashboard/metrics` | Get system metrics |
| `GET` | `/api/admindashboard/logs` | Get system logs |

### Doctor Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/doctors` | List all doctors |
| `GET` | `/api/doctors/:id` | Get doctor details |
| `POST` | `/api/doctors` | Create new doctor |
| `PUT` | `/api/doctors/:id` | Update doctor profile |
| `GET` | `/api/doctors/:id/availability` | Get doctor availability |

### Doctor Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/doctordashboard` | Get doctor dashboard |
| `GET` | `/api/doctordashboard/appointments` | Get doctor's appointments |
| `GET` | `/api/doctordashboard/patients` | Get doctor's patients |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/appointments/book` | Book new appointment |
| `GET` | `/api/appointments/:id` | Get appointment details |
| `PUT` | `/api/appointments/:id` | Update appointment |
| `DELETE` | `/api/appointments/:id` | Cancel appointment |

### Reception Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/receptiondashboard` | Get reception dashboard |
| `POST` | `/api/receptiondashboard/checkin` | Patient check-in |

## 🚀 Deployment

This application is deployed on **Vercel** with a **free tier** hosting plan:

### Live Demo
🌐 **[https://medcore-hms-live.vercel.app](https://medcore-hms-live.vercel.app/)**

### Deployment Architecture

- **Frontend & Backend**: Deployed on [Vercel](https://vercel.com/) as a Next.js application
- **Rendering Strategy**: Client-Side Rendering (CSR) with Static Site Generation (SSG) for static pages
- **Database**: PostgreSQL hosted on [Supabase](https://supabase.com/) (Free Tier)
- **Real-time Updates**: [Pusher](https://pusher.com/) for live notifications

### Deployment Setup

1. **Push to GitHub**: Ensure your code is pushed to a GitHub repository
2. **Connect to Vercel**: 
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository
3. **Set Environment Variables**:
   - Add `DATABASE_URL`, `JWT_SECRET`, and other required variables in Vercel project settings
4. **Deploy**: Vercel will automatically build and deploy your application on every push
5. **Database**: Setup Supabase PostgreSQL connection string in environment variables

## 📊 System Highlights

- **Client-Side Rendering**: Dynamic pages rendered on the client for interactivity
- **Real-time Notifications**: Live updates using Pusher integration
- **Multi-Role System**: Comprehensive RBAC for different user types
- **Form Validation**: Both client and server-side validation with Zod
- **Dark Mode**: System-wide theme support with persistence
- **Security**: JWT authentication with bcrypt password hashing
- **Modern Architecture**: Next.js App Router with Server Actions
- **Calendar Integration**: React Calendar for appointment scheduling
- **Search Functionality**: Advanced search with typeahead autocomplete

## 🔒 Security Features

- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ Protected API routes and Server Actions
- ✅ Input validation with Zod
- ✅ Secure session management
- ✅ Environment variables for sensitive data
- ✅ CORS and security headers configuration

## 📦 Environment Variables

### .env.local (Development)

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/hospital_management_db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-here"

# Application
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Real-time Updates (Pusher)
PUSHER_APP_ID="your-pusher-app-id"
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="mt1"
PUSHER_SECRET="your-pusher-secret"

# Image Upload (Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

### .env.production (Deployment)

```env
# Use Supabase PostgreSQL connection string
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Same as development but with production values
JWT_SECRET="your-production-jwt-secret"
NEXT_PUBLIC_API_URL="https://medcore-hms-live.vercel.app"

# Pusher production configuration
PUSHER_APP_ID="your-production-app-id"
NEXT_PUBLIC_PUSHER_KEY="your-production-key"
NEXT_PUBLIC_PUSHER_CLUSTER="mt1"
PUSHER_SECRET="your-production-secret"

# Cloudinary production configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

## 🧪 Testing

1. **Setup**: Follow the installation steps above
2. **Run Development Server**: `npm run dev`
3. **Access Application**: Open `http://localhost:3000`
4. **Login**: Use demo credentials provided above
5. **Test Features**:
   - Admin dashboard and management
   - Doctor profile and availability
   - Appointment booking and management
   - Patient profile management
   - Real-time updates

## 📝 License

This project is open source.

## 👨‍💻 Author

Built as a professional full-stack healthcare management application demonstrating modern web development practices with Next.js 16, client-side rendering with SSG, and comprehensive full-stack architecture.

---

<div align="center">

**Built⚙️ with Next.js 16 & TypeScript**

⭐ Star this repo if you find it helpful!

**[🌐 Live Demo](https://medcore-hms-live.vercel.app) | [📚 GitHub](https://github.com/woafi/Medcore-HMS)**

</div>
