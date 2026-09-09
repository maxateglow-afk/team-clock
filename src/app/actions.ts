"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, setSession, clearSession } from "@/lib/auth";
import {
  verifyEmployeePin,
  clockIn as repoClockIn,
  clockOut as repoClockOut,
  createEmployee,
  setEmployeeActive,
  resetEmployeePin,
  adminUpdateEntry,
  adminDeleteEntry,
} from "@/lib/repo";
import { fromDateTimeLocal } from "@/lib/time";

export async function loginEmployee(employeeId: string, pin: string): Promise<{ error?: string }> {
  const ok = await verifyEmployeePin(employeeId, pin);
  if (!ok) return { error: "Incorrect PIN. Try again." };
  await setSession({ role: "employee", employeeId });
  redirect(`/clock/${employeeId}`);
}

export async function loginAdmin(pin: string): Promise<{ error?: string }> {
  if (pin !== (process.env.ADMIN_PIN ?? "")) return { error: "Incorrect PIN." };
  await setSession({ role: "admin" });
  redirect("/admin");
}

export async function logout() {
  await clearSession();
  redirect("/");
}

async function requireEmployee(employeeId: string) {
  const session = await getSession();
  if (!session || session.role !== "employee" || session.employeeId !== employeeId) {
    throw new Error("Not authorized");
  }
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Not authorized");
}

export async function doClockIn(employeeId: string) {
  await requireEmployee(employeeId);
  await repoClockIn(employeeId);
  revalidatePath(`/clock/${employeeId}`);
}

export async function doClockOut(employeeId: string) {
  await requireEmployee(employeeId);
  await repoClockOut(employeeId);
  revalidatePath(`/clock/${employeeId}`);
}

export async function adminAddEmployee(name: string, pin: string): Promise<{ error?: string }> {
  await requireAdmin();
  if (!name.trim()) return { error: "Name is required." };
  if (!/^\d{4,8}$/.test(pin)) return { error: "PIN must be 4-8 digits." };
  await createEmployee(name, pin);
  revalidatePath("/admin");
  return {};
}

export async function adminSetActive(id: string, active: boolean) {
  await requireAdmin();
  await setEmployeeActive(id, active);
  revalidatePath("/admin");
}

export async function adminResetPin(id: string, pin: string): Promise<{ error?: string }> {
  await requireAdmin();
  if (!/^\d{4,8}$/.test(pin)) return { error: "PIN must be 4-8 digits." };
  await resetEmployeePin(id, pin);
  revalidatePath("/admin");
  return {};
}

export async function adminSaveEntry(
  entryId: string,
  clockInLocal: string,
  clockOutLocal: string,
): Promise<{ error?: string }> {
  await requireAdmin();
  const clockIn = fromDateTimeLocal(clockInLocal);
  const clockOut = clockOutLocal ? fromDateTimeLocal(clockOutLocal) : null;
  if (clockOut && clockOut <= clockIn) return { error: "Clock out must be after clock in." };
  await adminUpdateEntry(entryId, clockIn, clockOut);
  revalidatePath("/admin");
  return {};
}

export async function adminRemoveEntry(entryId: string) {
  await requireAdmin();
  await adminDeleteEntry(entryId);
  revalidatePath("/admin");
}
