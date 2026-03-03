/**
 * Real-time station information service
 * Simulates crowd levels based on peak hours and station importance,
 * and tracks defective machines at stations.
 */

// Major interchange / high-traffic stations — default to "High" crowd
const MAJOR_STATIONS = new Set([
    'Rajiv Chowk',
    'Kashmere Gate',
    'New Delhi',
    'Chandni Chowk',
    'Central Secretariat',
    'Hauz Khas',
    'AIIMS',
    'Huda City Centre',
    'Dwarka Sector 21',
    'Noida Electronic City',
    'Noida Sector 18',
    'Botanical Garden',
    'Yamuna Bank',
    'Mandi House',
    'ITO',
    'Connaught Place',
    'Patel Chowk',
    'Anand Vihar ISBT',
    'Vaishali',
    'Lajpat Nagar',
    'Nehru Place',
    'Saket',
    'Karol Bagh',
    'Inderlok',
    'Kirti Nagar',
    'Rajouri Garden',
    'Janakpuri West',
    'ISBT Kashmere Gate',
    'Sikandarpur',
    'Akshardham',
]);

// Machine types that can be defective
const MACHINE_TYPES = [
    { type: 'TVM', label: 'Ticket Vending Machine', icon: '🎫' },
    { type: 'Escalator', label: 'Escalator', icon: '🔼' },
    { type: 'Lift', label: 'Lift / Elevator', icon: '🛗' },
    { type: 'Gate', label: 'Entry/Exit Gate', icon: '🚪' },
    { type: 'Display', label: 'Info Display Board', icon: '📺' },
];

// Peak hour definitions
const PEAK_HOURS = {
    morningStart: 8,   // 8 AM
    morningEnd: 10,    // 10 AM
    eveningStart: 17,  // 5 PM
    eveningEnd: 20,    // 8 PM
};

// Shoulder hour (moderately busy) — 1 hour before/after peak
const SHOULDER_HOURS = {
    morningBefore: 7,
    morningAfter: 11,
    eveningBefore: 16,
    eveningAfter: 21,
};

/**
 * Determine crowd level based on time of day and station type
 */
export function getCrowdLevel(stationName, currentTime = new Date()) {
    const hour = currentTime.getHours();
    const isMajor = MAJOR_STATIONS.has(stationName);

    const isPeak =
        (hour >= PEAK_HOURS.morningStart && hour < PEAK_HOURS.morningEnd) ||
        (hour >= PEAK_HOURS.eveningStart && hour < PEAK_HOURS.eveningEnd);

    const isShoulder =
        (hour >= SHOULDER_HOURS.morningBefore && hour < PEAK_HOURS.morningStart) ||
        (hour >= PEAK_HOURS.morningEnd && hour < SHOULDER_HOURS.morningAfter) ||
        (hour >= SHOULDER_HOURS.eveningBefore && hour < PEAK_HOURS.eveningStart) ||
        (hour >= PEAK_HOURS.eveningEnd && hour < SHOULDER_HOURS.eveningAfter);

    const isLateNight = hour >= 22 || hour < 6;

    // Seed-based pseudo-random for consistency per station
    const seed = stationName.length * 7 + stationName.charCodeAt(0);
    const variation = (seed % 3) - 1; // -1, 0, or 1

    if (isPeak) {
        if (isMajor) return { level: 'Very High', color: '#EF4444', bg: '#FEE2E2', percent: 85 + variation * 5 };
        return { level: 'High', color: '#F97316', bg: '#FFEDD5', percent: 65 + variation * 5 };
    }

    if (isShoulder) {
        if (isMajor) return { level: 'High', color: '#F97316', bg: '#FFEDD5', percent: 60 + variation * 5 };
        return { level: 'Medium', color: '#EAB308', bg: '#FEF9C3', percent: 45 + variation * 5 };
    }

    if (isLateNight) {
        return { level: 'Low', color: '#22C55E', bg: '#DCFCE7', percent: 10 + variation * 3 };
    }

    // Normal hours
    if (isMajor) return { level: 'High', color: '#F97316', bg: '#FFEDD5', percent: 55 + variation * 5 };
    return { level: 'Medium', color: '#EAB308', bg: '#FEF9C3', percent: 35 + variation * 5 };
}

/**
 * Get time period label
 */
export function getTimePeriod(currentTime = new Date()) {
    const hour = currentTime.getHours();
    if (hour >= 22 || hour < 6) return { label: 'Late Night', emoji: '🌙' };
    if (hour >= PEAK_HOURS.morningStart && hour < PEAK_HOURS.morningEnd) return { label: 'Morning Rush', emoji: '🌅' };
    if (hour >= PEAK_HOURS.eveningStart && hour < PEAK_HOURS.eveningEnd) return { label: 'Evening Rush', emoji: '🌇' };
    if (hour >= 6 && hour < 12) return { label: 'Morning', emoji: '☀️' };
    if (hour >= 12 && hour < 17) return { label: 'Afternoon', emoji: '🌤️' };
    return { label: 'Evening', emoji: '🌆' };
}

// ---- Defective machines state (in-memory, persists during session) ----

// Generate initial defective machines for each station deterministically
const _defectiveCache = {};

function _generateDefects(stationName) {
    const seed = stationName.split('').reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0);
    const defects = [];

    // ~30% chance of at least 1 defect, major stations have more
    const isMajor = MAJOR_STATIONS.has(stationName);
    const defectChance = isMajor ? 0.45 : 0.2;

    MACHINE_TYPES.forEach((machine, idx) => {
        const hash = (seed * (idx + 3) + idx * 17) % 100;
        if (hash < defectChance * 100) {
            const reportedHoursAgo = (hash % 12) + 1;
            const reportedAt = new Date();
            reportedAt.setHours(reportedAt.getHours() - reportedHoursAgo);

            defects.push({
                id: `${stationName}-${machine.type}-${idx}`,
                ...machine,
                location: _getLocation(seed, idx),
                reportedAt: reportedAt.toISOString(),
                status: 'defective', // 'defective' | 'fixed'
            });
        }
    });

    return defects;
}

function _getLocation(seed, idx) {
    const locations = [
        'Platform 1', 'Platform 2', 'Entry Gate A', 'Entry Gate B',
        'Exit Gate', 'Concourse Level', 'Ground Floor', 'Mezzanine',
        'Near Parking', 'Main Lobby'
    ];
    return locations[(seed + idx * 5) % locations.length];
}

/**
 * Get defective machines at a station
 */
export function getDefectiveMachines(stationName) {
    if (!_defectiveCache[stationName]) {
        _defectiveCache[stationName] = _generateDefects(stationName);
    }
    return _defectiveCache[stationName].filter(m => m.status === 'defective');
}

/**
 * Mark a machine as fixed
 */
export function markMachineFixed(machineId) {
    for (const station of Object.keys(_defectiveCache)) {
        const machine = _defectiveCache[station].find(m => m.id === machineId);
        if (machine) {
            machine.status = 'fixed';
            machine.fixedAt = new Date().toISOString();
            return true;
        }
    }
    return false;
}

/**
 * Get full station info
 */
export function getStationInfo(stationName) {
    const crowd = getCrowdLevel(stationName);
    const defects = getDefectiveMachines(stationName);
    const timePeriod = getTimePeriod();
    const isMajor = MAJOR_STATIONS.has(stationName);

    return {
        stationName,
        isMajor,
        crowd,
        timePeriod,
        defects,
        lastUpdated: new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        }),
    };
}

/**
 * Check if a station is a major station
 */
export function isMajorStation(stationName) {
    return MAJOR_STATIONS.has(stationName);
}
