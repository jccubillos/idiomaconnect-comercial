"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

interface CourseView {
  id: string;
  name: string;
  gradeLabel: string | null;
  students: number;
  teachers: string[];
}
interface TeacherView {
  userId: string;
  name: string;
}

const input =
  "w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none transition-colors";

export function AdminConsole({ courses, teachers }: { courses: CourseView[]; teachers: TeacherView[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"cursos" | "alumnos" | "profesores">("cursos");

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(["cursos", "alumnos", "profesores"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-colors ${
              tab === t ? "bg-neon-cyan text-surface" : "bg-white/5 text-ink-dim hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "cursos" && <CoursesTab courses={courses} onChange={() => router.refresh()} />}
      {tab === "alumnos" && <StudentsTab courses={courses} onChange={() => router.refresh()} />}
      {tab === "profesores" && <TeachersTab courses={courses} teachers={teachers} onChange={() => router.refresh()} />}
    </>
  );
}

// ── CURSOS ────────────────────────────────────────────────────────
function CoursesTab({ courses, onChange }: { courses: CourseView[]; onChange: () => void }) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/admin/course", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, gradeLabel: grade }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Falló");
      setName(""); setGrade(""); onChange();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <GlassCard strong className="p-5">
        <h3 className="font-extrabold mb-3">Crear curso</h3>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input className={input} placeholder="Nombre (ej: 7°A)" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={input} placeholder="Nivel (ej: 7° básico)" value={grade} onChange={(e) => setGrade(e.target.value)} />
        </div>
        {err && <p className="text-sm text-neon-red mb-2">{err}</p>}
        <NeonButton variant="primary" onClick={create} loading={busy} disabled={!name.trim()}>Crear curso</NeonButton>
      </GlassCard>

      <div className="grid sm:grid-cols-2 gap-3">
        {courses.map((c) => (
          <GlassCard key={c.id} className="p-4 border border-white/10">
            <div className="flex justify-between items-start mb-1">
              <Link href={`/teacher/course/${c.id}`} className="text-lg font-extrabold text-neon-cyan hover:underline">
                {c.name}
              </Link>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-ink-dim">{c.students} alumnos</span>
            </div>
            {c.gradeLabel && <p className="text-xs text-ink-dim mb-1">{c.gradeLabel}</p>}
            <p className="text-xs text-ink-dim">
              {c.teachers.length ? `👩‍🏫 ${c.teachers.join(", ")}` : "Sin profesor asignado"}
            </p>
          </GlassCard>
        ))}
        {courses.length === 0 && <p className="text-sm text-ink-dim">Aún no hay cursos. Crea el primero arriba.</p>}
      </div>
    </div>
  );
}

// ── ALUMNOS ───────────────────────────────────────────────────────
function StudentsTab({ courses, onChange }: { courses: CourseView[]; onChange: () => void }) {
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function create() {
    setBusy(true); setErr(null); setOkMsg(null);
    try {
      const r = await fetch("/api/admin/student", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, courseId: courseId || null, hobbies }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Falló");
      setOkMsg(`Alumno "${name}" creado.`); setName(""); setHobbies(""); onChange();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return (
    <GlassCard strong className="p-5">
      <h3 className="font-extrabold mb-1">Agregar alumno</h3>
      <p className="text-sm text-ink-dim mb-3">El alumno aparecerá en el curso elegido. Los hobbies personalizan sus lecciones.</p>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <input className={input} placeholder="Nombre del alumno" value={name} onChange={(e) => setName(e.target.value)} />
        <select className={input} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">Sin curso</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <input className={`${input} mb-3`} placeholder="Hobbies (opcional, ej: fútbol, dibujar)" value={hobbies} onChange={(e) => setHobbies(e.target.value)} />
      {err && <p className="text-sm text-neon-red mb-2">{err}</p>}
      {okMsg && <p className="text-sm text-neon-green mb-2">{okMsg}</p>}
      <NeonButton variant="primary" onClick={create} loading={busy} disabled={!name.trim()}>Agregar alumno</NeonButton>
    </GlassCard>
  );
}

// ── PROFESORES ────────────────────────────────────────────────────
function TeachersTab({ courses, teachers, onChange }: { courses: CourseView[]; teachers: TeacherView[]; onChange: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [courseId, setCourseId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);

  // Asignar profesor existente a un curso.
  const [assignTeacher, setAssignTeacher] = useState("");
  const [assignCourse, setAssignCourse] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  async function createTeacher() {
    setBusy(true); setErr(null); setCreds(null);
    try {
      const r = await fetch("/api/admin/teacher", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, courseId: courseId || null }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Falló");
      setCreds({ email: j.email, password: j.password });
      setFullName(""); setEmail(""); setCourseId(""); onChange();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  async function assign() {
    setAssignBusy(true); setAssignMsg(null);
    try {
      const r = await fetch("/api/admin/course", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: assignCourse, teacherUserId: assignTeacher }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Falló");
      setAssignMsg("✓ Profesor asignado."); onChange();
    } catch (e) { setAssignMsg(e instanceof Error ? e.message : String(e)); }
    finally { setAssignBusy(false); }
  }

  return (
    <div className="space-y-5">
      <GlassCard strong className="p-5">
        <h3 className="font-extrabold mb-1">Crear cuenta de profesor</h3>
        <p className="text-sm text-ink-dim mb-3">Se genera una contraseña temporal que debes entregarle. Podrá cambiarla luego.</p>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input className={input} placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input className={input} type="email" placeholder="Correo del profesor" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <select className={`${input} mb-3`} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">Asignar a un curso (opcional)</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {err && <p className="text-sm text-neon-red mb-2">{err}</p>}
        {creds && (
          <div className="text-sm bg-neon-green/10 border border-neon-green/30 rounded-lg p-3 mb-3">
            <div className="font-bold text-neon-green mb-1">✓ Cuenta creada</div>
            <div>Correo: <b>{creds.email}</b></div>
            <div>Contraseña temporal: <b className="text-neon-cyan">{creds.password}</b></div>
            <div className="text-xs text-ink-dim mt-1">Entrégasela al profesor. Anótala ahora: no se vuelve a mostrar.</div>
          </div>
        )}
        <NeonButton variant="primary" onClick={createTeacher} loading={busy} disabled={!fullName.trim() || !email.trim()}>
          Crear profesor
        </NeonButton>
      </GlassCard>

      {teachers.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="font-extrabold mb-3">Asignar profesor existente a un curso</h3>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <select className={input} value={assignTeacher} onChange={(e) => setAssignTeacher(e.target.value)}>
              <option value="">Elige profesor</option>
              {teachers.map((t) => <option key={t.userId} value={t.userId}>{t.name}</option>)}
            </select>
            <select className={input} value={assignCourse} onChange={(e) => setAssignCourse(e.target.value)}>
              <option value="">Elige curso</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {assignMsg && <p className="text-sm text-neon-green mb-2">{assignMsg}</p>}
          <NeonButton variant="ghost-cyan" onClick={assign} loading={assignBusy} disabled={!assignTeacher || !assignCourse}>
            Asignar
          </NeonButton>
        </GlassCard>
      )}
    </div>
  );
}
