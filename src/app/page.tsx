import Link from "next/link";
import { getActiveEmployees } from "@/lib/repo";

export default async function Home() {
  const employees = await getActiveEmployees();

  return (
    <div className="page">
      <div className="container">
        <div>
          <div className="title">Team Clock</div>
          <div className="subtitle">Tap your name to clock in or out.</div>
        </div>

        {employees.length === 0 ? (
          <div className="card">
            <div className="subtitle">
              No team members yet. Ask an admin to add everyone from the{" "}
              <Link href="/admin" className="link" style={{ color: "var(--accent)" }}>
                admin dashboard
              </Link>
              .
            </div>
          </div>
        ) : (
          <div className="employee-grid">
            {employees.map((e) => (
              <Link key={e.id} href={`/login/${e.id}`} className="employee-card">
                <div className="avatar">{initials(e.name)}</div>
                <div className="employee-name">{e.name}</div>
              </Link>
            ))}
          </div>
        )}

        <Link href="/admin" className="link">
          Admin dashboard →
        </Link>
      </div>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
