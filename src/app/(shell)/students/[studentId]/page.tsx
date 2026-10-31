"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const student = useQuery(api.studentPortal.authorizedStudent, { studentId: studentId as never });
  const update = useMutation(api.stage2Students.updateStudentContact);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  if (student === undefined) return <p className="mx-auto max-w-2xl text-muted">Loading student…</p>;
  if (!student) return <p className="mx-auto max-w-2xl text-red-700">Student unavailable or not authorized.</p>;
  async function save(formData: FormData) {
    setMessage("");
    try {
      await update({ studentId: studentId as never, mobilePhone: String(formData.get("mobilePhone") ?? ""), email: String(formData.get("email") ?? ""), contactName: String(formData.get("contactName") ?? "") });
      setDirty(false);
      setMessage("Saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save."); }
  }
  function leaveStudent() {
    if (!dirty || window.confirm("You have unsaved contact changes. Leave this Student?")) {
      window.location.href = "/students";
    }
  }
  return <div className="mx-auto max-w-2xl"><button type="button" onClick={leaveStudent} className="mb-5 text-sm font-medium text-tennis-800 underline-offset-4 hover:underline">← Back to Students</button><p className="text-sm text-muted">{student.sports.map((sport) => sport.name).join(" · ")}</p><h1 className="mt-1 text-3xl font-semibold text-tennis-900">{student.name}</h1><form action={save} className="mt-6 grid gap-4 rounded-2xl border border-line bg-card p-6"><label className="grid gap-1 text-sm font-medium">Contact name<input name="contactName" defaultValue={student.contactName ?? ""} onChange={() => setDirty(true)} className="rounded-xl border border-line px-3 py-2 font-normal" /></label><label className="grid gap-1 text-sm font-medium">Mobile phone<input name="mobilePhone" defaultValue={student.mobilePhone ?? ""} onChange={() => setDirty(true)} className="rounded-xl border border-line px-3 py-2 font-normal" /></label><label className="grid gap-1 text-sm font-medium">Email<input name="email" type="email" defaultValue={student.email ?? ""} onChange={() => setDirty(true)} className="rounded-xl border border-line px-3 py-2 font-normal" /></label><button className="rounded-full bg-tennis-700 px-4 py-2 font-medium text-white" type="submit">Save contacts</button>{message && <p className="text-sm text-ink-muted">{message}</p>}</form></div>;
}
