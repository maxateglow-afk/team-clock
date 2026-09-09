import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployeeName } from "@/lib/repo";
import PinForm from "./PinForm";

export default async function LoginPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const name = await getEmployeeName(id);
  if (!name) notFound();

  return (
    <div className="page">
      <div className="container" style={{ alignItems: "center", textAlign: "center" }}>
        <div className="avatar" style={{ width: 64, height: 64, fontSize: 22 }}>
          {name[0]?.toUpperCase()}
        </div>
        <div>
          <div className="title">Hi {name}</div>
          <div className="subtitle">Enter your PIN to continue</div>
        </div>
        <PinForm employeeId={id} />
        <Link href="/" className="link">
          ← Back
        </Link>
      </div>
    </div>
  );
}
