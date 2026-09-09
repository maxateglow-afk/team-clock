"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  logout,
  adminAddEmployee,
  adminSetActive,
  adminResetPin,
  adminSaveEntry,
  adminRemoveEntry,
} from "@/app/actions";
import { entryDurationMs, formatDuration, toDateTimeLocal } from "@/lib/time";

type Employee = { id: string; name: string; active: boolean };
type Entry = { id: string; employeeId: string; employeeName: string; clockIn: string; clockOut: string | null };

export default function AdminDashboard({
  employees,
  entries,
  days,
}: {
  employees: Employee[];
  entries: Entry[];
  days: number;
}) {
  const totalsByEmployee = new Map<string, number>();
  for (const e of entries) {
    const ms = entryDurationMs(new Date(e.clockIn), e.clockOut ? new Date(e.clockOut) : null);
    totalsByEmployee.set(e.employeeName, (totalsByEmployee.get(e.employeeName) ?? 0) + ms);
  }

  return (
    <div className="page">
      <div className="container container-wide">
        <div className="row-between">
          <div className="title">Admin Dashboard</div>
          <form action={logout}>
            <button type="submit" className="link" style={{ background: "none", border: "none", cursor: "pointer" }}>
              Log out
            </button>
          </form>
        </div>

        <div className="card">
          <div className="section-label" style={{ marginBottom: 12 }}>
            Team members
          </div>
          <EmployeeList employees={employees} />
          <AddEmployeeForm />
        </div>

        <div className="card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <div className="section-label">Timesheet</div>
            <div className="row">
              {[7, 14, 30].map((d) => (
                <Link
                  key={d}
                  href={`/admin?days=${d}`}
                  className="link"
                  style={{ fontWeight: d === days ? 700 : 400, color: d === days ? "var(--accent)" : undefined }}
                >
                  {d}d
                </Link>
              ))}
              <a href={`/admin/export?days=${days}`} className="link" style={{ color: "var(--accent)" }}>
                Export CSV
              </a>
            </div>
          </div>

          {totalsByEmployee.size > 0 && (
            <div className="row" style={{ flexWrap: "wrap", marginBottom: 16, gap: 16 }}>
              {Array.from(totalsByEmployee.entries()).map(([name, ms]) => (
                <div key={name} className="badge">
                  {name}: {formatDuration(ms)}
                </div>
              ))}
            </div>
          )}

          {entries.length === 0 ? (
            <div className="subtitle">No entries in this range.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="timesheet">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Clock in</th>
                    <th>Clock out</th>
                    <th>Duration</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <EntryRow key={e.id} entry={e} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Link href="/" className="link">
          ← Back to clock
        </Link>
      </div>
    </div>
  );
}

function EmployeeList({ employees }: { employees: Employee[] }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {employees.length === 0 && <div className="subtitle">No team members yet — add one below.</div>}
      {employees.map((emp) => (
        <EmployeeRow key={emp.id} employee={emp} />
      ))}
    </div>
  );
}

function EmployeeRow({ employee }: { employee: Employee }) {
  const [pending, startTransition] = useTransition();
  const [showReset, setShowReset] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function toggleActive() {
    startTransition(() => adminSetActive(employee.id, !employee.active));
  }

  function submitReset() {
    setError(null);
    startTransition(async () => {
      const result = await adminResetPin(employee.id, newPin);
      if (result?.error) setError(result.error);
      else {
        setShowReset(false);
        setNewPin("");
      }
    });
  }

  return (
    <div className="employee-manage-row">
      <div className="row">
        <span>{employee.name}</span>
        {!employee.active && <span className="badge inactive">inactive</span>}
      </div>
      <div className="row">
        {showReset ? (
          <>
            <input
              className="small-input"
              placeholder="New PIN"
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              style={{ width: 90 }}
            />
            <button className="btn btn-primary" style={{ padding: "6px 14px" }} disabled={pending} onClick={submitReset}>
              Save
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: "6px 14px" }}
              onClick={() => {
                setShowReset(false);
                setError(null);
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-secondary" style={{ padding: "6px 14px" }} onClick={() => setShowReset(true)}>
              Reset PIN
            </button>
            <button className="btn btn-secondary" style={{ padding: "6px 14px" }} disabled={pending} onClick={toggleActive}>
              {employee.active ? "Deactivate" : "Reactivate"}
            </button>
          </>
        )}
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

function AddEmployeeForm() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await adminAddEmployee(name, pin);
      if (result?.error) setError(result.error);
      else {
        setName("");
        setPin("");
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="row"
      style={{ flexWrap: "wrap", paddingTop: 12, borderTop: "1px solid var(--border)" }}
    >
      <input
        className="small-input"
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ flex: 1, minWidth: 140 }}
      />
      <input
        className="small-input"
        placeholder="4-digit PIN"
        inputMode="numeric"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        style={{ width: 110 }}
      />
      <button type="submit" className="btn btn-primary" style={{ padding: "8px 18px" }} disabled={pending}>
        Add member
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}

function EntryRow({ entry }: { entry: Entry }) {
  const [clockIn, setClockIn] = useState(toDateTimeLocal(new Date(entry.clockIn)));
  const [clockOut, setClockOut] = useState(entry.clockOut ? toDateTimeLocal(new Date(entry.clockOut)) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const durationMs = entryDurationMs(new Date(clockIn || entry.clockIn), clockOut ? new Date(clockOut) : null);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await adminSaveEntry(entry.id, clockIn, clockOut);
      if (result?.error) setError(result.error);
    });
  }

  function remove() {
    if (!confirm(`Delete this entry for ${entry.employeeName}?`)) return;
    startTransition(() => adminRemoveEntry(entry.id));
  }

  return (
    <tr>
      <td>{entry.employeeName}</td>
      <td>
        <input type="datetime-local" value={clockIn} onChange={(e) => setClockIn(e.target.value)} />
      </td>
      <td>
        <input type="datetime-local" value={clockOut} onChange={(e) => setClockOut(e.target.value)} />
      </td>
      <td>{formatDuration(durationMs)}</td>
      <td>
        <div className="row">
          <button className="btn btn-secondary" style={{ padding: "5px 12px" }} disabled={pending} onClick={save}>
            Save
          </button>
          <button className="btn btn-secondary" style={{ padding: "5px 12px" }} disabled={pending} onClick={remove}>
            Delete
          </button>
        </div>
        {error && <div className="error">{error}</div>}
      </td>
    </tr>
  );
}
