"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { doClockIn, doClockOut, logout } from "@/app/actions";
import { formatClockTime, formatDay, formatDuration } from "@/lib/time";

type Entry = { id: string; clockIn: string; clockOut: string | null };

export default function ClockPanel({
  employeeId,
  name,
  openEntry,
  entries,
  weekTotalMs,
}: {
  employeeId: string;
  name: string;
  openEntry: { clockIn: string } | null;
  entries: Entry[];
  weekTotalMs: number;
}) {
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!openEntry) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [openEntry]);

  const liveMs = openEntry ? now - new Date(openEntry.clockIn).getTime() : 0;

  function toggle() {
    startTransition(async () => {
      if (openEntry) {
        await doClockOut(employeeId);
      } else {
        await doClockIn(employeeId);
      }
    });
  }

  const grouped = groupByDay(entries);

  return (
    <div className="page">
      <div className="container">
        <div className="row-between">
          <div>
            <div className="title">{name}</div>
            <span className={`status-pill ${openEntry ? "" : "off"}`}>
              <span className="status-dot" />
              {openEntry ? `Clocked in since ${formatClockTime(new Date(openEntry.clockIn))}` : "Not clocked in"}
            </span>
          </div>
          <form action={logout}>
            <button type="submit" className="link" style={{ background: "none", border: "none", cursor: "pointer" }}>
              Log out
            </button>
          </form>
        </div>

        <button
          onClick={toggle}
          disabled={pending}
          className={`btn-clock ${openEntry ? "out" : "in"}`}
          style={{ border: "none" }}
        >
          {pending ? "Working..." : openEntry ? `Clock Out (${formatDuration(liveMs)})` : "Clock In"}
        </button>

        <div className="card">
          <div className="row-between">
            <span className="section-label">Last 7 days</span>
            <strong>{formatDuration(weekTotalMs)}</strong>
          </div>
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: 10 }}>
            Recent entries
          </div>
          {entries.length === 0 ? (
            <div className="subtitle">No entries yet.</div>
          ) : (
            <div className="entry-list">
              {grouped.map(([day, dayEntries]) => (
                <div key={day}>
                  <div className="subtitle" style={{ marginBottom: 6 }}>
                    {day}
                  </div>
                  {dayEntries.map((e) => (
                    <div key={e.id} className="entry-row">
                      <span>
                        {formatClockTime(new Date(e.clockIn))} –{" "}
                        {e.clockOut ? formatClockTime(new Date(e.clockOut)) : "now"}
                      </span>
                      <span>{formatDuration(new Date(e.clockOut ?? now).getTime() - new Date(e.clockIn).getTime())}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <Link href="/" className="link">
          ← Switch person
        </Link>
      </div>
    </div>
  );
}

function groupByDay(entries: Entry[]): [string, Entry[]][] {
  const map = new Map<string, Entry[]>();
  for (const e of entries) {
    const key = formatDay(new Date(e.clockIn));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries());
}
