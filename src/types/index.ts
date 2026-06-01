// ============================================================
// Eureka English Center - Type Definitions
// ============================================================

export interface Teacher {
  id?: number;
  name?: string;               // Legacy
  fullName?: string;
  email: string;
  phone: string;
  status?: string;             // Legacy
  workingStatus?: string;      // ACTIVE, INACTIVE, ON_LEAVE
  teacherCode?: string;
  teacherType?: string;        // FULL_TIME, PART_TIME
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  skills?: string | string[];
  certificateFile?: string;
  profileFile?: string;
  deleted?: boolean;
  createdAt?: string;
  modifiedDate?: string;
}

/** Khóa học đào tạo chuẩn */
export interface Course {
  id?: number;
  code?: string;               // Mã khóa học (VD: IELTS_65)
  name: string;
  description?: string;
  totalSessions?: number;      // Tổng số buổi
  sessionsPerWeek?: number;    // Buổi/tuần
  durationWeeks?: number;      // Số tuần
  minStudents?: number;
  maxStudents?: number;
  requiredSkillCode?: string;  // Kỹ năng GV cần có
  status?: string;             // ACTIVE, INACTIVE, DISCONTINUED
  // Legacy backward compat
  totalLessons?: number;
  defaultDuration?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Kế hoạch khai giảng */
export interface CourseBatch {
  id?: number;
  courseId: number;
  batchName: string;
  enrollmentStartDate?: string;
  enrollmentEndDate?: string;
  expectedOpeningDate?: string;
  forecastScale?: number;
  status?: string;             // PLANNING, ENROLLING, OPENED, CLOSED, CANCELLED
  courseName?: string;
  courseCode?: string;
  note?: string;
  generatedClassCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Mẫu lịch học */
export interface SchedulePattern {
  id?: number;
  code: string;                // P001-P019
  studyDays: string;           // "2,4,6"
  slotCode: string;            // C1-C5
  slotStart: string;           // "08:00"
  slotEnd: string;             // "10:00"
  sessionsPerWeek: number;
  active?: boolean;
  displayLabel?: string;       // Tính từ studyDays + slotCode
}

/** Công suất còn lại của 1 pattern */
export interface CapacityDashboardItem {
  patternId: number;
  patternCode: string;
  studyDays: string;
  slotCode: string;
  slotStart: string;
  slotEnd: string;
  sessionsPerWeek: number;
  displayLabel: string;
  capacity: number;            // MIN(phòng rảnh, GV rảnh)
  occupied: number;            // Lớp đang dùng
  remaining: number;           // Còn lại
  availableRooms: number;
  availableTeachers: number;
}

/** Lớp học thực tế */
export interface SchoolClass {
  id?: number;
  classCode?: string;          // VD: IELTS_A
  batchId?: number;
  schedulePatternId?: number;
  teacherId?: number;
  roomId?: number;
  studentCount?: number;
  status?: string;             // DRAFT,ENROLLING,REBALANCING,OPEN,STUDYING,FINISHED,CANCELLED
  actualOpeningDate?: string;
  // Legacy
  courseId?: number;
  name?: string;
  studentSize?: number;
  startDate?: string;
  note?: string;
  // Join fields
  batchName?: string;
  courseName?: string;
  courseCode?: string;
  patternCode?: string;
  patternLabel?: string;
  teacherName?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Audit log entry */
export interface ClassPlanningLog {
  id?: number;
  classId: number;
  action: string;
  oldStatus?: string;
  newStatus?: string;
  note?: string;
  createdAt?: string;
  createdBy?: string;
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
  sessionDate?: string;
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
