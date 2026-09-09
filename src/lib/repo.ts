import { prisma } from "@/lib/prisma";
import { hashPin, verifyPin } from "@/lib/pin";

export interface EmployeeSummary {
  id: string;
  name: string;
  active: boolean;
}

export async function getActiveEmployees(): Promise<EmployeeSummary[]> {
  const rows = await prisma.employee.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return rows.map((e) => ({ id: e.id, name: e.name, active: e.active }));
}

export async function getAllEmployees(): Promise<EmployeeSummary[]> {
  const rows = await prisma.employee.findMany({ orderBy: { name: "asc" } });
  return rows.map((e) => ({ id: e.id, name: e.name, active: e.active }));
}

export async function getEmployeeName(id: string): Promise<string | null> {
  const row = await prisma.employee.findUnique({ where: { id } });
  return row?.name ?? null;
}

export async function verifyEmployeePin(employeeId: string, pin: string): Promise<boolean> {
  const row = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!row || !row.active) return false;
  return verifyPin(pin, row.pin);
}

export async function createEmployee(name: string, pin: string) {
  return prisma.employee.create({
    data: { name: name.trim(), pin: hashPin(pin) },
  });
}

export async function setEmployeeActive(id: string, active: boolean) {
  await prisma.employee.update({ where: { id }, data: { active } });
}

export async function resetEmployeePin(id: string, pin: string) {
  await prisma.employee.update({ where: { id }, data: { pin: hashPin(pin) } });
}

export interface TimeEntryData {
  id: string;
  employeeId: string;
  employeeName: string;
  clockIn: Date;
  clockOut: Date | null;
  note: string;
}

export async function getOpenEntry(employeeId: string): Promise<TimeEntryData | null> {
  const row = await prisma.timeEntry.findFirst({
    where: { employeeId, clockOut: null },
    include: { employee: true },
    orderBy: { clockIn: "desc" },
  });
  if (!row) return null;
  return toEntryData(row);
}

export async function clockIn(employeeId: string): Promise<TimeEntryData> {
  const open = await getOpenEntry(employeeId);
  if (open) throw new Error("Already clocked in");
  const row = await prisma.timeEntry.create({
    data: { employeeId, clockIn: new Date() },
    include: { employee: true },
  });
  return toEntryData(row);
}

export async function clockOut(employeeId: string): Promise<TimeEntryData> {
  const open = await prisma.timeEntry.findFirst({
    where: { employeeId, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
  if (!open) throw new Error("Not clocked in");
  const row = await prisma.timeEntry.update({
    where: { id: open.id },
    data: { clockOut: new Date() },
    include: { employee: true },
  });
  return toEntryData(row);
}

export async function getEntriesForEmployee(employeeId: string, since: Date): Promise<TimeEntryData[]> {
  const rows = await prisma.timeEntry.findMany({
    where: { employeeId, clockIn: { gte: since } },
    include: { employee: true },
    orderBy: { clockIn: "desc" },
  });
  return rows.map(toEntryData);
}

export async function getEntriesInRange(from: Date, to: Date): Promise<TimeEntryData[]> {
  const rows = await prisma.timeEntry.findMany({
    where: { clockIn: { gte: from, lt: to } },
    include: { employee: true },
    orderBy: [{ employee: { name: "asc" } }, { clockIn: "desc" }],
  });
  return rows.map(toEntryData);
}

export async function adminUpdateEntry(entryId: string, clockIn: Date, clockOut: Date | null) {
  await prisma.timeEntry.update({ where: { id: entryId }, data: { clockIn, clockOut } });
}

export async function adminDeleteEntry(entryId: string) {
  await prisma.timeEntry.delete({ where: { id: entryId } });
}

function toEntryData(row: {
  id: string;
  employeeId: string;
  employee: { name: string };
  clockIn: Date;
  clockOut: Date | null;
  note: string;
}): TimeEntryData {
  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName: row.employee.name,
    clockIn: row.clockIn,
    clockOut: row.clockOut,
    note: row.note,
  };
}
