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

/**
 * Check if a date is a Sunday
 */
export function isSunday(date) {
    return date.getDay() === 0;
}

/**
 * Check if a date is a public holiday
 */
export function isPublicHoliday(date, year = 2025) {
    const dateStr = date.toISOString().split('T')[0];
    return SINGAPORE_PUBLIC_HOLIDAYS_2025.includes(dateStr);
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
 * Calculate worked hours, OT hours, and sunday hours according to the rules
 */
export function calculateShiftHours(entryTime, leaveTime, lunchStart, lunchEnd, workDate) {
    if (!entryTime || !leaveTime) {
        return {
            workedHours: 0,
            sundayHours: 0,
            otHours: 0,
            totalMinutes: 0,
            lunchMinutes: 0,
            otMinutes: 0,
            workedMinutes: 0
        };
    }

    const date = new Date(workDate);
    const isSunday = date.getDay() === 0;
    const isHoliday = isPublicHoliday(date);

    // Calculate total time from entry to leave
    const totalMinutes = calculateMinutes(entryTime, leaveTime);

    // Calculate lunch time (subtract only once from total time)
    let lunchMinutes = 0;
    if (lunchStart && lunchEnd) {
        lunchMinutes = calculateMinutes(lunchStart, lunchEnd);
    }

    // Calculate productive time (total time minus lunch break)
    const productiveMinutes = totalMinutes - lunchMinutes;

    // Determine regular work period (up to 5:00 PM)
    const normalEndTime = getNormalWorkEndTime(date);
    const entryDateTime = new Date(entryTime);
    const leaveDateTime = new Date(leaveTime);

    // Calculate how much productive time falls within regular hours (before 5 PM)
    const regularStart = entryDateTime;
    const regularEnd = new Date(Math.min(leaveDateTime, normalEndTime));
    let regularMinutes = 0;

    if (regularEnd > regularStart) {
        regularMinutes = calculateMinutes(regularStart, regularEnd);
        // Subtract lunch time that falls within regular hours
        if (lunchStart && lunchEnd) {
            const lunchStartTime = new Date(lunchStart);
            const lunchEndTime = new Date(lunchEnd);
            if (lunchStartTime < regularEnd && lunchEndTime > regularStart) {
                const lunchOverlapStart = new Date(Math.max(lunchStartTime, regularStart));
                const lunchOverlapEnd = new Date(Math.min(lunchEndTime, regularEnd));
                const lunchInRegularMinutes = calculateMinutes(lunchOverlapStart, lunchOverlapEnd);
                regularMinutes -= lunchInRegularMinutes;
            }
        }
    }

    // Calculate OT time (after 5:00 PM)
    let otMinutes = 0;
    if (leaveDateTime > normalEndTime) {
        const otStart = new Date(Math.max(entryDateTime, normalEndTime));
        const otEnd = leaveDateTime;
        otMinutes = calculateMinutes(otStart, otEnd);

        // Subtract lunch time that falls within OT hours
        if (lunchStart && lunchEnd) {
            const lunchStartTime = new Date(lunchStart);
            const lunchEndTime = new Date(lunchEnd);
            if (lunchStartTime < otEnd && lunchEndTime > otStart) {
                const lunchOverlapStart = new Date(Math.max(lunchStartTime, otStart));
                const lunchOverlapEnd = new Date(Math.min(lunchEndTime, otEnd));
                const lunchInOtMinutes = calculateMinutes(lunchOverlapStart, lunchOverlapEnd);
                otMinutes -= lunchInOtMinutes;
            }
        }
    }

    // Ensure we don't double-count time
    const totalAccountedMinutes = regularMinutes + otMinutes;
    if (totalAccountedMinutes > productiveMinutes) {
        // Adjust OT minutes if there's overlap or calculation error
        otMinutes = Math.max(0, productiveMinutes - regularMinutes);
    }

    // Apply Sunday/Public Holiday logic
    let workedHours = 0;
    let sundayHours = 0;
    let otHours = otMinutes / 60;

    if (isSunday || isHoliday) {
        // On Sundays and public holidays, regular work hours become Sunday/PH hours
        sundayHours = regularMinutes / 60;
        // OT remains as OT (not double-counted)
    } else {
        workedHours = regularMinutes / 60;
    }

    // Round to 2 decimal places
    workedHours = Math.round(workedHours * 100) / 100;
    sundayHours = Math.round(sundayHours * 100) / 100;
    otHours = Math.round(otHours * 100) / 100;

    return {
        workedHours,
        sundayHours,
        otHours,
        totalMinutes,
        lunchMinutes,
        otMinutes,
        workedMinutes: regularMinutes
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
 * Format time for display (HH:mm)
 */
export function formatTime(dateTime) {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-SG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
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
        year: 'numeric'
    });
}

/**
 * Check if a shift is complete (has leave time)
 */
export function isShiftComplete(shift) {
    return shift && shift.has_left && shift.leave_time;
}
