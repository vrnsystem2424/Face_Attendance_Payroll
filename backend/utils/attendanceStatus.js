// backend/utils/attendanceStatus.js
// 🎯 Office Timing Rules & Late/Half-Day Detection

// ────────────────────────────────────────
// OFFICE TIMING RULES
// ────────────────────────────────────────
const OFFICE_IN_TIME = '09:30 AM';      // Normal IN time
const OFFICE_OUT_TIME = '06:30 PM';     // Normal OUT time
const LATE_IN_LIMIT = '09:45 AM';       // After this = Late
const HALF_DAY_IN_LIMIT = '11:00 AM';   // After this = Half Day
const HALF_DAY_OUT_LIMIT = '04:00 PM';  // Before this = Half Day

// ────────────────────────────────────────
// Parse "09:45 AM" to minutes (585)
// ────────────────────────────────────────
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(' ');
  if (parts.length !== 2) return null;
  const [time, period] = parts;
  const timeParts = time.split(':');
  if (timeParts.length !== 2) return null;
  let hours = parseInt(timeParts[0]);
  let minutes = parseInt(timeParts[1]);
  if (isNaN(hours) || isNaN(minutes)) return null;
  if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

// ────────────────────────────────────────
// 🎯 GET ATTENDANCE STATUS
// Returns: { status, is_late, is_half_day, reasons }
// ────────────────────────────────────────
const getAttendanceStatus = (in_time, out_time) => {
  const inMin = parseTimeToMinutes(in_time);
  const outMin = parseTimeToMinutes(out_time);
  
  const lateInLimit = parseTimeToMinutes(LATE_IN_LIMIT);        // 585 (9:45 AM)
  const halfDayInLimit = parseTimeToMinutes(HALF_DAY_IN_LIMIT); // 660 (11:00 AM)
  const halfDayOutLimit = parseTimeToMinutes(HALF_DAY_OUT_LIMIT); // 960 (4:00 PM)
  const officeOutTime = parseTimeToMinutes(OFFICE_OUT_TIME);    // 1110 (6:30 PM)
  
  let status = 'present';
  let is_late = false;
  let is_half_day = false;
  let reasons = [];
  
  if (!in_time) {
    return {
      status: 'absent',
      is_late: false,
      is_half_day: false,
      reasons: ['No IN time'],
    };
  }
  
  // ── CHECK IN TIME ──
  if (inMin >= halfDayInLimit) {
    // IN at or after 11:00 AM = Half Day
    status = 'half-day';
    is_half_day = true;
    reasons.push(`Late IN: ${in_time} (Half Day)`);
  } else if (inMin > lateInLimit) {
    // IN after 9:45 AM = Late
    status = 'late';
    is_late = true;
    reasons.push(`Late IN: ${in_time}`);
  }
  
  // ── CHECK OUT TIME (only if out_time exists) ──
  if (outMin !== null) {
    if (outMin <= halfDayOutLimit) {
      // OUT at or before 4:00 PM = Half Day
      status = 'half-day';
      is_half_day = true;
      is_late = false; // Half day overrides late
      reasons.push(`Early OUT: ${out_time} (Half Day)`);
    } else if (outMin < officeOutTime) {
      // OUT before 6:30 PM = Late
      if (status !== 'half-day') {
        status = 'late';
        is_late = true;
      }
      reasons.push(`Early OUT: ${out_time}`);
    }
  }
  
  return {
    status,
    is_late,
    is_half_day,
    reasons,
  };
};

// ────────────────────────────────────────
// 🎯 CALCULATE LATE-TO-LEAVE CONVERSION
// Rules:
// - 3 L's = 0.5 day
// - 5 L's = 1 day (0.5 more)
// - After 5, every L = 0.5 more
// ────────────────────────────────────────
const calculateLateLeaveDeduction = (lateCount) => {
  if (lateCount === 0) return 0;
  if (lateCount < 3) return 0;
  
  let deduction = 0;
  
  // Rule 1: 3 lates = 0.5 day
  if (lateCount >= 3) deduction += 0.5;
  
  // Rule 2: 5 lates = 1 day total (add 0.5 more)
  if (lateCount >= 5) deduction += 0.5;
  
  // Rule 3: After 5, each L = 0.5 more
  if (lateCount > 5) {
    const extraLates = lateCount - 5;
    deduction += extraLates * 0.5;
  }
  
  return deduction;
};

// ────────────────────────────────────────
// 🎯 SUMMARY CALCULATOR
// ────────────────────────────────────────
const calculateMonthlySummary = (attendanceRecords) => {
  let presentDays = 0;
  let lateCount = 0;
  let halfDayCount = 0;
  const lateDates = [];
  const halfDayDates = [];
  
  for (const record of attendanceRecords) {
    if (!record.in_time) continue;
    
    presentDays++;
    
    const statusInfo = getAttendanceStatus(record.in_time, record.out_time);
    
    if (statusInfo.is_late) {
      lateCount++;
      lateDates.push(record.date);
    }
    
    if (statusInfo.is_half_day) {
      halfDayCount++;
      halfDayDates.push(record.date);
    }
  }
  
  const lateLeaveDeduction = calculateLateLeaveDeduction(lateCount);
  const halfDayLeaves = halfDayCount * 0.5;
  const totalLeavesFromLates = lateLeaveDeduction + halfDayLeaves;
  
  return {
    presentDays,
    lateCount,
    halfDayCount,
    lateDates,
    halfDayDates,
    lateLeaveDeduction,
    halfDayLeaves,
    totalLeavesFromLates,
  };
};

module.exports = {
  OFFICE_IN_TIME,
  OFFICE_OUT_TIME,
  LATE_IN_LIMIT,
  HALF_DAY_IN_LIMIT,
  HALF_DAY_OUT_LIMIT,
  parseTimeToMinutes,
  getAttendanceStatus,
  calculateLateLeaveDeduction,
  calculateMonthlySummary,
};