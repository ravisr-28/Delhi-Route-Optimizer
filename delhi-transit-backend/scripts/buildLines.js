const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(process.cwd(), "data");

const stations = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "metroStations.json")));
const graph = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "metroGraph.json")));

const visited = new Set();
const lines = [];
let lineIndex = 1;

function randomColor() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
}

for (const start in graph) {
  if (visited.has(start)) continue;

  let current = start;
  const linePath = [];

  while (current && !visited.has(current)) {
    visited.add(current);
    linePath.push(current);

    const neighbors = graph[current] || [];
    const next = neighbors.find(n => !visited.has(n.to));
    current = next ? next.to : null;
  }

  if (linePath.length > 1) {
    lines.push({
      id: `line_${lineIndex}`,
      name: `Metro Line ${lineIndex}`,
      color: randomColor(),
      stations: linePath
    });
    lineIndex++;
  }
}

fs.writeFileSync(
  path.join(DATA_DIR, "metroLines.json"),
  JSON.stringify(lines, null, 2)
);

console.log("✅ metroLines.json generated");
