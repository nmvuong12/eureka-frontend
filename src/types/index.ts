export interface Teacher {
  id?: number;
  name?: string;               // Legacy field for backward compatibility
  fullName?: string;           // Full name of the teacher
  email: string;
  phone: string;
  status?: string;             // Legacy field for backward compatibility
  workingStatus?: string;      // ACTIVE, INACTIVE, ON_LEAVE
  teacherCode?: string;        // Teacher code (e.g. GV0001)
  teacherType?: string;        // FULL_TIME, PART_TIME
  gender?: string;             // MALE, FEMALE, OTHER
  dateOfBirth?: string;        // YYYY-MM-DD
  address?: string;            // Contact address
  skills?: string | string[];  // Support both array and comma-separated string formats
  certificateFile?: string;   // Path to certificate file
  profileFile?: string;       // Path to profile file
  deleted?: boolean;           // Soft delete flag
  createdAt?: string;          // Creation timestamp
  modifiedDate?: string;       // Modification timestamp
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
