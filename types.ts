
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  matricula: string;
  curp?: string;
  gender?: string;
  birthDate?: string;
  career?: string;
  isVerified: boolean;
  isAuthorized: boolean;
  createdAt: string;
}

export interface Career {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
  careerId: string;
  term: number;
}

export interface Assignment {
  id: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  groupId: string;
  groupName: string;
  careerName: string;
  term: number;
}
