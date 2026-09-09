import { getSession } from "@/lib/auth";
import { getAllEmployees, getEntriesInRange } from "@/lib/repo";
import { daysAgo } from "@/lib/time";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: daysParam } = await searchParams;
  const days = [7, 14, 30].includes(Number(daysParam)) ? Number(daysParam) : 7;

  const session = await getSession();
  if (!session || session.role !== "admin") {
    return (
      <div className="page">
        <div className="container" style={{ alignItems: "center", textAlign: "center" }}>
          <div>
            <div className="title">Admin Dashboard</div>
            <div className="subtitle">Enter the admin PIN to continue</div>
          </div>
          <AdminLogin />
        </div>
      </div>
    );
  }

  const employees = await getAllEmployees();
  const from = daysAgo(days);
  const to = new Date();
  const entries = await getEntriesInRange(from, to);

  return (
    <AdminDashboard
      employees={employees}
      days={days}
      entries={entries.map((e) => ({
        id: e.id,
        employeeId: e.employeeId,
        employeeName: e.employeeName,
        clockIn: e.clockIn.toISOString(),
        clockOut: e.clockOut ? e.clockOut.toISOString() : null,
      }))}
    />
  );
}
