"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Button, Card, PageHeader } from "@/app/components/ui";

type Form = {
  name: string; status: "Active" | "Inactive"; startDate: string;
  baselineClassesTaken: string; notes: string; className: string;
  students: string; classType: "1:1" | "1:2" | "1:3" | "1:4";
  classStatus: "Active" | "Inactive"; cycle: string;
};

function today() { return new Date().toLocaleDateString("en-CA"); }

const initialForm = (): Form => ({
  name: "", status: "Active", startDate: today(), baselineClassesTaken: "0",
  notes: "", className: "", students: "", classType: "1:1", classStatus: "Active", cycle: "Weekly",
});

export default function NewStudentPage() {
  const router = useRouter();
  const createWithClass = useMutation(api.students.createWithClass);
  const [form, setForm] = useState<Form>(initialForm);
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === "name" && (form.className === "" || form.className === `${form.name.trim()} Class`)) {
      setForm((current) => ({ ...current, className: `${String(value).trim()} Class` }));
    }
  }

  function review() {
    setError(null);
    if (!form.name.trim() || !form.className.trim() || !form.students.trim()) {
      setError("Please complete the student name, class name, and students fields."); return;
    }
    setReviewing(true);
  }

  async function submit() {
    setSaving(true); setError(null);
    try {
      await createWithClass({ ...form, name: form.name.trim(), className: form.className.trim(), students: form.students.trim(), baselineClassesTaken: Number(form.baselineClassesTaken), notes: form.notes.trim() || undefined });
      router.push("/review");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add the student.");
      setSaving(false);
    }
  }

  return (
    <main className="min-h-dvh bg-canvas px-5 pb-8">
      <PageHeader title="New Student" onBack={() => router.push("/")} />
      {!reviewing ? <StudentForm form={form} update={update} error={error} onReview={review} /> : <Confirmation form={form} error={error} saving={saving} onBack={() => setReviewing(false)} onConfirm={() => void submit()} />}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-2 text-sm font-medium text-ink">{label}{children}</label>;
}
const inputClass = "min-h-11 w-full min-w-0 rounded-2xl border border-line bg-card px-4 text-base font-normal text-ink outline-none focus:border-tennis-700 focus:ring-2 focus:ring-tennis-700/20";

function StudentForm({ form, update, error, onReview }: { form: Form; update: <K extends keyof Form>(key: K, value: Form[K]) => void; error: string | null; onReview: () => void }) {
  return <div className="mx-auto flex max-w-lg flex-col gap-4 pt-4"><p className="text-sm text-ink-muted">Add a student and their class. You can review everything before saving.</p><Card className="flex flex-col gap-4">
    <h2 className="text-lg font-semibold text-tennis-900">Student</h2>
    <Field label="Student name *"><input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Emma" /></Field>
    <div className="grid grid-cols-[0.85fr_1.15fr] gap-3"><Field label="Status"><select className={inputClass} value={form.status} onChange={(e) => update("status", e.target.value as Form["status"])}><option>Active</option><option>Inactive</option></select></Field><Field label="Start date"><input type="date" className={inputClass} value={form.startDate} onChange={(e) => update("startDate", e.target.value)} /></Field></div>
    <Field label="Previous classes taken"><input type="number" min="0" step="1" className={inputClass} value={form.baselineClassesTaken} onChange={(e) => update("baselineClassesTaken", e.target.value)} /></Field>
    <Field label="Notes (optional)"><textarea className={`${inputClass} py-3`} rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></Field>
    <h2 className="pt-2 text-lg font-semibold text-tennis-900">Class</h2>
    <Field label="Class name *"><input className={inputClass} value={form.className} onChange={(e) => update("className", e.target.value)} /></Field>
    <Field label="Students *"><input className={inputClass} value={form.students} onChange={(e) => update("students", e.target.value)} placeholder="e.g. Emma, Noah" /></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Class type"><select className={inputClass} value={form.classType} onChange={(e) => update("classType", e.target.value as Form["classType"])}>{["1:1", "1:2", "1:3", "1:4"].map((v) => <option key={v}>{v}</option>)}</select></Field><Field label="Class status"><select className={inputClass} value={form.classStatus} onChange={(e) => update("classStatus", e.target.value as Form["classStatus"])}><option>Active</option><option>Inactive</option></select></Field></div>
    <Field label="Cycle"><select className={inputClass} value={form.cycle} onChange={(e) => update("cycle", e.target.value)}><option>Weekly</option><option>Biweekly</option><option>Monthly</option></select></Field>
    {error && <p className="text-sm text-red-600">{error}</p>}<Button fullWidth onClick={onReview}>Review information</Button>
  </Card></div>;
}

function Confirmation({ form, error, saving, onBack, onConfirm }: { form: Form; error: string | null; saving: boolean; onBack: () => void; onConfirm: () => void }) {
  return <div className="mx-auto flex max-w-lg flex-col gap-4 pt-4"><p className="text-sm text-ink-muted">Please confirm these records before they are created.</p><Card className="flex flex-col gap-3"><h2 className="text-lg font-semibold text-tennis-900">Student</h2><Summary label="Name" value={form.name} /><Summary label="Status" value={form.status} /><Summary label="Start date" value={form.startDate} /><Summary label="Previous classes" value={form.baselineClassesTaken} /><Summary label="Notes" value={form.notes || "—"} /><h2 className="mt-3 text-lg font-semibold text-tennis-900">Class</h2><Summary label="Class name" value={form.className} /><Summary label="Students" value={form.students} /><Summary label="Class type" value={form.classType} /><Summary label="Status" value={form.classStatus} /><Summary label="Cycle" value={form.cycle} />{error && <p className="text-sm text-red-600">{error}</p>}</Card><Button fullWidth onClick={onConfirm} loading={saving}>Confirm & add student</Button><Button fullWidth variant="secondary" onClick={onBack} disabled={saving}>Back / edit</Button></div>;
}
function Summary({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 border-b border-line/70 pb-2 text-sm"><span className="text-ink-muted">{label}</span><span className="text-right font-medium text-ink">{value}</span></div>; }
