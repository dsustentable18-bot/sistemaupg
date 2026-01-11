
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserRole, UserProfile } from './types';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import { Button } from './components/Button';

const ADMIN_EMAIL = "dsustentable18@gmail.com";

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'dashboard'>('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        
        // Elevación forzada para el Admin principal
        if (firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          try {
            const docSnap = await getDoc(userDocRef);
            if (!docSnap.exists() || docSnap.data().role !== UserRole.ADMIN) {
              await setDoc(userDocRef, {
                email: firebaseUser.email,
                role: UserRole.ADMIN,
                fullName: docSnap.exists() ? docSnap.data().fullName : 'Admin Sistema',
                matricula: docSnap.exists() ? docSnap.data().matricula : 'ROOT-001',
                isVerified: true,
                isAuthorized: true,
                createdAt: docSnap.exists() ? docSnap.data().createdAt : new Date().toISOString()
              }, { merge: true });
            }
          } catch (e) {
            console.error("Critical Admin Setup Error:", e);
          }
        }

        const unsubDoc = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            setUser({ id: firebaseUser.uid, ...snap.data() } as UserProfile);
            setView('dashboard');
            setLoading(false);
          } else {
            // Manejo de delay en creación de perfiles
            setTimeout(async () => {
              const check = await getDoc(userDocRef);
              if (!check.exists() && auth.currentUser) {
                await signOut(auth);
                setLoading(false);
              }
            }, 2500);
          }
        }, (err) => {
          console.warn("Firestore snapshot waiting for auth propagation...");
        });

        return () => unsubDoc();
      } else {
        setUser(null);
        setView('login');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await signOut(auth);
    setUser(null);
    setView('login');
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-slate-400 font-black tracking-widest uppercase text-[9px]">Validando Credenciales SIASE...</p>
      </div>
    );
  }

  if (user && view === 'dashboard' && user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.TEACHER && !user.isAuthorized) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
          <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl max-w-md border border-amber-100">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl">🛡️</div>
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase italic tracking-tighter">Acceso Restringido</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">Tu perfil docente está registrado correctamente. Por seguridad, un <b>Administrador</b> debe verificar tu identidad y autorizar tu acceso antes de que puedas capturar actas.</p>
            <Button onClick={handleLogout} variant="secondary" className="w-full py-4 font-black uppercase text-[10px] tracking-widest">Cerrar Sesión</Button>
          </div>
        </div>
      );
    }
    if (!user.isVerified) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
          <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl max-w-md border border-indigo-100">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl">📑</div>
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase italic tracking-tighter">Validación de Perfil</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">Tu cuenta requiere validación física de documentos. Favor de presentarse en las oficinas administrativas con tu matrícula: <span className="text-indigo-600 font-black">{user.matricula}</span></p>
            <Button onClick={handleLogout} variant="secondary" className="w-full py-4 font-black uppercase text-[10px] tracking-widest">Volver al Inicio</Button>
          </div>
        </div>
      );
    }
  }

  const renderDashboard = () => {
    if (!user) return null;
    switch (user.role) {
      case UserRole.ADMIN: return <AdminDashboard user={user} onLogout={handleLogout} />;
      case UserRole.TEACHER: return <TeacherDashboard user={user} onLogout={handleLogout} />;
      case UserRole.STUDENT: return <StudentDashboard user={user} onLogout={handleLogout} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {view === 'login' && <Login onGoToRegister={() => setView('register')} />}
      {view === 'register' && <Register onGoToLogin={() => setView('login')} />}
      {view === 'dashboard' && renderDashboard()}
    </div>
  );
};

export default App;
