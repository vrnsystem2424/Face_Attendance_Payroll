// controllers/attendanceController.js

const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Site = require('../models/Site');
const moment = require('moment-timezone');
const { uploadSelfie } = require('../utils/cloudinary');
const { reverseGeocode } = require('../utils/geocoding');

// ════════════════════════════════════════════════════════════
// 🔒 STRICT FACE VERIFICATION SETTINGS
// ════════════════════════════════════════════════════════════
const STRICT_MATCH_THRESHOLD = 0.48;
const MIN_CONFIDENCE_PERCENT = 55;

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const euclideanDistance = (enc1, enc2) => {
  if (!enc1 || !enc2 || enc1.length !== enc2.length) return 999;
  let sum = 0;
  for (let i = 0; i < enc1.length; i++) {
    const d = enc1[i] - enc2[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
};

const verifyFaceMatch = (inputEncoding, storedEncoding, allEncodings = []) => {
  if (!storedEncoding || storedEncoding.length === 0) {
    return { distance: 999, matched: false, confidence: 0, reason: 'No face registered' };
  }
  if (!inputEncoding || inputEncoding.length !== storedEncoding.length) {
    return { distance: 999, matched: false, confidence: 0, reason: 'Invalid face data' };
  }

  let bestDistance = euclideanDistance(inputEncoding, storedEncoding);
  let matchCount = bestDistance < STRICT_MATCH_THRESHOLD ? 1 : 0;
  let totalEncodings = 1;

  if (allEncodings && allEncodings.length > 0) {
    for (const enc of allEncodings) {
      const d = euclideanDistance(inputEncoding, enc);
      totalEncodings++;
      if (d < bestDistance) bestDistance = d;
      if (d < STRICT_MATCH_THRESHOLD) matchCount++;
    }
  }

  const confidence = Math.round((1 - bestDistance) * 100);
  const distanceOk = bestDistance < STRICT_MATCH_THRESHOLD;
  const confidenceOk = confidence >= MIN_CONFIDENCE_PERCENT;
  const matched = distanceOk && confidenceOk;

  let reason = 'Matched';
  if (!distanceOk) reason = 'Face does not match';
  else if (!confidenceOk) reason = `Low confidence (${confidence}%)`;

  return { distance: bestDistance, matched, confidence, matchedEncodings: matchCount, totalEncodings, reason };
};

const findNearestSite = async (lat, lng, companyId) => {
  const filter = {};
  if (companyId) filter.company_id = companyId;
  const sites = await Site.find(filter);
  if (sites.length === 0) return { site: null, distance: Infinity };

  let nearest = null;
  let minDistance = Infinity;

  for (const site of sites) {
    if (!site.latitude || !site.longitude) continue;
    const dist = calculateDistance(lat, lng, site.latitude, site.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = site;
    }
  }

  return { site: nearest, distance: minDistance };
};

const checkSuspiciousActivity = ({ locationStatus, distance, confidence, hasPhoto }) => {
  const flags = [];
  if (locationStatus === 'out-of-range' && distance > 100) flags.push('far_from_office');
  if (locationStatus === 'no-gps') flags.push('no_gps_location');
  if (confidence < 65 && confidence >= MIN_CONFIDENCE_PERCENT) flags.push('low_face_confidence');
  if (!hasPhoto) flags.push('no_photo_proof');
  return flags;
};

// ════════════════════════════════════════════════════════════
// DATE / TIME HELPERS (IST)
// ════════════════════════════════════════════════════════════
const getISTMoment = () => moment().tz('Asia/Kolkata');

const getTodayDate = () => {
  const d = getISTMoment();
  return `${d.date()}/${d.month() + 1}/${d.year()}`;
};

const getCurrentTime = () => getISTMoment().format('hh:mm A');

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const parts = timeStr.split(' ');
  if (parts.length !== 2) return null;
  const [time, period] = parts;
  const timeParts = time.split(':');
  if (timeParts.length !== 2) return null;
  let hours = parseInt(timeParts[0]);
  let minutes = parseInt(timeParts[1]);
  if (isNaN(hours) || isNaN(minutes)) return null;
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const calculateWorkingMinutes = (inTime, outTime) => {
  if (!inTime || !outTime) return 0;
  const inMin = parseTimeToMinutes(inTime);
  const outMin = parseTimeToMinutes(outTime);
  if (inMin === null || outMin === null) return 0;
  let diff = outMin - inMin;
  if (diff < 0) diff += 24 * 60;
  if (diff > 24 * 60) diff = 0;
  return diff;
};

const formatMinutes = (totalMinutes) => {
  if (!totalMinutes || totalMinutes < 0) return '0h 0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const getDayName = (dateStr) => {
  const [d, m, y] = dateStr.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][date.getDay()];
};

const getDatesInMonth = (month, year) => {
  const dates = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(`${d}/${month}/${year}`);
  }
  return dates;
};

// ════════════════════════════════════════════════════════════
// 🆕 SMART SITE NAME GENERATOR
// ════════════════════════════════════════════════════════════
const generateSiteNameFromAddress = (address) => {
  if (!address) return 'Unknown Location';
  
  // Split address by commas
  const parts = address.split(',').map(p => p.trim()).filter(p => p);
  
  if (parts.length === 0) return 'Unknown Location';
  if (parts.length === 1) return parts[0].substring(0, 60);
  if (parts.length === 2) return `${parts[0]}, ${parts[1]}`;
  
  // Take first 2 meaningful parts (skip very short ones like numbers)
  let siteName = parts[0];
  if (parts[1] && parts[1].length > 2) {
    siteName += `, ${parts[1]}`;
  }
  
  // Limit to 60 chars
  return siteName.substring(0, 60);
};

// ════════════════════════════════════════════════════════════
// MARK ATTENDANCE - With Auto Site Name from Address
// ════════════════════════════════════════════════════════════
const markAttendance = async (req, res) => {
  try {
    const { face_encoding, latitude, longitude, action_type, selfie } = req.body;

    if (!face_encoding || !Array.isArray(face_encoding) || face_encoding.length === 0) {
      return res.status(400).json({ success: false, message: 'Face encoding required' });
    }

    if (!action_type || !['IN', 'OUT'].includes(action_type)) {
      return res.status(400).json({ success: false, message: 'Invalid action type' });
    }

    const employee = await Employee.findById(req.employee._id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (!employee.face_registered) {
      return res.status(400).json({ success: false, message: 'Pehle apna face register karo' });
    }

    // ── Face Match ──
    const matchResult = verifyFaceMatch(face_encoding, employee.face_encoding, employee.all_encodings);

    console.log(`🔍 Face Match for ${employee.name}:`, {
      distance: matchResult.distance.toFixed(3),
      confidence: matchResult.confidence + '%',
      matched: matchResult.matched,
    });

    if (!matchResult.matched) {
      return res.status(403).json({
        success: false,
        message: '⚠️ Face match nahi hua! Aap apna khud ka face dikhao.',
        debug: { confidence: matchResult.confidence + '%', reason: matchResult.reason },
      });
    }

    console.log(`✅ APPROVED — ${employee.name} | ${matchResult.confidence}%`);

    // ── GPS Location Check ──
    let locationStatus = 'no-gps';
    let siteName = '';
    let distanceFromSite = 0;
    let isSiteConfigured = false;

    if (latitude && longitude) {
      const companyId = employee.company_id?._id || employee.company_id?.toString() || employee.company_id;
      const { site, distance } = await findNearestSite(latitude, longitude, companyId);

      if (site) {
        distanceFromSite = distance;
        siteName = site.site_name;
        locationStatus = distance <= site.radius ? 'on-site' : 'out-of-range';
        isSiteConfigured = true;
        console.log(`🏢 Site found: ${siteName} (${distance}m)`);
      } else {
        locationStatus = 'no-site-configured';
        console.log(`⚠️ No site configured - will use address as site name`);
      }
    }

    // ── 🆕 Get Address from Coordinates (FREE OpenStreetMap) ──
    let addressData = null;
    if (latitude && longitude) {
      console.log(`🗺️ Getting address for ${latitude},${longitude}...`);
      addressData = await reverseGeocode(latitude, longitude);
      if (addressData) console.log(`✅ Address: ${addressData}`);
    }

    // ── 🆕 If no site configured, use address as site name ──
    if (!isSiteConfigured && addressData) {
      siteName = generateSiteNameFromAddress(addressData);
      console.log(`📍 Auto site name from address: ${siteName}`);
    } else if (!isSiteConfigured && !addressData) {
      siteName = 'Unknown Location';
    }

    // ── Upload Selfie ──
    let selfieData = null;
    if (selfie && selfie.startsWith('data:image')) {
      console.log(`📸 Uploading selfie for ${employee.emp_code}...`);
      selfieData = await uploadSelfie(selfie, employee.emp_code, action_type);
      if (selfieData) console.log(`✅ Selfie uploaded: ${selfieData.bytes} bytes`);
    }

    // ── Check Suspicious Activity ──
    const flags = checkSuspiciousActivity({
      locationStatus,
      distance: distanceFromSite,
      confidence: matchResult.confidence,
      hasPhoto: !!selfieData,
    });

    const today = getTodayDate();
    const currentTime = getCurrentTime();

    let attendance = await Attendance.findOne({ emp_id: employee._id, date: today });

    // ════════════════════════════════════════
    // HANDLE IN
    // ════════════════════════════════════════
    if (action_type === 'IN') {
      if (attendance && attendance.in_time) {
        return res.status(400).json({
          success: false,
          message: `Aaj already IN ho chuka ho — ${attendance.in_time}`,
        });
      }

      if (!attendance) {
        attendance = await Attendance.create({
          emp_id: employee._id,
          emp_code: employee.emp_code,
          name: employee.name,
          company_id: employee.company_id,
          department: employee.department,
          date: today,
          in_time: currentTime,
          in_latitude: latitude || 0,
          in_longitude: longitude || 0,
          in_location_status: locationStatus,
          in_site: siteName,  // 🆕 Now contains address if no site configured
          in_distance: distanceFromSite,
          in_selfie_url: selfieData?.url || null,
          in_selfie_public_id: selfieData?.public_id || null,
          in_address: addressData || '',
          status: 'present',
          confidence: matchResult.confidence,
          flagged: flags.length > 0,
          flag_reasons: flags,
        });
      } else {
        attendance.in_time = currentTime;
        attendance.in_latitude = latitude || 0;
        attendance.in_longitude = longitude || 0;
        attendance.in_location_status = locationStatus;
        attendance.in_site = siteName;  // 🆕
        attendance.in_distance = distanceFromSite;
        attendance.in_selfie_url = selfieData?.url || null;
        attendance.in_selfie_public_id = selfieData?.public_id || null;
        attendance.in_address = addressData || '';
        attendance.confidence = matchResult.confidence;
        attendance.flagged = flags.length > 0;
        attendance.flag_reasons = flags;
        await attendance.save();
      }

      return res.json({
        success: true,
        type: 'IN',
        message: `Welcome ${employee.name}! Check-in successful`,
        data: {
          time: currentTime,
          location_status: locationStatus,
          site_name: siteName,
          distance: distanceFromSite,
          latitude: latitude || 0,
          longitude: longitude || 0,
          address: addressData,
          confidence: matchResult.confidence,
          selfie_url: selfieData?.url || null,
          flagged: flags.length > 0,
          flag_reasons: flags,
          auto_site: !isSiteConfigured,  // 🆕 Flag to know it's auto-generated
        },
      });
    }

    // ════════════════════════════════════════
    // HANDLE OUT
    // ════════════════════════════════════════
    if (action_type === 'OUT') {
      if (!attendance || !attendance.in_time) {
        return res.status(400).json({ success: false, message: 'Pehle CHECK IN karo' });
      }

      if (attendance.out_time) {
        return res.status(400).json({
          success: false,
          message: `Aaj already OUT ho chuka ho — ${attendance.out_time}`,
        });
      }

      attendance.out_time = currentTime;
      attendance.out_latitude = latitude || 0;
      attendance.out_longitude = longitude || 0;
      attendance.out_location_status = locationStatus;
      attendance.out_site = siteName;  // 🆕
      attendance.out_distance = distanceFromSite;
      attendance.out_selfie_url = selfieData?.url || null;
      attendance.out_selfie_public_id = selfieData?.public_id || null;
      attendance.out_address = addressData || '';

      const outFlags = checkSuspiciousActivity({
        locationStatus,
        distance: distanceFromSite,
        confidence: matchResult.confidence,
        hasPhoto: !!selfieData,
      });

      if (outFlags.length > 0) {
        attendance.flagged = true;
        attendance.flag_reasons = [...new Set([...(attendance.flag_reasons || []), ...outFlags])];
      }

      await attendance.save();

      const totalMinutes = calculateWorkingMinutes(attendance.in_time, attendance.out_time);

      return res.json({
        success: true,
        type: 'OUT',
        message: `Goodbye ${employee.name}! Check-out successful`,
        data: {
          time: currentTime,
          location_status: locationStatus,
          site_name: siteName,
          distance: distanceFromSite,
          latitude: latitude || 0,
          longitude: longitude || 0,
          address: addressData,
          working_hours: formatMinutes(totalMinutes),
          working_minutes: totalMinutes,
          confidence: matchResult.confidence,
          selfie_url: selfieData?.url || null,
          flagged: outFlags.length > 0,
          flag_reasons: outFlags,
          auto_site: !isSiteConfigured,  // 🆕
        },
      });
    }
  } catch (err) {
    console.error('❌ Attendance error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// GET MY ATTENDANCE
// ════════════════════════════════════════════════════════════
const getMyAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ emp_id: req.employee._id })
      .sort({ createdAt: -1 })
      .limit(60);
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// GET TODAY ATTENDANCE
// ════════════════════════════════════════════════════════════
const getTodayAttendance = async (req, res) => {
  try {
    const today = getTodayDate();
    const filter = req.employee.role === 'super_admin' ? {} : { company_id: req.employee.company_id };

    const totalEmployees = await Employee.countDocuments({ ...filter, role: 'employee', status: 'approved' });
    const todayAttendance = await Attendance.find({ ...filter, date: today }).sort({ createdAt: -1 });

    const presentToday = todayAttendance.length;
    const absentToday = Math.max(0, totalEmployees - presentToday);

    res.json({
      success: true,
      data: {
        total_employees: totalEmployees,
        present_today: presentToday,
        absent_today: absentToday,
        attendance: todayAttendance,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// GET ALL ATTENDANCE
// ════════════════════════════════════════════════════════════
const getAllAttendance = async (req, res) => {
  try {
    const { date, emp_code, flagged } = req.query;
    const filter = req.employee.role === 'super_admin' ? {} : { company_id: req.employee.company_id };

    if (date) filter.date = date;
    if (emp_code) filter.emp_code = emp_code;
    if (flagged === 'true') filter.flagged = true;

    const records = await Attendance.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// GET TODAY STATUS
// ════════════════════════════════════════════════════════════
const getTodayStatus = async (req, res) => {
  try {
    const today = getTodayDate();
    const attendance = await Attendance.findOne({ emp_id: req.employee._id, date: today });

    if (!attendance) {
      return res.json({
        success: true,
        data: {
          status: 'not-started',
          message: 'Attendance not marked yet',
          in_time: null,
          out_time: null,
          working_minutes: 0,
          working_hours: '0h 0m',
          date: today,
        },
      });
    }

    let workingMinutes = 0;
    let status = 'not-started';

    if (attendance.in_time && !attendance.out_time) {
      const currentTimeIST = getISTMoment().format('hh:mm A');
      workingMinutes = calculateWorkingMinutes(attendance.in_time, currentTimeIST);
      status = 'in-progress';
    } else if (attendance.in_time && attendance.out_time) {
      workingMinutes = calculateWorkingMinutes(attendance.in_time, attendance.out_time);
      status = 'complete';
    }

    res.json({
      success: true,
      data: {
        status,
        in_time: attendance.in_time,
        out_time: attendance.out_time,
        working_minutes: workingMinutes,
        working_hours: formatMinutes(workingMinutes),
        in_site: attendance.in_site || '',
        out_site: attendance.out_site || '',
        in_location_status: attendance.in_location_status,
        out_location_status: attendance.out_location_status,
        in_distance: attendance.in_distance,
        out_distance: attendance.out_distance,
        in_latitude: attendance.in_latitude,
        in_longitude: attendance.in_longitude,
        out_latitude: attendance.out_latitude,
        out_longitude: attendance.out_longitude,
        in_selfie_url: attendance.in_selfie_url,
        out_selfie_url: attendance.out_selfie_url,
        in_address: attendance.in_address,
        out_address: attendance.out_address,
        confidence: attendance.confidence,
        flagged: attendance.flagged,
        flag_reasons: attendance.flag_reasons,
        date: today,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// REVIEW ATTENDANCE
// ════════════════════════════════════════════════════════════
const reviewAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    attendance.reviewed = true;
    attendance.reviewed_by = req.employee._id;
    attendance.review_notes = notes || '';

    if (action === 'reject') {
      attendance.status = 'absent';
      attendance.flagged = true;
      attendance.flag_reasons = [...(attendance.flag_reasons || []), 'admin_rejected'];
    } else {
      attendance.flagged = false;
    }

    await attendance.save();

    res.json({
      success: true,
      message: `Attendance ${action === 'reject' ? 'rejected' : 'approved'}`,
      data: attendance,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// GET MONTHLY SUMMARY
// ════════════════════════════════════════════════════════════
const getMonthlySummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();

    const MonthlySettings = require('../models/MonthlySettings');
    const Leave = require('../models/Leave');

    const settings = await MonthlySettings.findOne({
      company_id: req.employee.company_id?._id || req.employee.company_id,
      month: currentMonth,
      year: currentYear,
    });

    const requiredHours = settings?.required_hours || 240;
    const dailyHours = settings?.daily_hours || 8;
    const dailyMinutes = dailyHours * 60;
    const holidays = settings?.holidays || [];
    const weeklyOff = settings?.weekly_off || ['Sunday'];

    const allDates = getDatesInMonth(currentMonth, currentYear);

    const attendanceRecords = await Attendance.find({
      emp_id: req.employee._id,
      date: { $in: allDates },
    });

    const allLeaves = await Leave.find({ emp_id: req.employee._id, status: 'approved' });

    const monthLeaves = allLeaves.filter((l) => {
      const [d, m, y] = l.from_date.split('/').map(Number);
      return m === currentMonth && y === currentYear;
    });

    let totalWorkedMinutes = 0;
    let presentDays = 0;
    let absentDays = 0;
    let weekendCount = 0;
    let holidayCount = 0;
    let leaveCount = 0;

    const todayIST = getISTMoment();
    const todayDate = todayIST.date();
    const isCurrentMonth = currentMonth === (todayIST.month() + 1) && currentYear === todayIST.year();

    const leaveDateMap = {};
    monthLeaves.forEach((l) => {
      const [fd, fm, fy] = l.from_date.split('/').map(Number);
      const [td, tm, ty] = l.to_date.split('/').map(Number);
      const fromDate = new Date(fy, fm - 1, fd);
      const toDate = new Date(ty, tm - 1, td);
      const current = new Date(fromDate);
      while (current <= toDate) {
        const key = `${current.getDate()}/${current.getMonth() + 1}/${current.getFullYear()}`;
        leaveDateMap[key] = { is_half_day: l.is_half_day, leave_type: l.leave_type };
        current.setDate(current.getDate() + 1);
      }
    });

    const holidaySet = new Set(holidays.map((h) => h.date));

    for (const dateStr of allDates) {
      const [d] = dateStr.split('/').map(Number);
      const dayName = getDayName(dateStr);

      if (isCurrentMonth && d > todayDate) continue;
      if (weeklyOff.includes(dayName)) { weekendCount++; continue; }

      if (holidaySet.has(dateStr)) {
        holidayCount++;
        totalWorkedMinutes += dailyMinutes;
        continue;
      }

      if (leaveDateMap[dateStr]) {
        const leave = leaveDateMap[dateStr];
        if (leave.is_half_day) {
          leaveCount += 0.5;
          totalWorkedMinutes += dailyMinutes / 2;
        } else {
          leaveCount += 1;
          totalWorkedMinutes += dailyMinutes;
        }
      }

      const attendance = attendanceRecords.find((a) => a.date === dateStr);

      if (attendance && attendance.in_time) {
        presentDays++;
        if (attendance.out_time) {
          totalWorkedMinutes += calculateWorkingMinutes(attendance.in_time, attendance.out_time);
        } else if (isCurrentMonth && d === todayDate) {
          const nowIST = getISTMoment().format('hh:mm A');
          const liveMinutes = calculateWorkingMinutes(attendance.in_time, nowIST);
          if (liveMinutes >= 0 && liveMinutes < 24 * 60) {
            totalWorkedMinutes += liveMinutes;
          }
        }
      } else if (!leaveDateMap[dateStr] && !holidaySet.has(dateStr)) {
        absentDays++;
      }
    }

    const requiredMinutes = requiredHours * 60;
    const pendingMinutes = Math.max(0, requiredMinutes - totalWorkedMinutes);
    const completionPercent = Math.min(100, Math.round((totalWorkedMinutes / requiredMinutes) * 100));
    const avgMinutesPerDay = presentDays > 0 ? Math.round(totalWorkedMinutes / presentDays) : 0;

    res.json({
      success: true,
      data: {
        month: currentMonth,
        year: currentYear,
        month_name: new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' }),
        required_hours: requiredHours,
        required_minutes: requiredMinutes,
        worked_hours: formatMinutes(totalWorkedMinutes),
        worked_minutes: totalWorkedMinutes,
        pending_hours: formatMinutes(pendingMinutes),
        pending_minutes: pendingMinutes,
        completion_percent: completionPercent,
        avg_hours_per_day: formatMinutes(avgMinutesPerDay),
        total_days_in_month: allDates.length,
        present_days: presentDays,
        absent_days: absentDays,
        leave_days: leaveCount,
        holiday_count: holidayCount,
        weekend_count: weekendCount,
        settings: {
          required_hours: requiredHours,
          daily_hours: dailyHours,
          holidays_count: holidays.length,
          weekly_off: weeklyOff,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// GET CALENDAR
// ════════════════════════════════════════════════════════════
const getCalendar = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();

    const MonthlySettings = require('../models/MonthlySettings');
    const Leave = require('../models/Leave');

    const settings = await MonthlySettings.findOne({
      company_id: req.employee.company_id?._id || req.employee.company_id,
      month: currentMonth,
      year: currentYear,
    });

    const holidays = settings?.holidays || [];
    const weeklyOff = settings?.weekly_off || ['Sunday'];
    const dailyMinutes = (settings?.daily_hours || 8) * 60;

    const allDates = getDatesInMonth(currentMonth, currentYear);
    const attendanceRecords = await Attendance.find({
      emp_id: req.employee._id,
      date: { $in: allDates },
    });

    const allLeaves = await Leave.find({ emp_id: req.employee._id, status: 'approved' });

    const leaveDateMap = {};
    allLeaves.forEach((l) => {
      const [fd, fm, fy] = l.from_date.split('/').map(Number);
      const [td, tm, ty] = l.to_date.split('/').map(Number);
      const fromDate = new Date(fy, fm - 1, fd);
      const toDate = new Date(ty, tm - 1, td);
      const current = new Date(fromDate);
      while (current <= toDate) {
        const key = `${current.getDate()}/${current.getMonth() + 1}/${current.getFullYear()}`;
        leaveDateMap[key] = l;
        current.setDate(current.getDate() + 1);
      }
    });

    const holidayMap = {};
    holidays.forEach((h) => { holidayMap[h.date] = h.name; });

    const todayIST = getISTMoment();
    const todayDate = todayIST.date();
    const isCurrentMonth = currentMonth === (todayIST.month() + 1) && currentYear === todayIST.year();

    const calendar = allDates.map((dateStr) => {
      const [d] = dateStr.split('/').map(Number);
      const dayName = getDayName(dateStr);
      const attendance = attendanceRecords.find((a) => a.date === dateStr);
      const leave = leaveDateMap[dateStr];
      const holiday = holidayMap[dateStr];
      const isFuture = isCurrentMonth && d > todayDate;
      const isToday = isCurrentMonth && d === todayDate;

      let status = 'absent';
      let hours = '0h 0m';
      let minutes = 0;
      let extraInfo = {};

      if (isFuture) status = 'future';
      else if (weeklyOff.includes(dayName)) status = 'weekend';
      else if (holiday) {
        status = 'holiday';
        extraInfo.holiday_name = holiday;
        hours = formatMinutes(dailyMinutes);
        minutes = dailyMinutes;
      } else if (leave) {
        status = leave.is_half_day ? 'half-day-leave' : 'leave';
        extraInfo.leave_type = leave.leave_type;
        extraInfo.half_day_period = leave.half_day_period;
        const creditMin = leave.is_half_day ? dailyMinutes / 2 : dailyMinutes;
        hours = formatMinutes(creditMin);
        minutes = creditMin;
      } else if (attendance && attendance.in_time) {
        status = attendance.out_time ? 'present' : 'in-progress';
        extraInfo.in_time = attendance.in_time;
        extraInfo.out_time = attendance.out_time;
        extraInfo.in_site = attendance.in_site;
        extraInfo.out_site = attendance.out_site;

        if (attendance.out_time) {
          minutes = calculateWorkingMinutes(attendance.in_time, attendance.out_time);
        } else if (isToday) {
          const nowIST = getISTMoment().format('hh:mm A');
          const liveMin = calculateWorkingMinutes(attendance.in_time, nowIST);
          if (liveMin >= 0 && liveMin < 24 * 60) {
            minutes = liveMin;
          }
        }
        hours = formatMinutes(minutes);
      }

      return {
        date: dateStr,
        day: d,
        day_name: dayName,
        status,
        hours,
        minutes,
        is_today: isToday,
        ...extraInfo,
      };
    });

    res.json({
      success: true,
      data: {
        month: currentMonth,
        year: currentYear,
        month_name: new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' }),
        days: calendar,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════
// GET SALARY ESTIMATE
// ════════════════════════════════════════════════════════════
const getSalaryEstimate = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();

    const MonthlySettings = require('../models/MonthlySettings');
    const Leave = require('../models/Leave');
    const LeaveBalance = require('../models/LeaveBalance');

    const employee = await Employee.findById(req.employee._id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const monthlySalary = employee.monthly_salary || 0;
    const settings = await MonthlySettings.findOne({
      company_id: employee.company_id?._id || employee.company_id,
      month: currentMonth,
      year: currentYear,
    });

    const requiredHours = settings?.required_hours || 240;
    const dailyHours = settings?.daily_hours || 8;
    const dailyMinutes = dailyHours * 60;
    const holidays = settings?.holidays || [];
    const weeklyOff = settings?.weekly_off || ['Sunday'];

    const perHourRate = monthlySalary > 0 ? monthlySalary / requiredHours : 0;
    const perDayRate = monthlySalary > 0 ? monthlySalary / 30 : 0;

    const allDates = getDatesInMonth(currentMonth, currentYear);
    const attendanceRecords = await Attendance.find({
      emp_id: employee._id,
      date: { $in: allDates },
    });

    const allLeaves = await Leave.find({ emp_id: employee._id, status: 'approved' });
    const monthLeaves = allLeaves.filter((l) => {
      const [d, m, y] = l.from_date.split('/').map(Number);
      return m === currentMonth && y === currentYear;
    });

    let totalPaidLeaveDays = 0;
    let totalUnpaidLeaveDays = 0;
    monthLeaves.forEach((l) => {
      totalPaidLeaveDays += l.paid_days || 0;
      totalUnpaidLeaveDays += l.unpaid_days || 0;
    });

    const paidLeaveMinutes = totalPaidLeaveDays * dailyMinutes;

    const leaveDateSet = new Set();
    monthLeaves.forEach((l) => {
      const [fd, fm, fy] = l.from_date.split('/').map(Number);
      const [td, tm, ty] = l.to_date.split('/').map(Number);
      const fromDate = new Date(fy, fm - 1, fd);
      const toDate = new Date(ty, tm - 1, td);
      const current = new Date(fromDate);
      while (current <= toDate) {
        leaveDateSet.add(`${current.getDate()}/${current.getMonth() + 1}/${current.getFullYear()}`);
        current.setDate(current.getDate() + 1);
      }
    });

    const holidaySet = new Set(holidays.map((h) => h.date));
    let totalWorkedMinutes = 0;
    let holidayMinutes = 0;
    let presentDays = 0;
    let absentDays = 0;

    const todayIST = getISTMoment();
    const todayDate = todayIST.date();
    const isCurrentMonth = currentMonth === (todayIST.month() + 1) && currentYear === todayIST.year();

    for (const dateStr of allDates) {
      const [d] = dateStr.split('/').map(Number);
      const dayName = getDayName(dateStr);
      if (isCurrentMonth && d > todayDate) continue;
      if (weeklyOff.includes(dayName)) continue;
      if (holidaySet.has(dateStr)) { holidayMinutes += dailyMinutes; continue; }

      const attendance = attendanceRecords.find((a) => a.date === dateStr);
      if (attendance && attendance.in_time) {
        presentDays++;
        if (attendance.out_time) {
          totalWorkedMinutes += calculateWorkingMinutes(attendance.in_time, attendance.out_time);
        } else if (isCurrentMonth && d === todayDate) {
          const nowIST = getISTMoment().format('hh:mm A');
          const liveMin = calculateWorkingMinutes(attendance.in_time, nowIST);
          if (liveMin >= 0 && liveMin < 24 * 60) {
            totalWorkedMinutes += liveMin;
          }
        }
      } else if (!leaveDateSet.has(dateStr) && !holidaySet.has(dateStr)) {
        absentDays++;
      }
    }

    const totalPaidMinutes = totalWorkedMinutes + paidLeaveMinutes + holidayMinutes;
    const totalPaidHours = totalPaidMinutes / 60;
    const estimatedSalary = Math.round(totalPaidHours * perHourRate);
    const unpaidDeduction = Math.round(totalUnpaidLeaveDays * perDayRate);
    const absentDeduction = Math.round(absentDays * perDayRate);
    const totalDeduction = Math.max(0, monthlySalary - estimatedSalary);

    const balance = await LeaveBalance.findOne({ emp_id: employee._id });

    res.json({
      success: true,
      data: {
        month: currentMonth,
        year: currentYear,
        month_name: new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' }),
        base_salary: monthlySalary,
        required_hours: requiredHours,
        per_hour_rate: parseFloat(perHourRate.toFixed(2)),
        per_day_rate: parseFloat(perDayRate.toFixed(2)),
        worked_hours: formatMinutes(totalWorkedMinutes),
        worked_minutes: totalWorkedMinutes,
        holiday_hours: formatMinutes(holidayMinutes),
        holiday_minutes: holidayMinutes,
        paid_leave_hours: formatMinutes(paidLeaveMinutes),
        paid_leave_minutes: paidLeaveMinutes,
        total_paid_hours: formatMinutes(totalPaidMinutes),
        total_paid_minutes: totalPaidMinutes,
        current_leave_balance: balance?.current_balance || 0,
        leaves_taken_this_month: monthLeaves.reduce((sum, l) => sum + (l.approved_days || 0), 0),
        paid_leave_days: totalPaidLeaveDays,
        unpaid_leave_days: totalUnpaidLeaveDays,
        present_days: presentDays,
        absent_days: absentDays,
        holiday_count: holidays.length,
        estimated_salary: estimatedSalary,
        deduction: totalDeduction,
        unpaid_deduction: unpaidDeduction,
        absent_deduction: absentDeduction,
        deduction_percent: monthlySalary > 0
          ? parseFloat(((totalDeduction / monthlySalary) * 100).toFixed(1))
          : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  markAttendance,
  getMyAttendance,
  getTodayAttendance,
  getAllAttendance,
  getTodayStatus,
  getMonthlySummary,
  getCalendar,
  getSalaryEstimate,
  reviewAttendance,
};