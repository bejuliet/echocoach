"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function StudentsPage() {
  const students = useQuery(api.studentPortal.authorizedStudents);
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div><p className="text-sm text-muted">Stage 2</p><h1 className="text-3xl font-semibold text-tennis-900">Students</h1></div>
        <Link href="/students/new" className="rounded-full bg-tennis-700 px-4 py-2 text-sm font-medium text-white">Add student</Link>
      </div>
      {students === undefined && <p className="text-muted">Loading authorized students…</p>}
      {students?.length === 0 && <p className="rounded-2xl border border-line bg-card p-6 text-ink-muted">No authorized students yet.</p>}
      <div className="grid gap-3">{students?.map((student) => <Link key={student.studentId} href={`/students/${student.studentId}`} className="rounded-2xl border border-line bg-card p-5 transition hover:border-tennis-500"><div className="flex items-center justify-between"><span className="font-semibold text-ink">{student.name}</span><span className="text-sm text-ink-muted">{student.sports.join(" · ")}</span></div></Link>)}</div>
    </div>
  );
}
