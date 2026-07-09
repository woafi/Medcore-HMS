import AdminDashboard from "@/components/AdminDashboard";

export default function DashboardPage() {
  const pusherConfig = {
    key: process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY || "",
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER || "",
    channel: "admin-dashboard",
    event: "admin-dashboard-updated",
  };

  return (
    <div className="relative flex-1 overflow-x-hidden bg-background text-gray-900 dark:text-gray-100 font-sans">
      <AdminDashboard pusherConfig={pusherConfig} />
    </div>
  );
}
