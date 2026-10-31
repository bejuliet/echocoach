"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";

export default function NewStudentPage() {
  const router = useRouter();
  const sports = useQuery(api.studentPortal.authorizedSports);
  const createStudent = useMutation(api.stage2Students.createStage2Student);
  const [name, setName] = useState("");
  const [sportId, setSportId] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Student name is required.");
      return;
    }
    if (!sportId) {
      setError("Choose an authorized Sport.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await createStudent({
        name: trimmedName,
        sportId: sportId as never,
        mobilePhone: mobilePhone.trim() || undefined,
        email: email.trim() || undefined,
        contactName: contactName.trim() || undefined,
      });
      router.push(`/students/${result.studentId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create Student.");
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl">
      <div className="mb-6"><p className="text-sm text-muted">Stage 2</p><h1 className="text-3xl font-semibold text-tennis-900">Add student</h1><p className="mt-2 text-sm text-ink-muted">Create a Student and enroll them in one of your authorized Sports.</p></div>
      <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-line bg-card p-6">
        <label className="grid gap-1 text-sm font-medium">Student name *<input autoFocus required value={name} onChange={(event) => setName(event.target.value)} className="rounded-xl border border-line px-3 py-2 font-normal" /></label>
        <label className="grid gap-1 text-sm font-medium">Sport *<select required value={sportId} onChange={(event) => setSportId(event.target.value)} disabled={sports === undefined || sports.length === 0} className="rounded-xl border border-line px-3 py-2 font-normal"><option value="">{sports === undefined ? "Loading authorized Sports…" : sports.length === 0 ? "No authorized Sports available" : "Choose a Sport"}</option>{sports?.map((sport) => <option key={sport.sportId} value={sport.sportId}>{sport.name}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-medium">Contact name<input value={contactName} onChange={(event) => setContactName(event.target.value)} className="rounded-xl border border-line px-3 py-2 font-normal" /></label>
        <label className="grid gap-1 text-sm font-medium">Mobile phone<input value={mobilePhone} onChange={(event) => setMobilePhone(event.target.value)} className="rounded-xl border border-line px-3 py-2 font-normal" /></label>
        <label className="grid gap-1 text-sm font-medium">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-xl border border-line px-3 py-2 font-normal" /></label>
        {sports?.length === 0 && <p className="text-sm text-ink-muted">Ask an administrator to associate a Sport with your Coach account before creating Students.</p>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="mt-2 flex gap-3"><button type="button" onClick={() => router.push("/students")} className="rounded-full border border-line px-5 py-2 text-sm font-medium text-ink-muted" disabled={saving}>Cancel</button><button type="submit" className="rounded-full bg-tennis-700 px-5 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={saving || sports === undefined || sports.length === 0}>{saving ? "Saving…" : "Create student"}</button></div>
      </form>
    </main>
  );
}
