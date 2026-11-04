"use client";

import { useState } from "react";

type Props = { token: string };

type Result = {
  message?: string;
  error?: string;
  appointment?: { startTime: string; doctor?: { name: string } };
};

type Tone = "success" | "warning" | "error";

const TONE_STYLES: Record<
  Tone,
  { box: string; title: string; text: string; icon: React.ReactNode }
> = {
  success: {
    box: "border-emerald-200 bg-emerald-50",
    title: "text-emerald-800",
    text: "text-emerald-700",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-emerald-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  warning: {
    box: "border-amber-200 bg-amber-50",
    title: "text-amber-800",
    text: "text-amber-700",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-amber-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
    ),
  },
  error: {
    box: "border-red-200 bg-red-50",
    title: "text-red-800",
    text: "text-red-700",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-red-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
  },
};

const TONE_TITLES: Record<Tone, string> = {
  success: "Appointment confirmed",
  warning: "No slot available today",
  error: "Something went wrong",
};

export default function RescheduleConfirmButton({ token }: Props) {
  const [result, setResult] = useState<string | null>(null);
  const [tone, setTone] = useState<Tone>("error");
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/appointment/reschedule-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await response.json()) as Result;
      if (response.ok && data.appointment?.startTime) {
        const time = new Intl.DateTimeFormat("en-BD", {
          timeZone: "Asia/Dhaka",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(new Date(data.appointment.startTime));
        setTone("success");
        setResult(`Your appointment is confirmed for ${time} (Bangladesh time).`);
      } else if (data.error === "No free slot available for today.") {
        setTone("warning");
        setResult(
          "No free slot is available today. Please contact hospital reception to book another day."
        );
      } else {
        setTone("error");
        setResult(
          data.error ||
            data.message ||
            "Please contact hospital reception for assistance."
        );
      }
    } catch {
      setTone("error");
      setResult("Please contact hospital reception for assistance.");
    } finally {
      setLoading(false);
    }
  }

  const styles = TONE_STYLES[tone];
  const confirmed = tone === "success" && result !== null;

  return (
    <div className="space-y-4">
      {!confirmed && (
        <button
          type="button"
          onClick={confirm}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
          )}
          {loading ? "Confirming..." : "Confirm"}
        </button>
      )}

      {result && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-3 rounded-lg border p-4 ${styles.box}`}
        >
          <span className="mt-0.5 shrink-0">{styles.icon}</span>
          <div>
            <p className={`text-sm font-semibold ${styles.title}`}>
              {TONE_TITLES[tone]}
            </p>
            <p className={`mt-1 text-sm leading-6 ${styles.text}`}>{result}</p>
          </div>
        </div>
      )}
    </div>
  );
}