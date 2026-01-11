
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, setDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, UserRole, Assignment } from '../types';
import { Button } from '../components/Button';

interface TeacherDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

interface StudentGrade {
  uid: string;
  fullName: string;
  matricula: string;
  grade: number;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, onLogout }) => {
  const [students, setStudents] = useState<StudentGrade[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Cargar asignaciones del maestro
  useEffect(() => {
    const q = query(collection(db, "assignments"), where("teacherId", "==", user.id));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Assignment));
      setAssignments(list);
      if (list.length > 0 && !selectedAssignmentId) setSelectedAssignmentId(list[0].id);
    });
    return () => unsub();
  }, [user.id]);

  // Buscar todos los alumnos verificados (En un sistema real, filtraríamos por grupo/carrera del assignment)
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", UserRole.STUDENT), where("isVerified", "==", true));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({
        uid: d.id,
        fullName: d.data().fullName,
        matricula: d.data().matricula,
        grade: 0
      }));
      setStudents(list);
    });
    return () => unsubscribe();
  }, []);

  const handleGradeChange = (uid: string, value: string) => {
    const numericValue = Math.min(100, Math.max(0, parseFloat(value) || 0));
    setStudents(prev => prev.map(s => s.uid === uid ? { ...s, grade: numericValue } : s));
  };

  const handleSaveGrades = async () => {
    const currentAssignment = assignments.find(a => a.id === selectedAssignmentId);
    if (!currentAssignment) return alert("Selecciona una materia");

    setLoading(true);
    setMessage('');
    try {
      for (const student of students) {
        const gradeId = `${student.uid}_${currentAssignment.subjectId}_${currentAssignment.groupId}`;
        await setDoc(doc(db, "grades", gradeId), {
          studentId: student.uid,
          studentName: student.fullName,
          studentMatricula: student.matricula,
          teacherId: user.id,
          teacherName: user.fullName,
          subjectName: currentAssignment.subjectName,
          grade: student.grade,
          term: currentAssignment.term,
          period: "Ago-Dic 2024",
          groupName: currentAssignment.groupName,
          updatedAt: new Date().toISOString()
        });
      }
      setMessage('✅ Calificaciones enviadas al Kardex.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMessage('❌ Error al guardar.');
    } finally {
      setLoading(false);
    }
  };

  const activeAssignment = assignments.find(a => a.id === selectedAssignmentId);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-indigo-900 rounded-2xl text-white shadow-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Panel Docente</h1>
            <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em]">{user.fullName}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={onLogout} className="font-black text-xs uppercase px-6">Salir</Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Mis Materias</h2>
            <div className="space-y-3">
              {assignments.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAssignmentId(a.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedAssignmentId === a.id 
                    ? 'bg-indigo-900 border-indigo-900 text-white shadow-xl scale-[1.02]' 
                    : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-black text-[10px] uppercase leading-tight">{a.subjectName}</p>
                  <p className={`text-[9px] font-bold mt-1 ${selectedAssignmentId === a.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                    GRUPO: {a.groupName} • {a.term}° CUAT.
                  </p>
                </button>
              ))}
              {assignments.length === 0 && <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-4">No tienes materias asignadas</p>}
            </div>
          </div>
        </aside>

        <main className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Captura de Calificaciones</h2>
                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">
                  {activeAssignment ? `${activeAssignment.subjectName} | GRUPO ${activeAssignment.groupName}` : 'SELECCIONA UNA MATERIA'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {message && <span className="text-[10px] font-black text-green-600 animate-pulse uppercase">{message}</span>}
                <Button onClick={handleSaveGrades} isLoading={loading} className="px-8 py-3 text-xs font-black uppercase tracking-widest shadow-indigo-200 shadow-xl">Publicar Actas</Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100/50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-8 py-5">Matrícula</th>
                    <th className="px-8 py-5">Alumno</th>
                    <th className="px-8 py-5 text-center">Calificación</th>
                    <th className="px-8 py-5 text-center">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map(s => (
                    <tr key={s.uid} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-8 py-5 font-mono text-xs font-black text-indigo-700">{s.matricula}</td>
                      <td className="px-8 py-5 font-bold text-slate-800 text-sm uppercase">{s.fullName}</td>
                      <td className="px-8 py-5 text-center">
                        <input 
                          type="number" 
                          max="100" min="0"
                          value={s.grade}
                          onChange={(e) => handleGradeChange(s.uid, e.target.value)}
                          className="w-20 text-center px-2 py-2 border-2 border-slate-100 rounded-xl focus:border-indigo-500/50 outline-none font-black text-lg text-indigo-700 bg-white"
                        />
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          s.grade >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {s.grade >= 70 ? 'Aprobado' : 'Reprobado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-black uppercase text-xs italic tracking-widest">
                        Esperando validación de alumnos en ventanilla...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
