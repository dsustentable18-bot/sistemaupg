
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { Button } from '../components/Button';

interface StudentDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

interface GradeRecord {
  id: string;
  subjectName: string;
  grade: number;
  period: string;
  term: number;
  teacherName: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout }) => {
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Consulta real a Firestore filtrando por el ID del alumno
    const q = query(collection(db, "grades"), where("studentId", "==", user.id));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const records = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as GradeRecord[];
      setGrades(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.id]);

  const terms = Array.from({ length: 9 }, (_, i) => i + 1);
  const currentGrades = grades.filter(g => g.term === selectedTerm);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <nav className="bg-indigo-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-indigo-900 font-black">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg font-black leading-none tracking-tight">SISE WEB - KARDEX</h1>
              <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-widest">Portal del Alumno</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onLogout} className="text-white hover:bg-indigo-800 font-bold">
            SALIR
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto w-full flex flex-1 overflow-hidden">
        <aside className="w-20 md:w-64 bg-white border-r border-slate-200 overflow-y-auto hidden sm:block">
          <div className="p-4 border-b border-slate-100 bg-slate-50 text-center">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan de Estudios</h2>
          </div>
          <nav>
            {terms.map(term => (
              <button
                key={term}
                onClick={() => setSelectedTerm(term)}
                className={`w-full flex items-center gap-3 p-4 transition-all border-l-4 ${
                  selectedTerm === term 
                  ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-black shadow-inner' 
                  : 'border-transparent text-slate-500 hover:bg-slate-50 font-medium'
                }`}
              >
                <span className="text-xl font-black opacity-30">{term}°</span>
                <span className="hidden md:inline uppercase text-xs tracking-tighter">Cuatrimestre</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="absolute top-0 right-0 p-4">
              <span className={`px-3 py-1 rounded text-[10px] font-black ${user.isVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {user.isVerified ? 'VERIFICADO' : 'PENDIENTE'}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Nombre Completo</p>
              <p className="text-lg font-black text-slate-800 uppercase leading-none">{user.fullName}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Matrícula</p>
              <p className="text-lg font-mono font-black text-indigo-600">{user.matricula}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Carrera Académica</p>
              <p className="text-md font-bold text-slate-700 uppercase">{user.career || 'No asignada'}</p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Kardex Informativo - {selectedTerm}° Periodo</h3>
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">Promedio Cuatrimestral</p>
                <p className="text-2xl font-black text-indigo-900">
                    {currentGrades.length > 0 ? (currentGrades.reduce((a, b) => a + b.grade, 0) / currentGrades.length).toFixed(1) : '0.0'}
                </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Unidad de Aprendizaje</th>
                  <th className="px-6 py-4">Docente</th>
                  <th className="px-6 py-4 text-center">Calif.</th>
                  <th className="px-6 py-4 text-center">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Consultando base de datos...</td></tr>
                ) : currentGrades.length > 0 ? (
                  currentGrades.map((g) => (
                    <tr key={g.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-800 uppercase text-sm">{g.subjectName}</p>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase">{g.period}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase italic">{g.teacherName}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xl font-mono font-black ${g.grade >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                          {g.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-4 py-1 rounded text-[10px] font-black ${g.grade >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {g.grade >= 70 ? 'ACREDITADA' : 'NO ACREDITADA'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center opacity-30">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        <p className="text-sm font-black uppercase italic">Sin calificaciones registradas para este periodo</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-8 bg-indigo-900 p-6 rounded-xl text-indigo-100 flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
                <h4 className="font-black uppercase tracking-tighter text-lg">Información Importante</h4>
                <p className="text-xs text-indigo-300 font-medium leading-relaxed">
                    Este documento NO tiene validez oficial. Las calificaciones aquí mostradas están sujetas a cambios por parte de la Secretaría Académica hasta el cierre de actas oficial de cada cuatrimestre.
                </p>
            </div>
            <button className="bg-white text-indigo-900 px-6 py-2 rounded font-black text-xs hover:bg-indigo-50 transition-colors uppercase">
                Imprimir Kardex
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
