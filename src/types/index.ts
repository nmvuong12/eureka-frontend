export interface Teacher {
  id?: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  skills?: string[];
  createdAt?: string;
}

export interface Course {
  id?: number;
  name: string;
  totalLessons: number;
  defaultDuration: number;
  description: string;
}

export interface Room {
  id?: number;
  name: string;
  capacity: number;
  status: string;
}

export interface Timeslot {
  id?: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  label: string;
}

export interface TimetableEntry {
  lessonId: number;
  classId: number;
  className: string;
  lessonIndex: number;
  requiredSkill: string;
  teacherId: number;
  teacherName: string;
  roomId: number;
  roomName: string;
  timeslotId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  timeslotLabel: string;
  pinned: boolean;
}

export interface LeaveRequest {
  id?: number;
  teacherId?: number;
  fromDate: string;
  toDate: string;
  reason: string;
  status?: string;
  createdAt?: string;
}

export interface SchoolClass {
  id?: number;
  courseId: number;
  name: string;
  studentSize: number;
  startDate: string;
  status: string;
}
