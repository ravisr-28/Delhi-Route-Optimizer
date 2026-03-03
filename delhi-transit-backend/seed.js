const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Route = require('./models/Route');
const { connectDatabase } = require('./config/database');

dotenv.config();

const sampleRoutes = [
  {
    routeNumber: 'RED',
    name: 'Rithala - Shaheed Sthal (New Bus Adda)',
    type: 'metro',
    line: 'Red Line',
    color: '#FF0000',
    origin: 'Rithala',
    destination: 'Shaheed Sthal',
    stops: [
      { name: 'Rithala', coordinates: { lat: 28.7233, lng: 77.1011 }, sequence: 1 },
      { name: 'Rohini Sector 18-19', coordinates: { lat: 28.7045, lng: 77.1184 }, sequence: 2 },
      { name: 'Haiderpur Badli Mor', coordinates: { lat: 28.7276, lng: 77.1497 }, sequence: 3 },
      { name: 'Jahangirpuri', coordinates: { lat: 28.7291, lng: 77.1639 }, sequence: 4 },
      { name: 'Kashmere Gate', coordinates: { lat: 28.6672, lng: 77.2270 }, sequence: 5 },
      { name: 'Chandni Chowk', coordinates: { lat: 28.6580, lng: 77.2304 }, sequence: 6 },
      { name: 'New Delhi', coordinates: { lat: 28.6431, lng: 77.2197 }, sequence: 7 },
      { name: 'Rajiv Chowk', coordinates: { lat: 28.6328, lng: 77.2197 }, sequence: 8 },
      { name: 'Welcome', coordinates: { lat: 28.6710, lng: 77.2766 }, sequence: 9 },
      { name: 'Dilshad Garden', coordinates: { lat: 28.6817, lng: 77.3187 }, sequence: 10 }
    ],
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.1011, 28.7233], [77.1184, 28.7045], [77.1497, 28.7276],
        [77.1639, 28.7291], [77.2270, 28.6672], [77.2304, 28.6580],
        [77.2197, 28.6431], [77.2197, 28.6328], [77.2766, 28.6710],
        [77.3187, 28.6817]
      ]
    },
    operatingHours: { start: '06:00', end: '23:00' },
    frequency: 5,
    fare: { min: 10, max: 60 },
    isActive: true
  },
  {
    routeNumber: 'BLUE',
    name: 'Dwarka Sector 21 - Noida Electronic City',
    type: 'metro',
    line: 'Blue Line',
    color: '#0000FF',
    origin: 'Dwarka Sector 21',
    destination: 'Noida Electronic City',
    stops: [
      { name: 'Dwarka Sector 21', coordinates: { lat: 28.5529, lng: 77.0583 }, sequence: 1 },
      { name: 'Dwarka Sector 8', coordinates: { lat: 28.5710, lng: 77.0726 }, sequence: 2 },
      { name: 'Rajouri Garden', coordinates: { lat: 28.6410, lng: 77.1208 }, sequence: 3 },
      { name: 'Karol Bagh', coordinates: { lat: 28.6514, lng: 77.1906 }, sequence: 4 },
      { name: 'Rajiv Chowk', coordinates: { lat: 28.6328, lng: 77.2197 }, sequence: 5 },
      { name: 'Mandi House', coordinates: { lat: 28.6265, lng: 77.2343 }, sequence: 6 },
      { name: 'Yamuna Bank', coordinates: { lat: 28.6402, lng: 77.2823 }, sequence: 7 },
      { name: 'Noida City Centre', coordinates: { lat: 28.5747, lng: 77.3560 }, sequence: 8 },
      { name: 'Noida Electronic City', coordinates: { lat: 28.5709, lng: 77.3655 }, sequence: 9 }
    ],
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.0583, 28.5529], [77.0726, 28.5710], [77.1208, 28.6410],
        [77.1906, 28.6514], [77.2197, 28.6328], [77.2343, 28.6265],
        [77.2823, 28.6402], [77.3560, 28.5747], [77.3655, 28.5709]
      ]
    },
    operatingHours: { start: '06:00', end: '23:00' },
    frequency: 4,
    fare: { min: 10, max: 60 },
    isActive: true
  },
  {
    routeNumber: 'YELLOW',
    name: 'Samaypur Badli - HUDA City Centre',
    type: 'metro',
    line: 'Yellow Line',
    color: '#FFFF00',
    origin: 'Samaypur Badli',
    destination: 'HUDA City Centre',
    stops: [
      { name: 'Samaypur Badli', coordinates: { lat: 28.7986, lng: 77.1430 }, sequence: 1 },
      { name: 'Vishwavidyalaya', coordinates: { lat: 28.6953, lng: 77.2105 }, sequence: 2 },
      { name: 'Kashmere Gate', coordinates: { lat: 28.6672, lng: 77.2270 }, sequence: 3 },
      { name: 'Central Secretariat', coordinates: { lat: 28.6143, lng: 77.2111 }, sequence: 4 },
      { name: 'Hauz Khas', coordinates: { lat: 28.5494, lng: 77.2062 }, sequence: 5 },
      { name: 'Chhatarpur', coordinates: { lat: 28.5065, lng: 77.1749 }, sequence: 6 },
      { name: 'HUDA City Centre', coordinates: { lat: 28.4595, lng: 77.0726 }, sequence: 7 }
    ],
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.1430, 28.7986], [77.2105, 28.6953], [77.2270, 28.6672],
        [77.2111, 28.6143], [77.2062, 28.5494], [77.1749, 28.5065],
        [77.0726, 28.4595]
      ]
    },
    operatingHours: { start: '06:00', end: '23:00' },
    frequency: 6,
    fare: { min: 10, max: 60 },
    isActive: true
  },
  {
    routeNumber: '543',
    name: 'ISBT Kashmere Gate - Rohini Sector 24',
    type: 'bus',
    color: '#32CD32',
    origin: 'ISBT Kashmere Gate',
    destination: 'Rohini Sector 24',
    stops: [
      { name: 'ISBT Kashmere Gate', coordinates: { lat: 28.6677, lng: 77.2281 }, sequence: 1 },
      { name: 'Tis Hazari Court', coordinates: { lat: 28.6733, lng: 77.2161 }, sequence: 2 },
      { name: 'Azadpur', coordinates: { lat: 28.7041, lng: 77.1753 }, sequence: 3 },
      { name: 'Rohini Sector 24', coordinates: { lat: 28.7412, lng: 77.1110 }, sequence: 4 }
    ],
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.2281, 28.6677], [77.2161, 28.6733],
        [77.1753, 28.7041], [77.1110, 28.7412]
      ]
    },
    operatingHours: { start: '05:30', end: '23:30' },
    frequency: 15,
    fare: { min: 5, max: 25 },
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    await connectDatabase();
    
    console.log('🗑️  Clearing existing routes...');
    await Route.deleteMany({});
    
    console.log('📦 Seeding database with sample routes...');
    await Route.insertMany(sampleRoutes);
    
    console.log('✅ Database seeded successfully!');
    console.log(`📊 Added ${sampleRoutes.length} routes`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();