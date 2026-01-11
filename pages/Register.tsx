
import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { UserRole } from '../types';

interface RegisterProps {
  onGoToLogin: () => void;
}

const DEFAULT_CAREERS = [
  "Ingeniería en Tecnologías de Información",
  "Ingeniería en Mecatrónica",
  "Licenciatura en Negocios Internacionales",
  "Ingeniería Industrial",
  "Licenciatura en Administración y Gestión de PyMES"
];

const Register: React.FC<RegisterProps> = ({ onGoToLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [careers, setCareers] = useState<string[]>(DEFAULT_CAREERS);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    matricula: '',
    curp: '',
    gender: 'Masculino',
    birthDate: '',
    career: DEFAULT_CAREERS[0],
    role: UserRole.STUDENT
  });

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        const snap = await getDocs(collection(db, "careers"));
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data().name);
          setCareers(list);
          setFormData(p => ({ ...p, career: list[0] }));
        }
      } catch (err: any) {
        console.warn("Usando catálogo local por defecto.");
      }
    };
    fetchCareers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const cleanEmail = formData.email.replace(/\s/g, '');
      
      // 1. Crear usuario en Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, formData.password);
      const user = userCredential.user;

      // 2. Inmediatamente crear el perfil en Firestore
      // El usuario ya está autenticado así que tiene permiso de escritura según las reglas
      const { password, ...profileData } = formData;
      
      await setDoc(doc(db, "users", user.uid), {
        ...profileData,
        email: cleanEmail,
        fullName: formData.fullName.toUpperCase(),
        matricula: formData.matricula.trim(),
        isVerified: false,
        isAuthorized: formData.role === UserRole.STUDENT,
        createdAt: new Date().toISOString()
      });

      // El listener en App.tsx se encargará de redirigir
    } catch (err: any) {
      console.error("Registration Error:", err);
      let msg = "Error al crear la cuenta.";
      if (err.code === 'auth/email-already-in-use') msg = "Este correo electrónico ya está registrado.";
      if (err.code === 'auth/invalid-email') msg = "El formato del correo no es válido.";
      if (err.code === 'auth/weak-password') msg = "La contraseña es muy débil.";
      
      setError(msg);
      setLoading(false);
      
      // Si falló la escritura en Firestore pero se creó en Auth, cerramos sesión para limpiar
      if (auth.currentUser) {
        await signOut(auth);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-slate-100 min-h-screen py-12">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-indigo-900 mb-2 italic tracking-tight uppercase">Registro SIASE</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Crea tu expediente digital</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-black uppercase flex items-center gap-3">
            <span className="bg-red-200 rounded-full w-5 h-5 flex items-center justify-center">!</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input label="NOMBRE COMPLETO" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="PATERNO MATERNO NOMBRES" className="font-bold" />
          </div>
          
          <Input label="MATRÍCULA" name="matricula" value={formData.matricula} onChange={handleChange} required placeholder="Ej: 1920345" className="font-mono font-bold" />
          <Input label="CURP" name="curp" value={formData.curp} onChange={handleChange} required placeholder="18 Caracteres" maxLength={18} className="uppercase font-bold" />
          
          <Input label="CORREO ELECTRÓNICO" name="email" type="email" value={formData.email} onChange={handleChange} required />
          <Input label="CONTRASEÑA" name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="Mínimo 6 caracteres" />
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">GÉNERO</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className="px-4 py-2.5 rounded-xl border border-slate-300 h-11 bg-white outline-none font-bold text-sm">
              <option value="Masculino">MASCULINO</option>
              <option value="Femenino">FEMENINO</option>
              <option value="Otro">OTRO</option>
            </select>
          </div>

          <Input label="FECHA NACIMIENTO" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required />
          
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">CARRERA / PROGRAMA</label>
            <select name="career" value={formData.career} onChange={handleChange} className="px-4 py-2.5 rounded-xl border border-slate-300 h-11 bg-white outline-none font-bold text-sm">
              {careers.map((c, i) => <option key={i} value={c}>{c.toUpperCase()}</option>)}
            </select>
          </div>

          <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 block mb-4 tracking-[0.2em] uppercase text-center">Tipo de Perfil</p>
            <div className="flex justify-center gap-10">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="radio" name="role" value={UserRole.STUDENT} checked={formData.role === UserRole.STUDENT} onChange={handleChange} className="w-5 h-5 accent-indigo-900" /> 
                <span className="font-black text-slate-600 group-hover:text-indigo-900 text-xs transition-colors">ALUMNO</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="radio" name="role" value={UserRole.TEACHER} checked={formData.role === UserRole.TEACHER} onChange={handleChange} className="w-5 h-5 accent-indigo-900" /> 
                <span className="font-black text-slate-600 group-hover:text-indigo-900 text-xs transition-colors">DOCENTE</span>
              </label>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col gap-4 mt-6">
            <Button type="submit" className="w-full py-4 text-sm font-black uppercase tracking-[0.2em] shadow-lg" isLoading={loading}>
              Crear mi Cuenta
            </Button>
            <button type="button" onClick={onGoToLogin} className="text-slate-400 hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest transition-all">
              Regresar al Inicio de Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
