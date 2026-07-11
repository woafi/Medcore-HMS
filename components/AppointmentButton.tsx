"use client";

interface AppointmentButtonProps {
  text: string;
  disabled?: boolean;
  onClick: () => void;
}

const AppointmentButton = ({ text, disabled = false, onClick }: AppointmentButtonProps) => {
  const style = (status: string) => {
    switch (status) {
      case "Checked in":
      case "Checked In":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "In progress":
      case "In Progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "Waiting":
        return "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300";
      case "Scheduled":
      default:
        return "bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-200";
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${style(text)} px-3 py-2 rounded-xl text-sm font-semibold border border-primary/30 transition-opacity ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:opacity-95"
      }`}
    >
      {text}
    </button>
  );
};

export default AppointmentButton;
