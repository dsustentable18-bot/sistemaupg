
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, UserRole, Career, Group, Subject, Assignment } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface AdminDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'careers' | 'groups' | 'subjects' | 'assignments'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  // Forms
  const [newCareer, setNewCareer] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [newSubject, setNewSubject] = useState({ name: '', careerId: '', term: 1 });
  const [newAssignment, setNewAssignment] = useState({ teacherId: '', subjectId: '', groupId: '' });

  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user.role !== UserRole.ADMIN) return;

    const unsubUsers = onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(200)), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    });

    const unsubCareers = onSnapshot(collection(db, "careers"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, name: d.data().name } as Career));
      setCareers(list);
      if (list.length > 0 && !newSubject.careerId) setNewSubject(prev => ({ ...prev, careerId: list[0].id }));
    });

    const unsubGroups = onSnapshot(collection(db, "groups"), (snap) => {
      setGroups(snap.docs.map(d => ({ id: d.id, name: d.data().name } as Group)));
    });

    const unsubSubjects = onSnapshot(collection(db, "subjects"), (snap) => {
      setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));
    });

    const unsubAssignments = onSnapshot(collection(db, "assignments"), (snap) => {
      setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Assignment)));
    });

    return () => { 
      unsubUsers(); unsubCareers(); unsubGroups(); unsubSubjects(); unsubAssignments();
    };
  }, [user.role]);

  const handleUpdateUserStatus = async (userId: string, data: Partial<UserProfile>) => {
    setActionLoading(userId);
    try { await updateDoc(doc(db, "users", userId), data); } catch (err) { alert("Error de permisos."); }
    finally { setActionLoading(null); }
  };

  const handleAddData = async (col: string, data: any, resetFn: () => void) => {
    try {
      await addDoc(collection(db, col), data);
      resetFn();
    } catch (err) { alert("Error al guardar en " + col); }
  };

  const handleDelete = async (col: string, id: string) => {
    if (confirm("¿Eliminar este registro?")) {
      try { await deleteDoc(doc(db, col, id)); } catch (err) { alert("Error al eliminar."); }
    }
  };

  const createAssignment = async () => {
    const teacher = users.find(u => u.id === newAssignment.teacherId);
    const subject = subjects.find(s => s.id === newAssignment.subjectId);
    const group = groups.find(g => g.id === newAssignment.groupId);
    const career = careers.find(c => c.id === subject?.careerId);

    if (!teacher || !subject || !group) return alert("Selecciona todos los campos");

    const data: Omit<Assignment, 'id'> = {
      teacherId: teacher.id,
      teacherName: teacher.fullName,
      subjectId: subject.id,
      subjectName: subject.name,
      groupId: group.id,
      groupName: group.name,
      careerName: career?.name || 'N/A',
      term: subject.term
    };

    await handleAddData("assignments", data, () => setNewAssignment({ teacherId: '', subjectId: '', groupId: '' }));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Panel de Gestión</h1>
          <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em]">Administrador: {user.fullName}</p>
        </div>
        <Button variant="secondary" onClick={onLogout} className="font-black text-xs uppercase px-6">Salir</Button>
      </header>

      <div className="flex flex-wrap gap-2 mb-8 bg-slate-200/50 p-1.5 rounded-2xl w-fit">
        {[
          {id: 'users', label: 'Alumnos'},
          {id: 'requests', label: 'Maestros'},
          {id: 'careers', label: 'Carreras'},
          {id: 'groups', label: 'Grupos'},
          {id: 'subjects', label: 'Materias'},
          {id: 'assignments', label: 'Asignaciones'}
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)} 
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id || (tab.id==='requests' && activeTab==='requests') ? 'bg-indigo-900 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-900'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* VISTA: CARRERAS */}
      {activeTab === 'careers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <h2 className="text-xs font-black text-indigo-950 uppercase mb-6 tracking-widest">Nueva Carrera</h2>
            <Input label="NOMBRE" value={newCareer} onChange={e => setNewCareer(e.target.value)} placeholder="Ej: Ing. Mecánica" />
            <Button onClick={() => handleAddData("careers", { name: newCareer }, () => setNewCareer(''))} className="w-full mt-4 uppercase text-xs font-black">Registrar</Button>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <h2 className="text-xs font-black text-slate-400 uppercase mb-6 tracking-widest">Existentes</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {careers.map(c => (
                <div key={c.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-slate-700">{c.name}</span>
                  <button onClick={() => handleDelete("careers", c.id)} className="text-red-400 hover:text-red-600">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VISTA: GRUPOS */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <h2 className="text-xs font-black text-indigo-950 uppercase mb-6 tracking-widest">Nuevo Grupo / Salón</h2>
            <Input label="NOMBRE DEL GRUPO" value={newGroup} onChange={e => setNewGroup(e.target.value)} placeholder="Ej: 701-A" />
            <Button onClick={() => handleAddData("groups", { name: newGroup }, () => setNewGroup(''))} className="w-full mt-4 uppercase text-xs font-black">Crear Grupo</Button>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <h2 className="text-xs font-black text-slate-400 uppercase mb-6 tracking-widest">Lista de Grupos</h2>
            <div className="grid grid-cols-2 gap-3">
              {groups.map(g => (
                <div key={g.id} className="p-3 bg-indigo-50 rounded-xl flex justify-between items-center border border-indigo-100">
                  <span className="font-mono font-black text-indigo-900">{g.name}</span>
                  <button onClick={() => handleDelete("groups", g.id)} className="text-indigo-300 hover:text-red-500 font-bold">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VISTA: MATERIAS */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <h2 className="text-xs font-black text-indigo-950 uppercase mb-6 tracking-widest">Registrar Materia</h2>
            <div className="space-y-4">
              <Input label="NOMBRE MATERIA" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} />
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">CARRERA</label>
                <select className="w-full px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs h-11" value={newSubject.careerId} onChange={e => setNewSubject({...newSubject, careerId: e.target.value})}>
                  {careers.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">CUATRIMESTRE</label>
                <select className="w-full px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs h-11" value={newSubject.term} onChange={e => setNewSubject({...newSubject, term: parseInt(e.target.value)})}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}° CUATRIMESTRE</option>)}
                </select>
              </div>
              <Button onClick={() => handleAddData("subjects", newSubject, () => setNewSubject({...newSubject, name: ''}))} className="w-full mt-2 uppercase text-xs font-black">Guardar Materia</Button>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
            <h2 className="text-xs font-black text-slate-400 uppercase mb-6 tracking-widest">Catálogo de Materias</h2>
            <div className="overflow-y-auto max-h-[400px] space-y-2">
              {subjects.map(s => {
                const career = careers.find(c => c.id === s.careerId);
                return (
                  <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="font-black text-slate-900 text-sm uppercase">{s.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[9px] font-bold text-indigo-500 uppercase">{career?.name} • {s.term}° Cuatrimestre</p>
                      <button onClick={() => handleDelete("subjects", s.id)} className="text-red-400 hover:text-red-600 text-xl font-bold">×</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VISTA: ASIGNACIONES */}
      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <h2 className="text-xs font-black text-indigo-950 uppercase mb-6 tracking-widest">Asignar Maestro</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">DOCENTE</label>
                <select className="w-full px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs h-11" value={newAssignment.teacherId} onChange={e => setNewAssignment({...newAssignment, teacherId: e.target.value})}>
                  <option value="">SELECCIONAR...</option>
                  {users.filter(u => u.role === UserRole.TEACHER && u.isAuthorized).map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">MATERIA</label>
                <select className="w-full px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs h-11" value={newAssignment.subjectId} onChange={e => setNewAssignment({...newAssignment, subjectId: e.target.value})}>
                  <option value="">SELECCIONAR...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.term}°)</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">GRUPO</label>
                <select className="w-full px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs h-11" value={newAssignment.groupId} onChange={e => setNewAssignment({...newAssignment, groupId: e.target.value})}>
                  <option value="">SELECCIONAR...</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <Button onClick={createAssignment} className="w-full mt-2 uppercase text-xs font-black">Vincular Docente</Button>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
            <h2 className="text-xs font-black text-slate-400 uppercase mb-6 tracking-widest">Asignaciones Vigentes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Docente</th>
                    <th className="px-6 py-4">Materia / Grupo</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {assignments.map(a => (
                    <tr key={a.id} className="text-[10px] font-bold">
                      <td className="px-6 py-4 text-slate-900 uppercase">{a.teacherName}</td>
                      <td className="px-6 py-4">
                        <p className="text-indigo-600 uppercase">{a.subjectName}</p>
                        <p className="text-slate-400">{a.careerName} • GRUPO {a.groupName}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDelete("assignments", a.id)} className="text-red-400 font-black">QUITAR</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA: ALUMNOS (Existente) */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
           <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-[0.2em] border-b border-slate-100">
                <tr>
                  <th className="px-10 py-6">ID / Contacto</th>
                  <th className="px-10 py-6">Alumno</th>
                  <th className="px-10 py-6">Estatus</th>
                  <th className="px-10 py-6 text-center">Validación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.filter(u => u.role === UserRole.STUDENT).map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6">
                      <p className="font-mono text-xs font-black text-indigo-700">{u.matricula}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{u.email}</p>
                    </td>
                    <td className="px-10 py-6 font-bold text-slate-800 uppercase text-sm">{u.fullName}</td>
                    <td className="px-10 py-6">
                      <span className={`px-3 py-1 rounded text-[9px] font-black uppercase ${u.isVerified ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                        {u.isVerified ? 'ACTIVO' : 'PENDIENTE'}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <Button 
                        variant="ghost" 
                        className="text-[9px] font-black uppercase tracking-widest border border-slate-200 hover:border-indigo-600 px-6" 
                        onClick={() => handleUpdateUserStatus(u.id, { isVerified: !u.isVerified })}
                        isLoading={actionLoading === u.id}
                      >
                        {u.isVerified ? 'Invalidar' : 'Verificar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA: MAESTROS (Existente) */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-[0.2em] border-b border-slate-100">
                <tr>
                  <th className="px-10 py-6">Docente</th>
                  <th className="px-10 py-6">Datos</th>
                  <th className="px-10 py-6 text-center">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.filter(u => u.role === UserRole.TEACHER).map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6 font-bold text-slate-900 uppercase text-sm">{u.fullName}</td>
                    <td className="px-10 py-6">
                      <p className="text-slate-500 text-[10px] font-bold uppercase">{u.email}</p>
                      <p className="text-indigo-400 text-[9px] font-black font-mono">ID: {u.matricula}</p>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <Button 
                        variant={u.isAuthorized ? 'danger' : 'primary'} 
                        className="text-[10px] font-black uppercase tracking-widest px-8" 
                        onClick={() => handleUpdateUserStatus(u.id, { isAuthorized: !u.isAuthorized, isVerified: true })}
                        isLoading={actionLoading === u.id}
                      >
                        {u.isAuthorized ? 'Revocar Acceso' : 'Autorizar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
