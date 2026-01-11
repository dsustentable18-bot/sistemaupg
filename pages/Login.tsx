
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface LoginProps {
  onGoToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onGoToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Limpieza básica de espacios
    const cleanEmail = email.replace(/\s/g, '');

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (err: any) {
      console.error("Login Error:", err.code, err.message);
      
      // Firebase v10+ a menudo devuelve 'auth/invalid-credential' para cualquier error de login por seguridad
      if (
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/invalid-email'
      ) {
        setError('Credenciales incorrectas. Verifique su correo y contraseña.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Acceso bloqueado temporalmente por demasiados intentos. Intente más tarde.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Error de red. Verifique su conexión a internet.');
      } else {
        setError('Error al iniciar sesión: ' + (err.message || 'Intente de nuevo.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-slate-100 min-h-screen">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-indigo-900 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l-9-5 9-5 9 5-9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14v7" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-indigo-900 tracking-tighter uppercase italic">UniGrade</h1>
          <p className="text-slate-400 font-bold text-[10px] tracking-[0.3em] uppercase mt-2">Sistema Integral Académico</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-xs font-black uppercase rounded-xl border border-red-100 flex items-center gap-3">
              <span className="flex-shrink-0 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">!</span>
              <span className="leading-tight">{error}</span>
            </div>
          )}
          
          <Input 
            label="CORREO ELECTRÓNICO" 
            type="email" 
            placeholder="ejemplo@uni.edu" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          
          <Input 
            label="CONTRASEÑA" 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          
          <Button type="submit" className="w-full py-4 text-sm font-black tracking-widest uppercase shadow-xl hover:translate-y-[-2px]" isLoading={loading}>
            Acceder al Sistema
          </Button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">¿Eres de nuevo ingreso?</p>
          <button 
            onClick={onGoToRegister}
            className="text-indigo-600 font-black uppercase text-sm hover:text-indigo-800 transition-colors"
          >
            Crear cuenta de estudiante / docente
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
