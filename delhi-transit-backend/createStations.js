// createStations.js - Run this once to create stations from your routes
const mongoose = require('mongoose');
const Route = require('./models/Route');
const Station = require('./models/Station');
const { connectDatabase } = require('./config/database');

const createStationsFromRoutes = async () => {
  try {
    await connectDatabase();
    console.log('✅ Connected to database');

    // Get all routes
    const routes = await Route.find();
    console.log(`📍 Found ${routes.length} routes`);

    if (routes.length === 0) {
      console.log('⚠️  No routes found! Please run: node seed.js first');
      process.exit(1);
    }

    // Clear existing stations
    await Station.deleteMany({});
    console.log('🗑️  Cleared existing stations');

    const stationsMap = new Map();

    // Extract all unique stations from routes
    for (const route of routes) {
      console.log(`\n📦 Processing route: ${route.routeNumber} - ${route.name}`);
      
      for (const stop of route.stops) {
        const key = `${stop.name}-${stop.coordinates.lat}-${stop.coordinates.lng}`;
        
        if (!stationsMap.has(key)) {
          stationsMap.set(key, {
            name: stop.name,
            type: route.type === 'metro' ? 'metro' : 'bus_stop',
            location: {
              type: 'Point',
              coordinates: [stop.coordinates.lng, stop.coordinates.lat] // [lng, lat] order!
            },
            lines: [route.routeNumber],
            facilities: route.type === 'metro' 
              ? ['escalator', 'lift'] 
              : ['shelter', 'seating'],
            isActive: true
          });
        } else {
          // Add this route to the station's lines
          const station = stationsMap.get(key);
          if (!station.lines.includes(route.routeNumber)) {
            station.lines.push(route.routeNumber);
          }
        }
      }
    }

    // Convert map to array
    const stationsToCreate = Array.from(stationsMap.values());
    
    console.log(`\n🏗️  Creating ${stationsToCreate.length} unique stations...`);

    // Create all stations
    const createdStations = await Station.insertMany(stationsToCreate);
    
    console.log('\n✅ Stations created successfully!');
    console.log('━'.repeat(50));
    console.log(`📊 Total Stations: ${createdStations.length}`);
    console.log(`📊 Total Routes: ${routes.length}`);
    console.log('━'.repeat(50));

    // Show sample stations
    console.log('\n📍 Sample Stations:');
    createdStations.slice(0, 5).forEach(station => {
      console.log(`  - ${station.name} (${station.type})`);
      console.log(`    Lines: ${station.lines.join(', ')}`);
      console.log(`    Coordinates: [${station.location.coordinates[0]}, ${station.location.coordinates[1]}]`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating stations:', error);
    process.exit(1);
  }
};

createStationsFromRoutes();