// Route search utility — fuzzy station matching + BFS multi-line pathfinding
import delhiMetroLines from '../data/metroData';
import delhiPlaces from '../data/delhiPlaces';

// Haversine — distance in km between two [lat,lng] points
function haversineKm(c1, c2) {
    const toRad = d => (d * Math.PI) / 180;
    const [lat1, lon1] = c1, [lat2, lon2] = c2;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Search Delhi places by name (fuzzy)
 */
export function searchPlaces(query) {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    const exact = [], startsWith = [], includes = [];
    delhiPlaces.forEach(p => {
        const lower = p.name.toLowerCase();
        if (lower === q) exact.push(p);
        else if (lower.startsWith(q)) startsWith.push(p);
        else if (lower.includes(q)) includes.push(p);
    });
    return [...exact, ...startsWith, ...includes].slice(0, 6);
}

/**
 * Find nearest metro station to given coordinates
 * Returns { station, line, lineKey, distance, walkTime, direction }
 */
export function findNearestStation(coords) {
    let best = null;
    Object.entries(delhiMetroLines).forEach(([lineKey, lineData]) => {
        lineData.stations.forEach(station => {
            const dist = haversineKm(coords, station.coords);
            if (!best || dist < best.distance) {
                best = {
                    station,
                    line: lineData.name,
                    lineKey,
                    lineColor: lineData.color,
                    distance: dist,
                };
            }
        });
    });
    if (!best) return null;

    const distM = Math.round(best.distance * 1000);
    const walkMin = Math.max(1, Math.round((best.distance / 5) * 60));

    // Cardinal direction from the place to the station
    const dLat = best.station.coords[0] - coords[0];
    const dLon = best.station.coords[1] - coords[1];
    let dir = '';
    if (Math.abs(dLat) > Math.abs(dLon)) dir = dLat > 0 ? 'North' : 'South';
    else dir = dLon > 0 ? 'East' : 'West';
    if (Math.abs(dLat) > 0.001 && Math.abs(dLon) > 0.001) {
        dir = (dLat > 0 ? 'North' : 'South') + '-' + (dLon > 0 ? 'East' : 'West');
    }

    // How to get there
    let howToReach = '';
    if (distM <= 300) howToReach = '🚶 Walk directly from the station exit';
    else if (distM <= 800) howToReach = '🚶 Walk (~' + walkMin + ' min) heading ' + dir;
    else if (distM <= 2000) howToReach = '🛺 Auto/e-rickshaw (~' + Math.max(1, Math.round(distM / 400)) + ' min) heading ' + dir;
    else howToReach = '🚕 Cab/auto (~' + Math.max(2, Math.round(distM / 500)) + ' min) heading ' + dir;

    return {
        ...best,
        distanceM: distM,
        distanceText: distM < 1000 ? `${distM}m` : `${best.distance.toFixed(1)}km`,
        walkMin,
        direction: dir,
        howToReach,
    };
}

/**
 * Check if a query matches a place (not a station)
 */
export function resolvePlace(name) {
    if (!name) return null;
    const q = name.toLowerCase().trim();
    const place = delhiPlaces.find(p => p.name.toLowerCase() === q);
    if (!place) return null;
    return { ...place, nearest: findNearestStation(place.coords) };
}

/**
 * Combined search — both stations and places for autocomplete
 */
export function searchAll(query) {
    const stations = searchStations(query).map(name => ({ name, type: 'station' }));
    const places = searchPlaces(query).map(p => ({ name: p.name, type: 'place', category: p.category }));
    // Interleave: stations first, then places, max 8 total
    return [...stations, ...places].slice(0, 8);
}

/**
 * Get all station names from all metro lines (unique, for autocomplete)
 */
export function getAllStationNames() {
    const names = new Set();
    Object.values(delhiMetroLines).forEach(line => {
        line.stations.forEach(s => names.add(s.name));
    });
    return [...names].sort();
}

/**
 * Fuzzy match a query to station names
 * Returns top matches sorted by relevance
 */
export function searchStations(query) {
    if (!query || query.trim().length < 1) return [];
    const q = query.toLowerCase().trim();
    const all = getAllStationNames();

    // Exact match first, then starts-with, then includes
    const exact = [];
    const startsWith = [];
    const includes = [];

    all.forEach(name => {
        const lower = name.toLowerCase();
        if (lower === q) exact.push(name);
        else if (lower.startsWith(q)) startsWith.push(name);
        else if (lower.includes(q)) includes.push(name);
    });

    return [...exact, ...startsWith, ...includes].slice(0, 8);
}

/**
 * Find which lines a station belongs to
 * Returns array of { lineKey, lineData, stationIndex }
 */
function findStationOnLines(stationName) {
    const results = [];
    const q = stationName.toLowerCase().trim();
    Object.entries(delhiMetroLines).forEach(([lineKey, lineData]) => {
        lineData.stations.forEach((s, idx) => {
            if (s.name.toLowerCase() === q) {
                results.push({ lineKey, lineData, stationIndex: idx });
            }
        });
    });
    return results;
}

/**
 * Build an adjacency graph of all stations for BFS
 * Nodes are station names (lowercase), edges connect:
 *  - consecutive stations on same line
 *  - same station name on different lines (interchange)
 */
function buildGraph() {
    const graph = {}; // stationName -> [ { station, lineKey, lineData } ]

    Object.entries(delhiMetroLines).forEach(([lineKey, lineData]) => {
        const stations = lineData.stations;
        for (let i = 0; i < stations.length; i++) {
            const name = stations[i].name.toLowerCase();
            if (!graph[name]) graph[name] = [];

            // Add edges to adjacent stations on this line
            if (i > 0) {
                graph[name].push({
                    station: stations[i - 1],
                    lineKey,
                    lineColor: lineData.color,
                    lineName: lineData.name
                });
            }
            if (i < stations.length - 1) {
                graph[name].push({
                    station: stations[i + 1],
                    lineKey,
                    lineColor: lineData.color,
                    lineName: lineData.name
                });
            }
        }
    });

    return graph;
}

/**
 * Find the optimal route between two stations using Dijkstra's algorithm
 * Options: { fastest, cheapest, minInterchange }
 */
export function findRoute(fromName, toName, options = {}) {
    if (!fromName || !toName) return null;

    const from = fromName.toLowerCase().trim();
    const to = toName.toLowerCase().trim();
    if (from === to) return null;

    const graph = buildGraph();
    if (!graph[from] || !graph[to]) return null;

    // Weights configuration based on options
    // Default weights: station=1, transfer=5
    let stationWeight = 1;
    let transferWeight = 5;

    if (options.cheapest) {
        // Cheapest focuses on fewer stations (since fare is station-based)
        stationWeight = 2;
        transferWeight = 2;
    }
    
    if (options.minInterchange || options.lessWalking) {
        // High penalty for transfers to minimize walking
        transferWeight = 20;
    }

    // Dijkstra's algorithm
    const distances = {};
    const previous = {};
    const nodesUsed = {}; // to store line info
    const pQueue = new Set();

    Object.keys(graph).forEach(node => {
        distances[node] = Infinity;
        previous[node] = null;
        nodesUsed[node] = null;
    });

    distances[from] = 0;
    pQueue.add(from);

    while (pQueue.size > 0) {
        // Get node with minimum distance
        let minNode = null;
        for (const node of pQueue) {
            if (!minNode || distances[node] < distances[minNode]) {
                minNode = node;
            }
        }

        if (!minNode || minNode === to) break;
        pQueue.delete(minNode);

        const currentLine = nodesUsed[minNode];
        const neighbors = graph[minNode] || [];

        for (const neighbor of neighbors) {
            const neighborName = neighbor.station.name.toLowerCase();
            
            // Calculate edge weight
            // If line changes, add transfer weight
            const isTransfer = currentLine && currentLine !== neighbor.lineKey;
            const weight = stationWeight + (isTransfer ? transferWeight : 0);
            
            const alt = distances[minNode] + weight;
            
            if (alt < distances[neighborName]) {
                distances[neighborName] = alt;
                previous[neighborName] = minNode;
                nodesUsed[neighborName] = neighbor.lineKey;
                pQueue.add(neighborName);
            }
        }
    }

    if (distances[to] === Infinity) return null;

    // Reconstruct path name sequence
    const nameSequence = [];
    let curr = to;
    while (curr) {
        nameSequence.unshift(curr);
        curr = previous[curr];
    }

    return reconstructPath(nameSequence);
}

/**
 * Reconstruct full path with line info from station name sequence
 */
function reconstructPath(nameSequence) {
    if (nameSequence.length < 2) return null;

    const path = [];
    let transfers = 0;
    let currentLineKey = null;

    for (let i = 0; i < nameSequence.length; i++) {
        const name = nameSequence[i];
        const lines = findStationOnLines(name);
        if (lines.length === 0) continue;

        // Determine which line to use based on next/prev station
        let bestLine = lines[0];

        if (i < nameSequence.length - 1) {
            const nextName = nameSequence[i + 1];
            // Find a line that contains both current and next station
            for (const line of lines) {
                const lineStations = line.lineData.stations.map(s => s.name.toLowerCase());
                if (lineStations.includes(nextName)) {
                    bestLine = line;
                    break;
                }
            }
        } else if (i > 0 && path.length > 0) {
            // For last station, use same line as previous
            bestLine = lines.find(l => l.lineKey === path[path.length - 1].lineKey) || lines[0];
        }

        if (currentLineKey && currentLineKey !== bestLine.lineKey) {
            transfers++;
        }
        currentLineKey = bestLine.lineKey;

        const station = bestLine.lineData.stations[bestLine.stationIndex];
        path.push({
            name: station.name,
            coords: station.coords,
            lineKey: bestLine.lineKey,
            lineName: bestLine.lineData.name,
            lineColor: bestLine.lineData.color,
            isTransfer: i > 0 && path.length > 0 && path[path.length - 1]?.lineKey !== bestLine.lineKey
        });
    }

    // Estimate time: ~2 min per station + 5 min per transfer
    const estimatedTime = (path.length - 1) * 2 + transfers * 5;

    // Estimate fare: base 10 + 2 per station
    const estimatedFare = 10 + (path.length - 1) * 2;

    // Collect unique lines used
    const linesUsed = [...new Set(path.map(p => p.lineName))];

    return {
        path,
        transfers,
        estimatedTime,
        estimatedFare: Math.min(estimatedFare, 60), // Cap at 60
        linesUsed,
        stationCount: path.length,
        from: path[0],
        to: path[path.length - 1]
    };
}