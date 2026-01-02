// Singapore Public Holidays for 2025
export const SINGAPORE_PUBLIC_HOLIDAYS_2025 = [
    '2025-01-01', // New Year's Day
    '2025-01-29', // Chinese New Year
    '2025-01-30', // Chinese New Year
    '2025-03-29', // Good Friday
    '2025-04-18', // Hari Raya Puasa
    '2025-05-01', // Labour Day
    '2025-05-12', // Vesak Day
    '2025-05-24', // Hari Raya Haji
    '2025-08-09', // National Day
    '2025-10-29', // Deepavali
    '2025-12-25', // Christmas Day
];

// Singapore Public Holidays for 2026
export const SINGAPORE_PUBLIC_HOLIDAYS_2026 = [
    '2026-01-01', // New Year's Day - Thursday
    '2026-02-17', // Chinese New Year - Tuesday
    '2026-02-18', // Chinese New Year - Wednesday
    '2026-03-21', // Hari Raya Puasa - Saturday
    '2026-04-03', // Good Friday - Friday
    '2026-05-01', // Labour Day - Friday
    '2026-05-27', // Hari Raya Haji - Wednesday
    '2026-05-31', // Vesak Day - Sunday
    '2026-08-09', // National Day - Sunday
    '2026-08-10', // National Day (compensatory) - Monday
    '2026-11-08', // Deepavali - Sunday
    '2026-11-09', // Deepavali (compensatory) - Monday
    '2026-12-25', // Christmas Day - Friday
];

/**
 * Check if a date is a Sunday
 */
export function isSunday(date) {
    return date.getDay() === 0;
}

/**
 * Check if a date is a public holiday
 * Automatically checks both 2025 and 2026 holidays based on the date's year
 */
export function isPublicHoliday(date, year = null) {
    const dateStr = date.toISOString().split('T')[0];
    const dateYear = year || new Date(date).getFullYear();
    
    // Check the appropriate year's holidays
    if (dateYear === 2025) {
        return SINGAPORE_PUBLIC_HOLIDAYS_2025.includes(dateStr);
    } else if (dateYear === 2026) {
        return SINGAPORE_PUBLIC_HOLIDAYS_2026.includes(dateStr);
    }
    
    // For other years, check both (for backward compatibility)
    return SINGAPORE_PUBLIC_HOLIDAYS_2025.includes(dateStr) || 
           SINGAPORE_PUBLIC_HOLIDAYS_2026.includes(dateStr);
}

/**
 * Calculate time difference in hours
 */
export function calculateHours(startTime, endTime) {
    if (!startTime || !endTime) return 0;

    const start = new Date(startTime);
    const end = new Date(endTime);

    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);

    return Math.max(0, diffHours);
}

/**
 * Calculate time difference in minutes
 */
export function calculateMinutes(startTime, endTime) {
    if (!startTime || !endTime) return 0;

    const start = new Date(startTime);
    const end = new Date(endTime);

    const diffMs = end - start;
    const diffMinutes = diffMs / (1000 * 60);

    return Math.max(0, diffMinutes);
}

/**
 * Get normal work end time (5:00 PM)
 */
export function getNormalWorkEndTime(date) {
    const endTime = new Date(date);
    endTime.setHours(17, 0, 0, 0); // 5:00 PM
    return endTime;
}

/**
 * Calculate worked hours, OT hours, and sunday hours according to the new rules
 * Supports both old lunch_start/lunch_end format and new breaks array format
 */
export function calculateShiftHours(entryTime, leaveTime, breaksOrLunchStart = [], workDate, lunchEnd = null) {
    if (!entryTime || !leaveTime) {
        return {
            basicHours: 0,
            sundayHours: 0,
            otHours: 0,
            totalDuration: 0,
            netWorkedHours: 0,
            breakHours: 0,
            basicDay: 0
        };
    }

    const date = new Date(workDate);
    const isSunday = date.getDay() === 0;
    const isHoliday = isPublicHoliday(date);

    // Calculate total duration from entry to leave (supports overnight)
    const totalDuration = calculateHours(entryTime, leaveTime);

    // Calculate total break hours - handle both old and new formats
    let totalBreakHours = 0;

    // Check if it's the old format (lunch_start as string, lunch_end as parameter)
    if (typeof breaksOrLunchStart === 'string' && lunchEnd) {
        // Old format: lunch_start and lunch_end as separate parameters
        if (breaksOrLunchStart && lunchEnd) {
            totalBreakHours = calculateHours(breaksOrLunchStart, lunchEnd);
        }
    } else if (breaksOrLunchStart && Array.isArray(breaksOrLunchStart) && breaksOrLunchStart.length > 0) {
        // New format: breaks as array
        breaksOrLunchStart.forEach(breakItem => {
            if (breakItem.break_start && breakItem.break_end) {
                totalBreakHours += calculateHours(breakItem.break_start, breakItem.break_end);
            }
        });
    }

    // Calculate net worked hours (total duration minus all breaks)
    const netWorkedHours = Math.max(0, totalDuration - totalBreakHours);

    let basicHours = 0;
    let otHours = 0;
    let sundayHours = 0;
    let basicDay = 0;

    if (isSunday || isHoliday) {
        // All net worked hours go to Sunday/PH hours
        sundayHours = netWorkedHours;
        basicHours = 0;
        otHours = 0;
        basicDay = 0;
    } else {
        // Basic hours capped at 8, OT is remaining hours
        basicHours = Math.min(8, netWorkedHours);
        otHours = Math.max(0, netWorkedHours - 8);
        sundayHours = 0;
        basicDay = basicHours / 8;
    }

    // Round to 2 decimal places
    const roundedBasicHours = Math.round(basicHours * 100) / 100;
    const roundedSundayHours = Math.round(sundayHours * 100) / 100;
    const roundedOtHours = Math.round(otHours * 100) / 100;
    const roundedTotalDuration = Math.round(totalDuration * 100) / 100;
    const roundedNetWorkedHours = Math.round(netWorkedHours * 100) / 100;
    const roundedBreakHours = Math.round(totalBreakHours * 100) / 100;
    const roundedBasicDay = Math.round(basicDay * 100) / 100;

    return {
        basicHours: roundedBasicHours,
        sundayHours: roundedSundayHours,
        otHours: roundedOtHours,
        totalDuration: roundedTotalDuration,
        netWorkedHours: roundedNetWorkedHours,
        breakHours: roundedBreakHours,
        basicDay: roundedBasicDay
    };
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance * 1000; // Convert to meters
}

/**
 * Format time for display (HH:mm) in 24-hour format
 */
export function formatTime(dateTime) {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return new Intl.DateTimeFormat('en-SG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Singapore'
    }).format(date);
}

/**
 * Format date for display (DD/MM/YYYY)
 */
export function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-SG', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Singapore'
    });
}

/**
 * Get today's date in Singapore timezone (YYYY-MM-DD format)
 * This ensures correct date calculation for shifts that start after midnight
 */
export function getTodaySingapore() {
    const now = new Date();
    // Convert to Singapore timezone and get date string
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Singapore',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(now);
}

/**
 * Extract work date from a datetime string in Singapore timezone (YYYY-MM-DD format)
 * This ensures correct date calculation for shifts that start after midnight
 * @param {string} dateTime - ISO datetime string
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getWorkDateFromDateTime(dateTime) {
    if (!dateTime) return null;
    const date = new Date(dateTime);
    // Convert to Singapore timezone and get date string
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Singapore',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

/**
 * Check if a shift is complete (has leave time)
 */
export function isShiftComplete(shift) {
    return shift && shift.has_left && shift.leave_time;
}
