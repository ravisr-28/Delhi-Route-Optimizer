// services/routeFinder.js
import Station from '../models/Station.js';
import Route from '../models/Route.js';

class RouteFinder {
  constructor() {
    this.WALKING_SPEED = 5; // km/h
    this.MAX_WALKING_DISTANCE = 1000; // meters
  }

  /**
   * Main function to find optimal routes between source and destination
   */
  async findRoutes(sourceCoords, destCoords, preferences = {}) {
    try {
      // Validate coordinates
      this.validateCoordinates(sourceCoords);
      this.validateCoordinates(destCoords);

      // 1. Find nearby stations to source and destination
      const nearbySource = await this.findNearbyStations(sourceCoords);
      const nearbyDest = await this.findNearbyStations(destCoords);

      if (nearbySource.length === 0 || nearbyDest.length === 0) {
        throw new Error('No nearby stations found');
      }

      // 2. Build transit graph
      const graph = await this.buildTransitGraph();

      // 3. Find routes with different optimization criteria
      const fastestRoute = await this.findOptimalRoute(
        graph, nearbySource, nearbyDest, sourceCoords, destCoords, 'time'
      );

      const cheapestRoute = await this.findOptimalRoute(
        graph, nearbySource, nearbyDest, sourceCoords, destCoords, 'fare'
      );

      const balancedRoute = await this.findOptimalRoute(
        graph, nearbySource, nearbyDest, sourceCoords, destCoords, 'balanced'
      );

      return {
        fastest: fastestRoute,
        cheapest: cheapestRoute,
        balanced: balancedRoute
      };
    } catch (error) {
      console.error('Error finding routes:', error.message);
      throw error;
    }
  }

  /**
   * Find nearby stations within max distance
   */
  async findNearbyStations(coords, maxDistance = 5000) {
    return await Station.findNearCoordinates(coords, maxDistance, 5);
  }

  /**
   * Build graph of all transit connections from your Route model
   */
  async buildTransitGraph() {
    const routes = await Route.find({ isActive: true });
    const stations = await Station.find({ isActive: true });
    const graph = new Map();

    const stationById = new Map();
    for (const station of stations) {
      stationById.set(station._id.toString(), station);
    }

    const findClosestStation = (lat, lng, maxDistance = 50) => {
      let closestStation = null;
      let minDistance = maxDistance;

      for (const station of stations) {
        const stationLat = station.location.coordinates[1];
        const stationLng = station.location.coordinates[0];
        const distance = this.calculateDistance([lng, lat], [stationLng, stationLat]);

        if (distance < minDistance) {
          minDistance = distance;
          closestStation = station;
        }
      }

      return closestStation;
    };

    for (const route of routes) {
      for (let i = 0; i < route.stops.length - 1; i++) {
        const currentStop = route.stops[i];
        const nextStop = route.stops[i + 1];

        const fromStation = findClosestStation(
          currentStop.coordinates.lat, currentStop.coordinates.lng
        );
        const toStation = findClosestStation(
          nextStop.coordinates.lat, nextStop.coordinates.lng
        );

        if (!fromStation || !toStation) continue;

        const fromId = fromStation._id.toString();
        const toId = toStation._id.toString();

        const fromCoords = [currentStop.coordinates.lng, currentStop.coordinates.lat];
        const toCoords = [nextStop.coordinates.lng, nextStop.coordinates.lat];

        const weight = this.calculateEdgeWeight(route, fromCoords, toCoords);

        if (!graph.has(fromId)) graph.set(fromId, []);
        if (!graph.has(toId)) graph.set(toId, []);

        // Forward edge
        graph.get(fromId).push({
          to: toId, route, weight, distance: weight.distance,
          time: weight.time, fare: weight.fare,
          fromStop: currentStop, toStop: nextStop
        });

        // Backward edge
        graph.get(toId).push({
          to: fromId, route, weight, distance: weight.distance,
          time: weight.time, fare: weight.fare,
          fromStop: nextStop, toStop: currentStop
        });
      }
    }

    return graph;
  }

  calculateEdgeWeight(route, fromCoords, toCoords) {
    const distance = this.calculateDistance(fromCoords, toCoords);
    let time, fare;

    if (route.type === 'metro') {
      time = (distance / 40) * 60;
      fare = Math.min(route.fare.min + (distance / 1000) * 2, route.fare.max);
    } else {
      time = (distance / 25) * 60;
      fare = Math.min(route.fare.min + (distance / 1000) * 1.5, route.fare.max);
    }

    return { time, fare, distance };
  }

  async findOptimalRoute(graph, sourceStations, destStations, sourceCoords, destCoords, criterion) {
    let bestRoute = null;
    let bestCost = Infinity;

    for (const sourceStation of sourceStations) {
      for (const destStation of destStations) {
        const route = this.dijkstra(
          graph, sourceStation._id.toString(), destStation._id.toString(), criterion
        );

        if (!route) continue;

        const walkToSource = this.calculateWalkingSegment(
          sourceCoords,
          [sourceStation.location.coordinates[0], sourceStation.location.coordinates[1]]
        );
        const walkFromDest = this.calculateWalkingSegment(
          [destStation.location.coordinates[0], destStation.location.coordinates[1]],
          destCoords
        );

        const totalRoute = {
          ...route,
          walkToSource, walkFromDest,
          sourceStation: { name: sourceStation.name, coordinates: sourceStation.location.coordinates },
          destStation: { name: destStation.name, coordinates: destStation.location.coordinates },
          totalTime: route.totalTime + walkToSource.time + walkFromDest.time,
          totalFare: route.totalFare,
          totalDistance: route.totalDistance + walkToSource.distance + walkFromDest.distance
        };

        const cost = this.calculateRouteCost(totalRoute, criterion);
        if (cost < bestCost) {
          bestCost = cost;
          bestRoute = totalRoute;
        }
      }
    }

    return bestRoute;
  }

  dijkstra(graph, startId, endId, criterion) {
    if (!graph.has(startId) || !graph.has(endId)) return null;

    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set(graph.keys());
    const routeInfo = new Map();

    for (const node of graph.keys()) {
      distances.set(node, Infinity);
      routeInfo.set(node, { time: 0, fare: 0, distance: 0, segments: [], routes: [] });
    }
    distances.set(startId, 0);

    while (unvisited.size > 0) {
      let currentNode = null;
      let minDistance = Infinity;

      for (const node of unvisited) {
        if (distances.get(node) < minDistance) {
          minDistance = distances.get(node);
          currentNode = node;
        }
      }

      if (currentNode === null || minDistance === Infinity) break;
      if (currentNode === endId) break;

      unvisited.delete(currentNode);

      const neighbors = graph.get(currentNode) || [];
      for (const neighbor of neighbors) {
        if (!unvisited.has(neighbor.to)) continue;

        const weight = this.getWeightByCriterion(neighbor, criterion);
        const alt = distances.get(currentNode) + weight;

        if (alt < distances.get(neighbor.to)) {
          distances.set(neighbor.to, alt);
          previous.set(neighbor.to, { node: currentNode, edge: neighbor });

          const currentInfo = routeInfo.get(currentNode);
          routeInfo.set(neighbor.to, {
            time: currentInfo.time + neighbor.time,
            fare: currentInfo.fare + neighbor.fare,
            distance: currentInfo.distance + neighbor.distance,
            segments: [...currentInfo.segments, neighbor],
            routes: [...currentInfo.routes, {
              routeNumber: neighbor.route.routeNumber,
              name: neighbor.route.name,
              type: neighbor.route.type,
              from: neighbor.fromStop.name,
              to: neighbor.toStop.name
            }]
          });
        }
      }
    }

    if (!previous.has(endId)) return null;

    const path = [];
    let current = endId;
    while (previous.has(current)) {
      const prev = previous.get(current);
      path.unshift(prev.edge);
      current = prev.node;
    }

    const info = routeInfo.get(endId);
    return {
      path,
      totalTime: Math.round(info.time),
      totalFare: Math.round(info.fare),
      totalDistance: Math.round(info.distance),
      segments: info.segments,
      routes: info.routes
    };
  }

  getWeightByCriterion(edge, criterion) {
    switch (criterion) {
      case 'time':
        return edge.time + (edge.route.type === 'bus' ? edge.time * 0.2 : 0);
      case 'fare':
        return edge.fare;
      case 'balanced':
        return (edge.time / 60) * 0.6 + edge.fare * 0.4;
      default:
        return edge.time;
    }
  }

  calculateRouteCost(route, criterion) {
    switch (criterion) {
      case 'time': return route.totalTime;
      case 'fare': return route.totalFare;
      case 'balanced': return (route.totalTime / 60) * 0.5 + route.totalFare * 0.5;
      default: return route.totalTime;
    }
  }

  calculateWalkingSegment(fromCoords, toCoords) {
    const distance = this.calculateDistance(fromCoords, toCoords);
    const time = (distance / 1000 / this.WALKING_SPEED) * 60;
    return { type: 'walk', distance: Math.round(distance), time: Math.round(time), from: fromCoords, to: toCoords };
  }

  calculateDistance(coords1, coords2) {
    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;

    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  validateCoordinates(coords) {
    if (!Array.isArray(coords) || coords.length !== 2) {
      throw new Error('Coordinates must be an array of [longitude, latitude]');
    }
    const [lng, lat] = coords;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      throw new Error('Invalid coordinate values');
    }
  }
}

export default RouteFinder;