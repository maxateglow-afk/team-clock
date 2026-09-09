import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getEntriesInRange } from "@/lib/repo";
import { daysAgo, entryDurationMs } from "@/lib/time";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const daysParam = Number(request.nextUrl.searchParams.get("days"));
  const days = [7, 14, 30].includes(daysParam) ? daysParam : 7;
  const entries = await getEntriesInRange(daysAgo(days), new Date());

  const header = ["Employee", "Clock in", "Clock out", "Hours"];
  const rows = entries.map((e) => [
    e.employeeName,
    e.clockIn.toISOString(),
    e.clockOut ? e.clockOut.toISOString() : "",
    (entryDurationMs(e.clockIn, e.clockOut) / 3600000).toFixed(2),
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="timesheet-${days}d.csv"`,
    },
  });
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
