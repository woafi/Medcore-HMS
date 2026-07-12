"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  getBookingMetaData, 
  searchPatientsAction, 
  getDoctorWeeklyScheduleAction, 
  getDoctorAvailabilityAction, 
  bookAppointmentAction 
} from "@/app/actions/appointmentActions";

// ─── Types ──────────────────────────────────────────────────────────────────

type PatientResult = {
  id: string;
  fullname: string;
  patientId: string;
  phone: string | null;
  profileImage: string | null;
  gender: string;
};

type DoctorMeta = {
  id: string;
  name: string;
  specialization: string;
  consultationFee: number;
};

type Slot = {
  id: string;
  time: string;
  isBooked: boolean;
};

type CalendarDate = {
  dateStr: string;
  dayName: string;
  dayShort: string;
  dateNum: number;
  monthShort: string;
};

type BookAppointmentModalProps = {
  onClose?: () => void;
};

// ─── Icons (inline SVG helpers) ──────────────────────────────────────────────
const Icon = ({ path, className = "w-5 h-5" }: { path: string; className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

const ICONS: Record<string, string> = {
  close:    "M6 18L18 6M6 6l12 12",
  search:   "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  clock:    "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  person:   "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  doctor:   "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  chevron:  "M19 9l-7 7-7-7",
  info:     "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  check:    "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  alert:    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
};

export default function BookAppointmentModal({ onClose }: BookAppointmentModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Booking Meta Lists
  const [departments, setDepartments] = useState<string[]>([]);
  const [allDoctors, setAllDoctors] = useState<DoctorMeta[]>([]);
  
  // Selection States
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorMeta | null>(null);
  
  // Patient Selection States
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<PatientResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientSearchRef = useRef<HTMLDivElement | null>(null);

  // Date States (Synchronously initialized next 14 calendar days to avoid useEffect warnings)
  const [availableDates] = useState<CalendarDate[]>(() => {
    const dates: CalendarDate[] = [];
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weekdaysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      dates.push({
        dateStr,
        dayName: weekdays[d.getDay()],
        dayShort: weekdaysShort[d.getDay()],
        dateNum: d.getDate(),
        monthShort: d.toLocaleString("default", { month: "short" }),
      });
    }
    return dates;
  });
  
  const [selectedDateStr, setSelectedDateStr] = useState(""); // YYYY-MM-DD
  const [doctorSchedule, setDoctorSchedule] = useState<Record<string, string>>({}); // Weekly template schedule { Monday: "Available", Friday: "Off_duty" }

  // Slots States
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null); // Slot Object { id, time, ... }
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Error/Success States
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // 1. Fetch booking metadata (departments and doctors) on mount
  useEffect(() => {
    async function loadMeta() {
      const res = await getBookingMetaData();
      if (res.ok) {
        setDepartments(res.departments);
        setAllDoctors(res.doctors);
        if (res.departments.length > 0) {
          const firstDept = res.departments[0];
          setSelectedDept(firstDept);
          const filtered = res.doctors.filter((d: DoctorMeta) => d.specialization === firstDept);
          if (filtered.length > 0) {
            setSelectedDoctor(filtered[0]);
          }
        }
      } else {
        setErrorMessage("Failed to load doctors metadata. Please reload.");
      }
    }
    loadMeta();
  }, []);

  // 2. Fetch selected doctor's weekly template schedule when doctor changes
  useEffect(() => {
    const currentDoctor = selectedDoctor;
    if (!currentDoctor) return;
    
    let active = true;
    async function loadSchedule() {
      const res = await getDoctorWeeklyScheduleAction(currentDoctor!.id);
      if (!active) return;
      if (res.ok) {
        const scheduleMap: Record<string, string> = {};
        res.schedule.forEach((item: { day: string; status: string }) => {
          scheduleMap[item.day] = item.status;
        });
        setDoctorSchedule(scheduleMap);
        
        // Find the first selectable active date and select it
        const firstActiveDate = availableDates.find((d: CalendarDate) => {
          const status = scheduleMap[d.dayName];
          return status === "Available" || status === "Emergency_Only";
        });
        if (firstActiveDate) {
          setSelectedDateStr(firstActiveDate.dateStr);
        } else {
          setSelectedDateStr("");
        }
      }
    }
    loadSchedule();
    return () => {
      active = false;
    };
  }, [selectedDoctor, availableDates]);

  // 3. Fetch slots whenever doctor or selected calendar date changes
  useEffect(() => {
    const currentDoctor = selectedDoctor;
    const currentDateStr = selectedDateStr;
    if (!currentDoctor || !currentDateStr) return;
    
    let active = true;
    async function loadSlots() {
      setIsLoadingSlots(true);
      const res = await getDoctorAvailabilityAction(currentDoctor!.id, currentDateStr);
      
      if (!active) return;
      setIsLoadingSlots(false);
      
      if (res.ok) {
        setSlots(res.slots);
        // Automatically select the first unbooked slot if available
        const firstFree = res.slots.find((s: Slot) => !s.isBooked);
        if (firstFree) {
          setSelectedSlot(firstFree);
        } else {
          setSelectedSlot(null);
        }
      } else {
        setSlots([]);
        setSelectedSlot(null);
      }
    }
    
    loadSlots();
    return () => {
      active = false;
    };
  }, [selectedDoctor, selectedDateStr]);

  // 4. Patient search debounce & fetch
  useEffect(() => {
    const term = patientSearch.trim();
    if (!term) return;

    const timer = setTimeout(async () => {
      const results = await searchPatientsAction(term);
      setPatientResults(results);
      setShowPatientDropdown(results.length > 0);
    }, 300);

    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Handle click outside patient search dropdown to close it
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (patientSearchRef.current && !patientSearchRef.current.contains(e.target as Node)) {
        setShowPatientDropdown(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  // Handle patient input value change (clear results synchronously in event handler to avoid effect warnings)
  const handlePatientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPatientSearch(val);
    if (!val.trim()) {
      setPatientResults([]);
      setShowPatientDropdown(false);
    }
  };

  // 5. Handle department dropdown change
  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextDept = e.target.value;
    setSelectedDept(nextDept);
    
    const filtered = allDoctors.filter((d: DoctorMeta) => d.specialization === nextDept);
    if (filtered.length > 0) {
      setSelectedDoctor(filtered[0]);
    } else {
      setSelectedDoctor(null);
    }
    setSelectedDateStr("");
    setSlots([]);
    setSelectedSlot(null);
  };

  // 6. Handle doctor dropdown change
  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = allDoctors.find((doc: DoctorMeta) => doc.id === e.target.value);
    setSelectedDoctor(found || null);
    setSelectedDateStr("");
    setSlots([]);
    setSelectedSlot(null);
  };

  // 7. Handle final booking confirmation via Server Action
  const handleConfirm = () => {
    if (!selectedPatient) {
      setErrorMessage("Please select a patient first.");
      return;
    }
    if (!selectedDoctor) {
      setErrorMessage("Please select a doctor.");
      return;
    }
    if (!selectedDateStr) {
      setErrorMessage("Please select an appointment date.");
      return;
    }
    if (!selectedSlot) {
      setErrorMessage("Please select an available time slot.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    startTransition(async () => {
      const payload = {
        patientId: selectedPatient.id,
        doctorId: selectedDoctor.id,
        dateString: selectedDateStr,
        slotId: selectedSlot.id,
      };

      const result = await bookAppointmentAction(payload);
      
      if (result.success) {
        setConfirmed(true);
        setSuccessMessage(result.message);
        router.refresh();
        setTimeout(() => {
          setConfirmed(false);
          onClose?.();
        }, 1800);
      } else {
        setErrorMessage(result.message);
      }
    });
  };

  // Financial calculations
  const consultationFee = selectedDoctor ? selectedDoctor.consultationFee : 0;
  const facilityCharge = selectedDoctor ? 15.00 : 0;
  const totalFee = consultationFee + facilityCharge;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="
            bg-white dark:bg-gray-900
            w-full max-w-4xl
            rounded-2xl shadow-2xl
            border border-gray-100 dark:border-gray-800
            flex flex-col
            overflow-hidden
            max-h-[95vh]
          "
        >
          {/* ── Header ── */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600/10 p-2 rounded-xl">
                <Icon path={ICONS.calendar} className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-gray-900 dark:text-white text-lg font-extrabold tracking-tight leading-none">Book New Appointment</h2>
                <p className="text-gray-400 text-xs mt-0.5">Schedule a consultation for a patient</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isPending || confirmed}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <Icon path={ICONS.close} className="w-4 h-4" />
            </button>
          </header>

          {/* ── Error/Success Alert Bar ── */}
          {errorMessage && (
            <div className="px-6 pt-4 shrink-0">
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                <Icon path={ICONS.alert} className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="px-6 pt-4 shrink-0">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                <Icon path={ICONS.check} className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            </div>
          )}

          {/* ── Body ── */}
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">

            {/* Left: Form */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 min-h-0">

              {/* Patient Search */}
              <div className="space-y-1.5" ref={patientSearchRef}>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Patient Name, ID or Phone</label>
                
                {selectedPatient ? (
                  // Selected Patient Chip/Banner
                  <div className="flex items-center justify-between p-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300">
                        {selectedPatient.profileImage ? (
                          <div
                            className="h-full w-full bg-cover bg-center"
                            style={{ backgroundImage: `url("${selectedPatient.profileImage}")` }}
                          />
                        ) : (
                          selectedPatient.fullname.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{selectedPatient.fullname}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          ID: <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedPatient.patientId}</span> · Gender: {selectedPatient.gender}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setPatientSearch("");
                      }}
                      className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                      title="Clear Selection"
                    >
                      <Icon path={ICONS.close} className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  // Search Input with results dropdown
                  <div className="relative group">
                    <Icon path={ICONS.search} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={handlePatientSearchChange}
                      placeholder="Type name, phone, or patient ID..."
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                    />

                    {showPatientDropdown && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl py-1">
                        {patientResults.map((p: PatientResult) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatient(p);
                              setShowPatientDropdown(false);
                              setPatientSearch("");
                              setPatientResults([]);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors border-b border-gray-100 dark:border-gray-800/50 last:border-b-0 cursor-pointer"
                          >
                            <div className="h-8 w-8 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0 flex items-center justify-center text-sm font-bold text-blue-600">
                              {p.profileImage ? (
                                <div
                                  className="h-full w-full bg-cover bg-center"
                                  style={{ backgroundImage: `url("${p.profileImage}")` }}
                                />
                              ) : (
                                p.fullname.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-gray-900 dark:text-white truncate">{p.fullname}</span>
                                <span className="text-[10px] font-bold bg-blue-600/10 text-blue-600 rounded px-1.5 py-0.5">{p.patientId}</span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{p.phone || "No phone record"}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dept & Doctor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Department</label>
                  <div className="relative">
                    <select
                      value={selectedDept}
                      onChange={handleDeptChange}
                      className="appearance-none w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-4 pr-9 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all cursor-pointer"
                    >
                      {departments.map((d: string) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <Icon path={ICONS.chevron} className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Doctor</label>
                  <div className="relative">
                    <select
                      value={selectedDoctor ? selectedDoctor.id : ""}
                      onChange={handleDoctorChange}
                      className="appearance-none w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-4 pr-9 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all cursor-pointer"
                    >
                      {allDoctors
                        .filter((d: DoctorMeta) => d.specialization === selectedDept)
                        .map((d: DoctorMeta) => <option key={d.id} value={d.id}>{d.name}</option>)
                      }
                    </select>
                    <Icon path={ICONS.chevron} className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Date Selector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Select Date</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {availableDates.map(({ dateStr, dayName, dayShort, dateNum, monthShort }: CalendarDate) => {
                    const active = selectedDateStr === dateStr;
                    const status = doctorSchedule[dayName];
                    const disabled = !status || status === "Off_duty";
                    
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedDateStr(dateStr)}
                        className={`
                          flex flex-col items-center py-2 px-1 rounded-xl border text-center transition-all
                          ${disabled
                            ? "opacity-30 cursor-not-allowed border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
                            : active
                              ? "border-blue-600 bg-blue-600 shadow-lg shadow-blue-600/25"
                              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer"
                          }
                        `}
                      >
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${active ? "text-blue-100" : "text-gray-400"}`}>
                          {dayShort}
                        </span>
                        <span className={`text-base font-black mt-0.5 ${active ? "text-white" : "text-gray-800 dark:text-gray-100"}`}>
                          {dateNum}
                        </span>
                        <span className={`text-[8px] font-semibold mt-0.5 ${active ? "text-blue-100" : "text-gray-400"}`}>
                          {monthShort}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                  <span>Available Time Slots</span>
                  {isLoadingSlots && (
                    <span className="text-xs text-blue-500 font-semibold flex items-center gap-1.5 animate-pulse">
                      <span className="block h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                      Checking availability...
                    </span>
                  )}
                </label>
                
                {slots.length === 0 ? (
                  <div className="p-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-center text-xs text-gray-400">
                    {isLoadingSlots 
                      ? "Loading slots..." 
                      : selectedDateStr 
                        ? "No available time slots on this date. Please pick another date." 
                        : "Please select a date to view available time slots."}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {slots.map((slot: Slot) => {
                      const active = selectedSlot?.id === slot.id && !slot.isBooked;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={slot.isBooked}
                          onClick={() => setSelectedSlot(slot)}
                          className={`
                            py-2.5 text-xs font-bold rounded-xl border transition-all
                            ${slot.isBooked
                              ? "line-through text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 cursor-not-allowed"
                              : active
                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/30"
                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                            }
                          `}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Summary */}
            <aside className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-6 flex flex-col justify-between flex-shrink-0">
              <div className="space-y-5">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Appointment Summary</p>

                {/* Summary rows */}
                {[
                  { 
                    icon: ICONS.person,   
                    label: "Patient",    
                    value: selectedPatient ? selectedPatient.fullname : "None selected",         
                    sub: selectedPatient ? `ID: ${selectedPatient.patientId}` : "Please choose patient" 
                  },
                  { 
                    icon: ICONS.doctor,   
                    label: "Doctor",     
                    value: selectedDoctor ? selectedDoctor.name : "None selected",             
                    sub: selectedDoctor ? selectedDoctor.specialization : "Select doctor" 
                  },
                  { 
                    icon: ICONS.clock,    
                    label: "Date & Time",
                    value: selectedDateStr 
                      ? (() => {
                          const dateObj = new Date(`${selectedDateStr}T00:00:00`);
                          const formatted = dateObj.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
                          return formatted;
                        })()
                      : "No date selected", 
                    sub: selectedSlot ? selectedSlot.time : "Choose a time slot" 
                  },
                ].map(({ icon, label, value, sub }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon path={icon} className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{label}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{value}</p>
                      {sub && <p className="text-xs text-gray-400">{sub}</p>}
                    </div>
                  </div>
                ))}

                {/* Fee breakdown */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Consultation Fee</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      ${consultationFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Facility Charge</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      ${facilityCharge.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-300 dark:border-gray-600 mt-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-xl font-black text-blue-600">${totalFee.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-700 dark:text-blue-300 text-xs">
                  <Icon path={ICONS.info} className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>A confirmation SMS will be sent to the patient.</span>
                </div>
                <button
                  onClick={handleConfirm}
                  disabled={confirmed || isPending || !selectedPatient || !selectedDoctor || !selectedDateStr || !selectedSlot}
                  className={`
                    w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer
                    ${confirmed
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-[0.98] cursor-not-allowed"
                      : isPending
                        ? "bg-blue-600/50 text-white cursor-not-allowed"
                        : (!selectedPatient || !selectedDoctor || !selectedDateStr || !selectedSlot)
                          ? "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border border-gray-300/10 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 active:scale-[0.97]"
                    }
                  `}
                >
                  {isPending ? (
                    <span className="block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Icon path={confirmed ? ICONS.check : ICONS.calendar} className="w-4 h-4" />
                  )}
                  {confirmed 
                    ? "Appointment Confirmed!" 
                    : isPending 
                      ? "Booking Consultation..." 
                      : "Confirm Appointment"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending || confirmed}
                  className="w-full py-2 text-sm font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                  Discard Draft
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
