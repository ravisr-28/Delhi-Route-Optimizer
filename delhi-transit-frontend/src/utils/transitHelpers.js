// Extracted helper functions from App.jsx (#10)
import { getCrowdLevel } from './stationInfo';

// Platform walking distances at major interchange stations (meters)
export const PLATFORM_DISTANCES = {
    'Rajiv Chowk': { distance: 250, time: 3, note: 'Underground interchange' },
    'Kashmere Gate': { distance: 350, time: 4, note: '3-line junction' },
    'Central Secretariat': { distance: 200, time: 3, note: 'Cross-platform' },
    'Mandi House': { distance: 180, time: 2, note: 'Adjacent platforms' },
    'Kirti Nagar': { distance: 150, time: 2, note: 'Same level' },
    'Botanical Garden': { distance: 280, time: 3, note: 'Elevated interchange' },
    'Yamuna Bank': { distance: 200, time: 3, note: 'Fork junction' },
    'Hauz Khas': { distance: 220, time: 3, note: 'Deep underground' },
    'Rajouri Garden': { distance: 170, time: 2, note: 'Adjacent platforms' },
    'Inderlok': { distance: 160, time: 2, note: 'Same level' },
    'Welcome': { distance: 190, time: 2, note: 'Adjacent platforms' },
    'Anand Vihar ISBT': { distance: 300, time: 4, note: 'Long corridor' },
    'New Delhi': { distance: 320, time: 4, note: 'Airport Express link' },
    'Dhaula Kuan': { distance: 180, time: 2, note: 'Adjacent platforms' },
    'Janakpuri West': { distance: 200, time: 3, note: 'Multi-level' },
    'Lajpat Nagar': { distance: 190, time: 2, note: 'Cross-platform' },
    'Kalkaji Mandir': { distance: 210, time: 3, note: 'Elevated interchange' },
};

export function getPlatformWalk(stationName) {
    return PLATFORM_DISTANCES[stationName] || { distance: 150 + (stationName.length * 7) % 150, time: 2, note: 'Platform change' };
}

// Haversine — straight-line distance in km
export function haversineKm(c1, c2) {
    const toRad = d => (d * Math.PI) / 180;
    const [lat1, lon1] = c1, [lat2, lon2] = c2;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Estimate bus travel time & fare for a route
export function estimateBus(fromCoords, toCoords) {
    const straightKm = haversineKm(fromCoords, toCoords);
    const roadKm = straightKm * 1.4; // road winding factor
    const hour = new Date().getHours();
    const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
    const avgSpeed = isPeak ? 12 : 18; // km/h in Delhi traffic
    const travelMin = Math.round((roadKm / avgSpeed) * 60);
    const totalMin = travelMin + 8; // +8 min for waiting & stops
    // DTC fare: ₹5 base + ₹1/km, AC: ₹10 base + ₹2/km
    const fareNonAC = Math.min(Math.round(5 + roadKm * 1), 40);
    const fareAC = Math.min(Math.round(10 + roadKm * 2), 75);

    // Bus delay estimation based on time of day
    let delayMin = 0, delayStatus = 'On Time', delayColor = '#22c55e';
    if (hour >= 8 && hour <= 10) {
        delayMin = 10 + Math.round(roadKm * 0.5);
        delayStatus = 'Delayed';
        delayColor = '#f97316';
    } else if (hour >= 17 && hour <= 20) {
        delayMin = 15 + Math.round(roadKm * 0.6);
        delayStatus = 'Heavily Delayed';
        delayColor = '#ef4444';
    } else if ((hour >= 11 && hour <= 16) || (hour >= 7 && hour < 8)) {
        delayMin = 3 + Math.round(roadKm * 0.2);
        delayStatus = 'Slightly Delayed';
        delayColor = '#eab308';
    } else {
        delayMin = 0;
        delayStatus = 'On Time';
        delayColor = '#22c55e';
    }

    return { roadKm: roadKm.toFixed(1), travelMin: totalMin, fareNonAC, fareAC, isPeak, delayMin, delayStatus, delayColor };
}

// Get metro crowd status summary for a route
export function getMetroCrowdSummary(path) {
    if (!path || path.length === 0) return { level: 'Low', color: '#22c55e', percent: 15, icon: 'fas fa-check-circle' };
    let totalPercent = 0;
    path.forEach(step => {
        const crowd = getCrowdLevel(step.name);
        totalPercent += crowd.percent;
    });
    const avgPercent = Math.round(totalPercent / path.length);
    if (avgPercent >= 75) return { level: 'Very Crowded', color: '#ef4444', percent: avgPercent, icon: 'fas fa-users' };
    if (avgPercent >= 55) return { level: 'Crowded', color: '#f97316', percent: avgPercent, icon: 'fas fa-user-friends' };
    if (avgPercent >= 35) return { level: 'Moderate', color: '#eab308', percent: avgPercent, icon: 'fas fa-user' };
    return { level: 'Comfortable', color: '#22c55e', percent: avgPercent, icon: 'fas fa-smile-beam' };
}