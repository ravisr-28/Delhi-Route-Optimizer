const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const GTFS_PATH = path.join(__dirname, "../gtfs/delhi-metro");

const OUTPUT_PATH = "./data";

if (!fs.existsSync(OUTPUT_PATH)) {
  fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}

function loadCSV(file) {
  return new Promise((resolve) => {
    const results = [];
    fs.createReadStream(path.join(GTFS_PATH, file))
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results));
  });
}

async function parse() {
  console.log("🚇 Parsing Delhi Metro GTFS...");

  const stops = await loadCSV("stops.txt");
  const routes = await loadCSV("routes.txt");
  const trips = await loadCSV("trips.txt");
  const stopTimes = await loadCSV("stop_times.txt");

  // Stations
  const stations = stops.map(s => ({
    id: s.stop_id,
    name: s.stop_name,
    lat: parseFloat(s.stop_lat),
    lon: parseFloat(s.stop_lon),
  }));

  // Lines
  const lines = routes.map(r => ({
    id: r.route_id,
    name: r.route_long_name || r.route_short_name,
    color: r.route_color || "000000",
  }));

  // Build graph
  const graph = {};

  stopTimes.forEach(st => {
    if (!graph[st.stop_id]) graph[st.stop_id] = [];
  });

  // Link consecutive stops in same trip
  const tripGroups = {};
  stopTimes.forEach(st => {
    if (!tripGroups[st.trip_id]) tripGroups[st.trip_id] = [];
    tripGroups[st.trip_id].push(st);
  });

  for (const tripId in tripGroups) {
    const seq = tripGroups[tripId].sort((a, b) => a.stop_sequence - b.stop_sequence);
    for (let i = 0; i < seq.length - 1; i++) {
      graph[seq[i].stop_id].push({
        to: seq[i + 1].stop_id,
        weight: 1
      });
    }
  }

  fs.writeFileSync(`${OUTPUT_PATH}/metroStations.json`, JSON.stringify(stations, null, 2));
  fs.writeFileSync(`${OUTPUT_PATH}/metroLines.json`, JSON.stringify(lines, null, 2));
  fs.writeFileSync(`${OUTPUT_PATH}/metroGraph.json`, JSON.stringify(graph, null, 2));

  console.log("✅ Metro data generated:");
  console.log("   metroStations.json");
  console.log("   metroLines.json");
  console.log("   metroGraph.json");
}

parse();
