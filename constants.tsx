
import { UserRole, UserProfile, Subject, Group } from './types';

export const MOCK_GROUPS: Group[] = [
  { id: 'G1', name: '701-A' },
  { id: 'G2', name: '702-B' },
  { id: 'G3', name: '801-A' }
];

export const MOCK_CAREERS = [
  "Ingeniería en Sistemas",
  "Administración de Empresas",
  "Arquitectura",
  "Medicina",
  "Derecho"
];

// Mock database simulating Firebase Firestore
// Added missing properties: isVerified, isAuthorized, createdAt to comply with UserProfile type
export const INITIAL_USERS: UserProfile[] = [
  {
    id: '1',
    email: 'admin@uni.edu',
    role: UserRole.ADMIN,
    fullName: 'Administrador General',
    matricula: 'ADMIN001',
    isVerified: true,
    isAuthorized: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'maestro@uni.edu',
    role: UserRole.TEACHER,
    fullName: 'Dr. Roberto Gómez',
    matricula: 'DOC202401',
    isVerified: true,
    isAuthorized: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    email: 'alumno@uni.edu',
    role: UserRole.STUDENT,
    fullName: 'Juan Pérez García',
    matricula: '20210045',
    curp: 'PEGJ010101HDFRRN01',
    gender: 'Masculino',
    birthDate: '2001-01-01',
    career: 'Ingeniería en Sistemas',
    isVerified: true,
    isAuthorized: true,
    createdAt: new Date().toISOString()
  }
];

// Removed 'teacherId' and 'groups' because they are not present in the Subject interface definition in types.ts
export const MOCK_SUBJECTS: Subject[] = [
  { id: 'S1', name: 'Programación Avanzada', careerId: '1', term: 1 },
  { id: 'S2', name: 'Bases de Datos', careerId: '1', term: 1 }
];
