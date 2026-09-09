import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getEmployeeName, getOpenEntry, getEntriesForEmployee } from "@/lib/repo";
import { daysAgo, entryDurationMs } from "@/lib/time";
import ClockPanel from "./ClockPanel";

export default async function ClockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "employee" || session.employeeId !== id) {
    redirect(`/login/${id}`);
  }

  const name = await getEmployeeName(id);
  if (!name) notFound();

  const openEntry = await getOpenEntry(id);
  const weekEntries = await getEntriesForEmployee(id, daysAgo(7));
  const weekTotalMs = weekEntries.reduce((sum, e) => sum + entryDurationMs(e.clockIn, e.clockOut), 0);

  return (
    <ClockPanel
      employeeId={id}
      name={name}
      openEntry={openEntry ? { clockIn: openEntry.clockIn.toISOString() } : null}
      entries={weekEntries.map((e) => ({
        id: e.id,
        clockIn: e.clockIn.toISOString(),
        clockOut: e.clockOut ? e.clockOut.toISOString() : null,
      }))}
      weekTotalMs={weekTotalMs}
    />
  );
}
