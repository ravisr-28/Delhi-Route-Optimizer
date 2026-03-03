import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, ZoomControl, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getStationInfo, markMachineFixed, isMajorStation } from '../utils/stationInfo';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Complete Delhi Metro Lines Configuration
const delhiMetroLines = {
  // Blue Line
  'blue-line': {
    id: 'blue-line',
    name: 'Blue Line',
    color: '#005BA9',
    stations: [
      { name: 'Dwarka Sector 21', coords: [28.5529, 77.0583], code: 'D21' },
      { name: 'Dwarka Sector 8', coords: [28.5631, 77.0648], code: 'D08' },
      { name: 'Dwarka Sector 9', coords: [28.5725, 77.0716], code: 'D09' },
      { name: 'Dwarka Sector 10', coords: [28.5756, 77.0728], code: 'D10' },
      { name: 'Dwarka Sector 11', coords: [28.5818, 77.0500], code: 'D11' },
      { name: 'Dwarka Sector 12', coords: [28.5876, 77.0456], code: 'D12' },
      { name: 'Dwarka Sector 13', coords: [28.5935, 77.0412], code: 'D13' },
      { name: 'Dwarka Sector 14', coords: [28.5973, 77.0390], code: 'D14' },
      { name: 'Dwarka', coords: [28.6130, 77.0320], code: 'DWK' },
      { name: 'Dwarka Mor', coords: [28.6193, 77.0457], code: 'DWM' },
      { name: 'Nawada', coords: [28.6234, 77.0535], code: 'NWD' },
      { name: 'Uttam Nagar West', coords: [28.6273, 77.0617], code: 'UNW' },
      { name: 'Uttam Nagar East', coords: [28.6316, 77.0707], code: 'UNE' },
      { name: 'Janakpuri West', coords: [28.6310, 77.0890], code: 'JPW' },
      { name: 'Janakpuri East', coords: [28.6369, 77.0993], code: 'JPE' },
      { name: 'Tilak Nagar', coords: [28.6407, 77.1075], code: 'TNG' },
      { name: 'Subhash Nagar', coords: [28.6445, 77.1174], code: 'SBN' },
      { name: 'Tagore Garden', coords: [28.6520, 77.1226], code: 'TGR' },
      { name: 'Rajouri Garden', coords: [28.6512, 77.1293], code: 'RJG' },
      { name: 'Ramesh Nagar', coords: [28.6513, 77.1431], code: 'RMN' },
      { name: 'Moti Nagar', coords: [28.6515, 77.1531], code: 'MTN' },
      { name: 'Kirti Nagar', coords: [28.6522, 77.1587], code: 'KRN' },
      { name: 'Shadipur', coords: [28.6515, 77.1638], code: 'SDP' },
      { name: 'Patel Nagar', coords: [28.6561, 77.1703], code: 'PTN' },
      { name: 'Rajendra Place', coords: [28.6435, 77.1781], code: 'RJP' },
      { name: 'Karol Bagh', coords: [28.6514, 77.1906], code: 'KLB' },
      { name: 'Jhandewalan', coords: [28.6496, 77.2037], code: 'JDL' },
      { name: 'RK Ashram Marg', coords: [28.6479, 77.2099], code: 'RKA' },
      { name: 'Rajiv Chowk', coords: [28.6328, 77.2197], code: 'RJC' },
      { name: 'Barakhamba Road', coords: [28.6326, 77.2292], code: 'BRB' },
      { name: 'Mandi House', coords: [28.6265, 77.2343], code: 'MDH' },
      { name: 'Pragati Maidan', coords: [28.6226, 77.2449], code: 'SPC' },
      { name: 'Indraprastha', coords: [28.6366, 77.2527], code: 'IDP' },
      { name: 'Yamuna Bank', coords: [28.6402, 77.2823], code: 'YMB' },
      { name: 'Akshardham', coords: [28.6117, 77.2773], code: 'AKS' },
      { name: 'Mayur Vihar Phase-1', coords: [28.6083, 77.2942], code: 'MVP1' },
      { name: 'Mayur Vihar Ext', coords: [28.6040, 77.3033], code: 'MVE' },
      { name: 'New Ashok Nagar', coords: [28.5919, 77.3107], code: 'NAN' },
      { name: 'Noida Sector 15', coords: [28.5829, 77.3203], code: 'NS15' },
      { name: 'Noida Sector 16', coords: [28.5774, 77.3267], code: 'NS16' },
      { name: 'Noida Sector 18', coords: [28.5703, 77.3273], code: 'NS18' },
      { name: 'Botanical Garden', coords: [28.5644, 77.3340], code: 'BTG' },
      { name: 'Golf Course', coords: [28.5583, 77.3441], code: 'GFC' },
      { name: 'Noida City Center', coords: [28.5747, 77.3560], code: 'NCC' },
      { name: 'Noida Sector 34', coords: [28.5729, 77.3524], code: 'NS34' },
      { name: 'Noida Sector 52', coords: [28.5844, 77.3413], code: 'NS52' },
      { name: 'Noida Sector 61', coords: [28.5956, 77.3586], code: 'NS61' },
      { name: 'Noida Sector 59', coords: [28.6034, 77.3634], code: 'NS59' },
      { name: 'Noida Sector 62', coords: [28.6115, 77.3660], code: 'NS62' },
      { name: 'Noida Electronic City', coords: [28.6161, 77.3711], code: 'NEC' }
    ],
    frequency: '4 mins'
  },

  // Red Line
  'red-line': {
    id: 'red-line',
    name: 'Red Line',
    color: '#FF0000',
    stations: [
      { name: 'Rithala', coords: [28.7209, 77.1070], code: 'RTL' },
      { name: 'Rohini West', coords: [28.7141, 77.1167], code: 'RNW' },
      { name: 'Rohini East', coords: [28.7069, 77.1260], code: 'RNE' },
      { name: 'Pitampura', coords: [28.7013, 77.1316], code: 'PTP' },
      { name: 'Kohat Enclave', coords: [28.6967, 77.1395], code: 'KHE' },
      { name: 'Netaji Subhash Place', coords: [28.6917, 77.1488], code: 'NSP' },
      { name: 'Keshav Puram', coords: [28.6890, 77.1556], code: 'KSP' },
      { name: 'Kanhaiya Nagar', coords: [28.6860, 77.1649], code: 'KHN' },
      { name: 'Inderlok', coords: [28.6730, 77.1689], code: 'IDL' },
      { name: 'Shastri Nagar', coords: [28.6740, 77.1809], code: 'STN' },
      { name: 'Pratap Nagar', coords: [28.6720, 77.1925], code: 'PTN' },
      { name: 'Pul Bangash', coords: [28.6692, 77.2004], code: 'PBG' },
      { name: 'Tis Hazari', coords: [28.6686, 77.2171], code: 'THZ' },
      { name: 'Kashmere Gate', coords: [28.6672, 77.2270], code: 'KSG' },
      { name: 'Shastri Park', coords: [28.6718, 77.2500], code: 'STP' },
      { name: 'Seelampur', coords: [28.6757, 77.2638], code: 'SLP' },
      { name: 'Welcome', coords: [28.6710, 77.2766], code: 'WCM' },
      { name: 'Shahdara', coords: [28.6735, 77.2876], code: 'SHD' },
      { name: 'Mansarovar Park', coords: [28.6760, 77.2976], code: 'MSP' },
      { name: 'Jhilmil', coords: [28.6780, 77.3100], code: 'JHL' },
      { name: 'Dilshad Garden', coords: [28.6817, 77.3187], code: 'DLG' },
      { name: 'Shaheed Nagar', coords: [28.6830, 77.3310], code: 'SHN' },
      { name: 'Raj Bagh', coords: [28.6840, 77.3420], code: 'RJB' },
      { name: 'Major Mohit Sharma', coords: [28.6810, 77.3530], code: 'MMS' },
      { name: 'Shyam Park', coords: [28.6790, 77.3640], code: 'SYP' },
      { name: 'Mohan Nagar', coords: [28.6780, 77.3750], code: 'MHN' },
      { name: 'Arthala', coords: [28.6760, 77.3880], code: 'ART' },
      { name: 'Hindon River', coords: [28.6730, 77.3980], code: 'HNR' },
      { name: 'Shaheed Sthal', coords: [28.6700, 77.4100], code: 'SHS' }
    ],
    frequency: '5 mins'
  },

  // Yellow Line
  'yellow-line': {
    id: 'yellow-line',
    name: 'Yellow Line',
    color: '#FFD700',
    stations: [
      { name: 'Samaypur Badli', coords: [28.7456, 77.1370], code: 'SMP' },
      { name: 'Rohini Sector 18', coords: [28.7389, 77.1413], code: 'RS18' },
      { name: 'Haiderpur Badli Mor', coords: [28.7276, 77.1497], code: 'HBM' },
      { name: 'Jahangirpuri', coords: [28.7291, 77.1639], code: 'JHP' },
      { name: 'Adarsh Nagar', coords: [28.7156, 77.1709], code: 'ADN' },
      { name: 'Azadpur', coords: [28.7064, 77.1789], code: 'AZP' },
      { name: 'Model Town', coords: [28.6991, 77.1891], code: 'MTN' },
      { name: 'Guru Tegh Bahadur Nagar', coords: [28.6981, 77.1965], code: 'GTB' },
      { name: 'Vishwa Vidyalaya', coords: [28.6953, 77.2105], code: 'VV' },
      { name: 'Vidhan Sabha', coords: [28.6891, 77.2165], code: 'VS' },
      { name: 'Civil Lines', coords: [28.6807, 77.2218], code: 'CL' },
      { name: 'Kashmere Gate', coords: [28.6672, 77.2270], code: 'KSG' },
      { name: 'Chandni Chowk', coords: [28.6580, 77.2304], code: 'CC' },
      { name: 'Chawri Bazar', coords: [28.6504, 77.2261], code: 'CHB' },
      { name: 'New Delhi', coords: [28.6431, 77.2197], code: 'ND' },
      { name: 'Rajiv Chowk', coords: [28.6328, 77.2197], code: 'RJC' },
      { name: 'Patel Chowk', coords: [28.6233, 77.2140], code: 'PC' },
      { name: 'Central Secretariat', coords: [28.6143, 77.2111], code: 'CS' },
      { name: 'Udyog Bhawan', coords: [28.6106, 77.2090], code: 'UB' },
      { name: 'Lok Kalyan Marg', coords: [28.6008, 77.2095], code: 'LKM' },
      { name: 'Jor Bagh', coords: [28.5906, 77.2120], code: 'JBG' },
      { name: 'INA', coords: [28.5739, 77.2092], code: 'INA' },
      { name: 'AIIMS', coords: [28.5672, 77.2100], code: 'AIIMS' },
      { name: 'Green Park', coords: [28.5593, 77.2066], code: 'GP' },
      { name: 'Hauz Khas', coords: [28.5494, 77.2062], code: 'HK' },
      { name: 'Malviya Nagar', coords: [28.5416, 77.2060], code: 'MN' },
      { name: 'Saket', coords: [28.5251, 77.2024], code: 'SKT' },
      { name: 'Qutub Minar', coords: [28.5134, 77.1854], code: 'QM' },
      { name: 'Chhatarpur', coords: [28.5065, 77.1749], code: 'CHP' },
      { name: 'Sultanpur', coords: [28.4959, 77.1627], code: 'SLT' },
      { name: 'Ghitorni', coords: [28.4858, 77.1496], code: 'GHT' },
      { name: 'Arjan Garh', coords: [28.4817, 77.1255], code: 'AJG' },
      { name: 'Guru Dronacharya', coords: [28.4821, 77.1032], code: 'GD' },
      { name: 'Sikandarpur', coords: [28.4807, 77.0919], code: 'SKP' },
      { name: 'MG Road', coords: [28.4793, 77.0804], code: 'MGR' },
      { name: 'IFFCO Chowk', coords: [28.4719, 77.0719], code: 'IFF' },
      { name: 'Huda City Centre', coords: [28.4595, 77.0726], code: 'HCC' }
    ],
    frequency: '3 mins'
  },

  // Violet Line
  'violet-line': {
    id: 'violet-line',
    name: 'Violet Line',
    color: '#8A2BE2',
    stations: [
      { name: 'Kashmere Gate', coords: [28.6672, 77.2270], code: 'KSG' },
      { name: 'Lal Qila', coords: [28.6562, 77.2410], code: 'LQ' },
      { name: 'Jama Masjid', coords: [28.6507, 77.2334], code: 'JM' },
      { name: 'Delhi Gate', coords: [28.6395, 77.2412], code: 'DG' },
      { name: 'ITO', coords: [28.6290, 77.2500], code: 'ITO' },
      { name: 'Mandi House', coords: [28.6265, 77.2343], code: 'MDH' },
      { name: 'Janpath', coords: [28.6205, 77.2196], code: 'JPT' },
      { name: 'Central Secretariat', coords: [28.6143, 77.2111], code: 'CS' },
      { name: 'Khan Market', coords: [28.6005, 77.2277], code: 'KM' },
      { name: 'JLN Stadium', coords: [28.5898, 77.2337], code: 'JLN' },
      { name: 'Jangpura', coords: [28.5808, 77.2406], code: 'JGP' },
      { name: 'Lajpat Nagar', coords: [28.5700, 77.2430], code: 'LJN' },
      { name: 'Moolchand', coords: [28.5670, 77.2400], code: 'MCH' },
      { name: 'Kailash Colony', coords: [28.5578, 77.2431], code: 'KC' },
      { name: 'Nehru Place', coords: [28.5490, 77.2530], code: 'NP' },
      { name: 'Kalkaji Mandir', coords: [28.5367, 77.2586], code: 'KJM' },
      { name: 'Govind Puri', coords: [28.5380, 77.2640], code: 'GP' },
      { name: 'Harkesh Nagar Okhla', coords: [28.5290, 77.2746], code: 'HNO' },
      { name: 'Jasola Apollo', coords: [28.5380, 77.2840], code: 'JA' },
      { name: 'Sarita Vihar', coords: [28.5290, 77.2940], code: 'SV' },
      { name: 'Mohan Estate', coords: [28.5190, 77.3010], code: 'ME' },
      { name: 'Tughlakabad', coords: [28.5110, 77.2920], code: 'TGD' },
      { name: 'Badarpur', coords: [28.5020, 77.3030], code: 'BDP' },
      { name: 'Sarai', coords: [28.4930, 77.3100], code: 'SRI' },
      { name: 'NHPC Chowk', coords: [28.4840, 77.3130], code: 'NHPC' },
      { name: 'Mewala Maharajpur', coords: [28.4750, 77.3170], code: 'MM' },
      { name: 'Sector-28', coords: [28.4660, 77.3170], code: 'S28' },
      { name: 'Badkal Mor', coords: [28.4530, 77.3150], code: 'BM' },
      { name: 'Old Faridabad', coords: [28.4380, 77.3100], code: 'OF' },
      { name: 'Neelam Chowk Ajronda', coords: [28.4250, 77.3100], code: 'NCA' },
      { name: 'Bata Chowk', coords: [28.4130, 77.3100], code: 'BTC' },
      { name: 'Escorts Mujesar', coords: [28.4010, 77.3100], code: 'EM' },
      { name: 'Sant Surdas - Sihi', coords: [28.3870, 77.3050], code: 'SSS' },
      { name: 'Raja Nahar Singh', coords: [28.3698, 77.3150], code: 'RNS' }
    ],
    frequency: '5 mins'
  },

  // Pink Line
  'pink-line': {
    id: 'pink-line',
    name: 'Pink Line',
    color: '#FF69B4',
    stations: [
      { name: 'Majlis Park', coords: [28.7075, 77.1904], code: 'MJP' },
      { name: 'Azadpur', coords: [28.7064, 77.1789], code: 'AZP' },
      { name: 'Shalimar Bagh', coords: [28.7200, 77.1850], code: 'SHB' },
      { name: 'Netaji Subhash Place', coords: [28.6917, 77.1488], code: 'NSP' },
      { name: 'Shakurpur', coords: [28.6870, 77.1500], code: 'SKP' },
      { name: 'Punjabi Bagh West', coords: [28.6770, 77.1430], code: 'PBW' },
      { name: 'ESI Hospital', coords: [28.6650, 77.1380], code: 'ESI' },
      { name: 'Rajouri Garden', coords: [28.6512, 77.1293], code: 'RJG' },
      { name: 'Mayapuri', coords: [28.6370, 77.1220], code: 'MYP' },
      { name: 'Naraina Vihar', coords: [28.6300, 77.1350], code: 'NV' },
      { name: 'Delhi Cantonment', coords: [28.6150, 77.1400], code: 'DC' },
      { name: 'Durgabai Deshmukh South Campus', coords: [28.6050, 77.1530], code: 'DDSC' },
      { name: 'Sir Vishweshwaraiah Moti Bagh', coords: [28.5912, 77.1700], code: 'SVMB' },
      { name: 'Bhikaji Cama Place', coords: [28.5812, 77.1810], code: 'BCP' },
      { name: 'Sarojini Nagar', coords: [28.5712, 77.1993], code: 'SN' },
      { name: 'INA', coords: [28.5739, 77.2092], code: 'INA' },
      { name: 'South Extension', coords: [28.5720, 77.2220], code: 'SE' },
      { name: 'Lajpat Nagar', coords: [28.5700, 77.2430], code: 'LJN' },
      { name: 'Vinobapuri', coords: [28.5670, 77.2530], code: 'VBP' },
      { name: 'Ashram', coords: [28.5710, 77.2590], code: 'ASH' },
      { name: 'Sarai Kale Khan - Nizamuddin', coords: [28.5880, 77.2590], code: 'SKN' },
      { name: 'Mayur Vihar-I', coords: [28.6083, 77.2942], code: 'MVP1' },
      { name: 'Mayur Vihar Pocket-1', coords: [28.6090, 77.3020], code: 'MVP' },
      { name: 'Trilokpuri-Sanjay Lake', coords: [28.6130, 77.3090], code: 'TSL' },
      { name: 'Vinod Nagar East', coords: [28.6200, 77.3130], code: 'VNE' },
      { name: 'Vinod Nagar West', coords: [28.6260, 77.3120], code: 'VNW' },
      { name: 'IP Extension', coords: [28.6340, 77.3100], code: 'IPE' },
      { name: 'Anand Vihar', coords: [28.6467, 77.3160], code: 'AV' },
      { name: 'Karkarduma', coords: [28.6530, 77.3050], code: 'KDM' },
      { name: 'Karkarduma Court', coords: [28.6570, 77.3010], code: 'KDC' },
      { name: 'Krishna Nagar', coords: [28.6590, 77.2900], code: 'KN' },
      { name: 'East Azad Nagar', coords: [28.6620, 77.2830], code: 'EAZ' },
      { name: 'Welcome', coords: [28.6710, 77.2766], code: 'WCM' },
      { name: 'Jaffrabad', coords: [28.6790, 77.2820], code: 'JFD' },
      { name: 'Maujpur - Babarpur', coords: [28.6890, 77.2790], code: 'MBP' },
      { name: 'Gokulpuri', coords: [28.6960, 77.2750], code: 'GKP' },
      { name: 'Johri Enclave', coords: [28.7020, 77.2700], code: 'JE' },
      { name: 'Shiv Vihar', coords: [28.7110, 77.2660], code: 'SVH' }
    ],
    frequency: '4 mins'
  },

  // Magenta Line
  'magenta-line': {
    id: 'magenta-line',
    name: 'Magenta Line',
    color: '#FF00FF',
    stations: [
      { name: 'Janakpuri West', coords: [28.6310, 77.0890], code: 'JPW' },
      { name: 'Dabri Mor', coords: [28.6230, 77.0820], code: 'DM' },
      { name: 'Dashrath Puri', coords: [28.6160, 77.0760], code: 'DP' },
      { name: 'Palam', coords: [28.5990, 77.0880], code: 'PAL' },
      { name: 'Sadar Bazaar Cantonment', coords: [28.5880, 77.1040], code: 'SBC' },
      { name: 'Terminal 1-IGI Airport', coords: [28.5730, 77.1150], code: 'T1' },
      { name: 'Shankar Vihar', coords: [28.5620, 77.1340], code: 'SKV' },
      { name: 'Vasant Vihar', coords: [28.5570, 77.1530], code: 'VV' },
      { name: 'Munirka', coords: [28.5510, 77.1690], code: 'MUN' },
      { name: 'RK Puram', coords: [28.5620, 77.1790], code: 'RKP' },
      { name: 'IIT Delhi', coords: [28.5467, 77.1904], code: 'IIT' },
      { name: 'Hauz Khas', coords: [28.5494, 77.2062], code: 'HK' },
      { name: 'Panchsheel Park', coords: [28.5420, 77.2140], code: 'PSP' },
      { name: 'Chirag Delhi', coords: [28.5350, 77.2210], code: 'CD' },
      { name: 'Greater Kailash', coords: [28.5310, 77.2340], code: 'GK' },
      { name: 'Nehru Enclave', coords: [28.5370, 77.2450], code: 'NE' },
      { name: 'Kalkaji Mandir', coords: [28.5367, 77.2586], code: 'KJM' },
      { name: 'Okhla NSIC', coords: [28.5310, 77.2680], code: 'ONS' },
      { name: 'Sukhdev Vihar', coords: [28.5230, 77.2780], code: 'SKV' },
      { name: 'Jamia Millia Islamia', coords: [28.5250, 77.2800], code: 'JMI' },
      { name: 'Okhla Vihar', coords: [28.5280, 77.2900], code: 'OV' },
      { name: 'Jasola Vihar Shaheen Bagh', coords: [28.5380, 77.2980], code: 'JVS' },
      { name: 'Kalindi Kunj', coords: [28.5470, 77.3100], code: 'KK' },
      { name: 'Okhla Bird Sanctuary', coords: [28.5540, 77.3230], code: 'OBS' },
      { name: 'Botanical Garden', coords: [28.5644, 77.3340], code: 'BTG' }
    ],
    frequency: '4 mins'
  },

  // Orange Line (Airport Express)
  'orange-line': {
    id: 'orange-line',
    name: 'Airport Express',
    color: '#FFA500',
    stations: [
      { name: 'New Delhi', coords: [28.6431, 77.2197], code: 'ND' },
      { name: 'Shivaji Stadium', coords: [28.6265, 77.2131], code: 'SS' },
      { name: 'Dhaula Kuan', coords: [28.5920, 77.1670], code: 'DK' },
      { name: 'Delhi Aerocity', coords: [28.5561, 77.1204], code: 'DAC' },
      { name: 'IGI Airport', coords: [28.5566, 77.0881], code: 'IGI' },
      { name: 'Dwarka Sector 21', coords: [28.5529, 77.0583], code: 'D21' }
    ],
    frequency: '10 mins'
  },

  // Green Line
  'green-line': {
    id: 'green-line',
    name: 'Green Line',
    color: '#008000',
    stations: [
      { name: 'Inderlok', coords: [28.6730, 77.1689], code: 'IDL' },
      { name: 'Ashok Park Main', coords: [28.6694, 77.1587], code: 'APM' },
      { name: 'Punjabi Bagh', coords: [28.6710, 77.1430], code: 'PB' },
      { name: 'Shivaji Park', coords: [28.6742, 77.1340], code: 'SHP' },
      { name: 'Madipur', coords: [28.6780, 77.1260], code: 'MDP' },
      { name: 'Paschim Vihar East', coords: [28.6820, 77.1170], code: 'PVE' },
      { name: 'Paschim Vihar West', coords: [28.6850, 77.1050], code: 'PVW' },
      { name: 'Peera Garhi', coords: [28.6880, 77.0930], code: 'PG' },
      { name: 'Udyog Nagar', coords: [28.6910, 77.0850], code: 'UN' },
      { name: 'Surajmal Stadium', coords: [28.6930, 77.0770], code: 'SMS' },
      { name: 'Nangloi', coords: [28.6860, 77.0660], code: 'NGL' },
      { name: 'Nangloi Railway Station', coords: [28.6810, 77.0560], code: 'NRS' },
      { name: 'Rajdhani Park', coords: [28.6770, 77.0440], code: 'RDP' },
      { name: 'Mundka', coords: [28.6850, 77.0310], code: 'MUK' },
      { name: 'Mundka Industrial Area', coords: [28.6900, 77.0190], code: 'MIA' },
      { name: 'Ghevra', coords: [28.6950, 77.0060], code: 'GVR' },
      { name: 'Tikri Kalan', coords: [28.6970, 76.9920], code: 'TK' },
      { name: 'Tikri Border', coords: [28.6990, 76.9810], code: 'TB' },
      { name: 'Pandit Shree Ram Sharma', coords: [28.6960, 76.9680], code: 'PSRS' },
      { name: 'Bahadurgarh City', coords: [28.6920, 76.9380], code: 'BHC' },
      { name: 'Brigadier Hoshiar Singh', coords: [28.6900, 76.9220], code: 'BHS' }
    ],
    frequency: '8 mins'
  },

  // Grey Line
  'grey-line': {
    id: 'grey-line',
    name: 'Grey Line',
    color: '#808080',
    stations: [
      { name: 'Dwarka', coords: [28.6130, 77.0320], code: 'DWK' },
      { name: 'Nangli', coords: [28.6050, 77.0180], code: 'NGL' },
      { name: 'Najafgarh', coords: [28.6090, 76.9900], code: 'NJF' },
      { name: 'Dhansa Bus Stand', coords: [28.6120, 76.9730], code: 'DBS' }
    ],
    frequency: '10 mins'
  },

  // Rapid Metro (Gurugram)
  'rapid-metro': {
    id: 'rapid-metro',
    name: 'Rapid Metro',
    color: '#00BFFF',
    stations: [
      { name: 'Sector 55-56', coords: [28.4436, 77.0638], code: 'S55' },
      { name: 'Sector 54 Chowk', coords: [28.4480, 77.0694], code: 'S54' },
      { name: 'Sector 53-54', coords: [28.4505, 77.0740], code: 'S53' },
      { name: 'Sector 42-43', coords: [28.4580, 77.0790], code: 'S42' },
      { name: 'Phase 1', coords: [28.4660, 77.0820], code: 'P1' },
      { name: 'Sikandarpur', coords: [28.4807, 77.0919], code: 'SKP' },
      { name: 'Phase 2', coords: [28.4720, 77.0780], code: 'P2' },
      { name: 'Belvedere Towers', coords: [28.4770, 77.0680], code: 'BT' },
      { name: 'Cyber City', coords: [28.4940, 77.0860], code: 'CC' },
      { name: 'Moulsari Avenue', coords: [28.4980, 77.0920], code: 'MA' },
      { name: 'Phase 3', coords: [28.4880, 77.0970], code: 'P3' }
    ],
    frequency: '4 mins'
  },

  // Blue Line Branch (Vaishali)
  'blue-branch': {
    id: 'blue-branch',
    name: 'Blue Line (Vaishali)',
    color: '#005BA9',
    stations: [
      { name: 'Yamuna Bank', coords: [28.6402, 77.2823], code: 'YMB' },
      { name: 'Laxmi Nagar', coords: [28.6316, 77.2770], code: 'LXN' },
      { name: 'Nirman Vihar', coords: [28.6350, 77.2860], code: 'NMV' },
      { name: 'Preet Vihar', coords: [28.6410, 77.2940], code: 'PRV' },
      { name: 'Karkardooma', coords: [28.6530, 77.3050], code: 'KRD' },
      { name: 'Anand Vihar ISBT', coords: [28.6467, 77.3160], code: 'AVI' },
      { name: 'Kaushambi', coords: [28.6460, 77.3300], code: 'KSH' },
      { name: 'Vaishali', coords: [28.6450, 77.3410], code: 'VSL' }
    ],
    frequency: '4 mins'
  },

  // Bus Routes
  'bus-route-24': {
    id: 'bus-route-24',
    name: 'Bus Route 24',
    color: '#6B8E23',
    stations: [
      { name: 'ISBT Kashmere Gate', coords: [28.6687, 77.2277], code: 'ISBT' },
      { name: 'Mori Gate', coords: [28.6780, 77.2200], code: 'MOG' },
      { name: 'Pratap Nagar', coords: [28.6880, 77.2100], code: 'PTN' },
      { name: 'Shalimar Bagh', coords: [28.6980, 77.2000], code: 'SHB' },
      { name: 'Azadpur', coords: [28.7080, 77.1900], code: 'AZP' },
      { name: 'Adarsh Nagar', coords: [28.7180, 77.1800], code: 'ADN' },
      { name: 'Badli Mor', coords: [28.7280, 77.1700], code: 'BDM' },
      { name: 'Bawana', coords: [28.7380, 77.1600], code: 'BWN' },
      { name: 'Narela', coords: [28.7480, 77.1500], code: 'NRL' },
      { name: 'Rohini Sector 24', coords: [28.7580, 77.1400], code: 'RS24' }
    ],
    frequency: '15 mins',
    type: 'bus'
  },

  'bus-route-522': {
    id: 'bus-route-522',
    name: 'Bus Route 522',
    color: '#D2691E',
    stations: [
      { name: 'Ambedkar Nagar', coords: [28.5300, 77.2350], code: 'ABN' },
      { name: 'Khanpur', coords: [28.5200, 77.2300], code: 'KHP' },
      { name: 'Saket', coords: [28.5239, 77.2100], code: 'SKT' },
      { name: 'Malviya Nagar', coords: [28.5339, 77.2060], code: 'MLV' },
      { name: 'Hauz Khas', coords: [28.5494, 77.2062], code: 'HK' },
      { name: 'AIIMS', coords: [28.5670, 77.2100], code: 'AIIMS' },
      { name: 'Safdarjung', coords: [28.5800, 77.2080], code: 'SFJ' },
      { name: 'Dhaula Kuan', coords: [28.5920, 77.1670], code: 'DHK' },
      { name: 'Naraina', coords: [28.6280, 77.1420], code: 'NRN' },
      { name: 'Rajouri Garden', coords: [28.6410, 77.1208], code: 'RJG' }
    ],
    frequency: '12 mins',
    type: 'bus'
  },

  'bus-route-423': {
    id: 'bus-route-423',
    name: 'Bus Route 423',
    color: '#8B4513',
    stations: [
      { name: 'Nehru Place', coords: [28.5490, 77.2530], code: 'NHP' },
      { name: 'Lajpat Nagar', coords: [28.5700, 77.2430], code: 'LJN' },
      { name: 'Defence Colony', coords: [28.5740, 77.2310], code: 'DFC' },
      { name: 'Lodhi Colony', coords: [28.5850, 77.2250], code: 'LDC' },
      { name: 'India Gate', coords: [28.6129, 77.2295], code: 'ING' },
      { name: 'Connaught Place', coords: [28.6315, 77.2167], code: 'CP' },
      { name: 'Karol Bagh', coords: [28.6514, 77.1906], code: 'KLB' },
      { name: 'Patel Nagar', coords: [28.6600, 77.1700], code: 'PTN' },
      { name: 'Rajouri Garden', coords: [28.6410, 77.1208], code: 'RJG' }
    ],
    frequency: '10 mins',
    type: 'bus'
  },

  'bus-route-181': {
    id: 'bus-route-181',
    name: 'Bus Route 181',
    color: '#556B2F',
    stations: [
      { name: 'Badarpur Border', coords: [28.5090, 77.3050], code: 'BDB' },
      { name: 'Sarita Vihar', coords: [28.5290, 77.2940], code: 'SVH' },
      { name: 'Jasola', coords: [28.5410, 77.2830], code: 'JSL' },
      { name: 'Okhla', coords: [28.5530, 77.2720], code: 'OKL' },
      { name: 'Nehru Place', coords: [28.5490, 77.2530], code: 'NHP' },
      { name: 'Moolchand', coords: [28.5670, 77.2400], code: 'MLC' },
      { name: 'AIIMS', coords: [28.5670, 77.2100], code: 'AIIMS' },
      { name: 'INA Market', coords: [28.5750, 77.2070], code: 'INA' },
      { name: 'Dilli Haat', coords: [28.5730, 77.2030], code: 'DH' }
    ],
    frequency: '10 mins',
    type: 'bus'
  },

  'bus-route-347': {
    id: 'bus-route-347',
    name: 'Bus Route 347',
    color: '#2E8B57',
    stations: [
      { name: 'Dwarka Sector 14', coords: [28.5920, 77.0500], code: 'DW14' },
      { name: 'Dwarka Sector 10', coords: [28.5930, 77.0650], code: 'DW10' },
      { name: 'Palam Village', coords: [28.5980, 77.0890], code: 'PLM' },
      { name: 'Mahavir Enclave', coords: [28.6100, 77.1000], code: 'MHE' },
      { name: 'Janakpuri', coords: [28.6200, 77.0810], code: 'JNK' },
      { name: 'Tilak Nagar', coords: [28.6400, 77.0960], code: 'TLN' },
      { name: 'Subhash Nagar', coords: [28.6490, 77.1160], code: 'SBN' },
      { name: 'Rajouri Garden', coords: [28.6410, 77.1208], code: 'RJG' }
    ],
    frequency: '18 mins',
    type: 'bus'
  },

  'bus-route-764': {
    id: 'bus-route-764',
    name: 'Bus Route 764',
    color: '#BDB76B',
    stations: [
      { name: 'Anand Vihar ISBT', coords: [28.6467, 77.3160], code: 'AVI' },
      { name: 'Karkardooma', coords: [28.6530, 77.3050], code: 'KKD' },
      { name: 'Preet Vihar', coords: [28.6430, 77.2920], code: 'PTV' },
      { name: 'Laxmi Nagar', coords: [28.6330, 77.2790], code: 'LXN' },
      { name: 'Akshardham', coords: [28.6220, 77.2770], code: 'AKS' },
      { name: 'ITO', coords: [28.6290, 77.2500], code: 'ITO' },
      { name: 'India Gate', coords: [28.6129, 77.2295], code: 'ING' },
      { name: 'Central Secretariat', coords: [28.6143, 77.2111], code: 'CS' },
      { name: 'Patel Chowk', coords: [28.6230, 77.2090], code: 'PC' },
      { name: 'Connaught Place', coords: [28.6315, 77.2167], code: 'CP' }
    ],
    frequency: '12 mins',
    type: 'bus'
  },

  'bus-route-620': {
    id: 'bus-route-620',
    name: 'Bus Route 620',
    color: '#DAA520',
    stations: [
      { name: 'Mehrauli', coords: [28.5180, 77.1850], code: 'MHR' },
      { name: 'Qutub Minar', coords: [28.5244, 77.1855], code: 'QTB' },
      { name: 'Chhatarpur', coords: [28.5065, 77.1749], code: 'CHP' },
      { name: 'Vasant Kunj', coords: [28.5199, 77.1570], code: 'VKJ' },
      { name: 'Munirka', coords: [28.5510, 77.1690], code: 'MNK' },
      { name: 'RK Puram', coords: [28.5620, 77.1790], code: 'RKP' },
      { name: 'Sarojini Nagar', coords: [28.5712, 77.1993], code: 'SN' },
      { name: 'South Extension', coords: [28.5780, 77.2200], code: 'SE' },
      { name: 'Lajpat Nagar', coords: [28.5700, 77.2430], code: 'LJN' }
    ],
    frequency: '15 mins',
    type: 'bus'
  },

  'bus-route-413': {
    id: 'bus-route-413',
    name: 'Bus Route 413',
    color: '#CD853F',
    stations: [
      { name: 'Old Delhi Railway Station', coords: [28.6614, 77.2310], code: 'ODRS' },
      { name: 'Chandni Chowk', coords: [28.6580, 77.2304], code: 'CC' },
      { name: 'Red Fort', coords: [28.6562, 77.2410], code: 'RF' },
      { name: 'Jama Masjid', coords: [28.6507, 77.2334], code: 'JM' },
      { name: 'Delhi Gate', coords: [28.6390, 77.2420], code: 'DLG' },
      { name: 'ITO', coords: [28.6290, 77.2500], code: 'ITO' },
      { name: 'Pragati Maidan', coords: [28.6260, 77.2480], code: 'PM' },
      { name: 'Nizamuddin', coords: [28.5880, 77.2530], code: 'NZM' },
      { name: 'Ashram Chowk', coords: [28.5710, 77.2590], code: 'ASH' },
      { name: 'Nehru Place', coords: [28.5490, 77.2530], code: 'NHP' }
    ],
    frequency: '10 mins',
    type: 'bus'
  },

  'bus-route-901': {
    id: 'bus-route-901',
    name: 'Bus Route 901',
    color: '#A0522D',
    stations: [
      { name: 'Badarpur Border', coords: [28.5090, 77.3050], code: 'BDB' },
      { name: 'Tughlakabad', coords: [28.5190, 77.2900], code: 'TGB' },
      { name: 'Sangam Vihar', coords: [28.5150, 77.2600], code: 'SGV' },
      { name: 'Ambedkar Nagar', coords: [28.5300, 77.2350], code: 'ABN' },
      { name: 'Govindpuri', coords: [28.5370, 77.2640], code: 'GVP' },
      { name: 'Kalkaji', coords: [28.5367, 77.2586], code: 'KLK' },
      { name: 'Nehru Place', coords: [28.5490, 77.2530], code: 'NHP' }
    ],
    frequency: '12 mins',
    type: 'bus'
  },

  'bus-route-534': {
    id: 'bus-route-534',
    name: 'Bus Route 534',
    color: '#8FBC8F',
    stations: [
      { name: 'ISBT Kashmere Gate', coords: [28.6687, 77.2277], code: 'ISBT' },
      { name: 'Tis Hazari', coords: [28.6686, 77.2171], code: 'THZ' },
      { name: 'Shakti Nagar', coords: [28.6730, 77.2050], code: 'SKN' },
      { name: 'Kamla Nagar', coords: [28.6810, 77.2080], code: 'KMN' },
      { name: 'Delhi University', coords: [28.6880, 77.2080], code: 'DU' },
      { name: 'GTB Nagar', coords: [28.6950, 77.2100], code: 'GTB' },
      { name: 'Model Town', coords: [28.7130, 77.1950], code: 'MDT' },
      { name: 'Azadpur', coords: [28.7080, 77.1900], code: 'AZP' },
      { name: 'Shalimar Bagh', coords: [28.7200, 77.1850], code: 'SHB' }
    ],
    frequency: '14 mins',
    type: 'bus'
  }
};

// Custom Metro Icon with SVG logos
const createMetroIcon = (color, type, zoomLevel) => {
  const iconSize = zoomLevel < 13 ? 0 :
                   zoomLevel < 14 ? 22 : 
                   zoomLevel < 16 ? 28 : 34;
  
  if (iconSize === 0) return null;
  
  const iconColor = color || '#005BA9';
  const svgSize = Math.round(iconSize * 0.55);
  
  // Metro train SVG logo
  const metroSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 11h16"/><path d="M12 3v8"/><circle cx="8" cy="19" r="2"/><circle cx="16" cy="19" r="2"/><path d="M7 17h10"/></svg>`;
  
  // Bus SVG logo
  const busSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M16 6v6"/><rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 12h16"/><circle cx="8" cy="19" r="1.5"/><circle cx="16" cy="19" r="1.5"/><path d="M4 8h1"/><path d="M19 8h1"/></svg>`;
  
  const svg = type === 'bus' ? busSvg : metroSvg;
  
  return L.divIcon({
    html: `
      <div style="width: ${iconSize}px; height: ${iconSize}px; background-color: ${iconColor}; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
        ${svg}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2]
  });
};

// Custom circle for low zoom levels
const createCircleMarker = (color, zoomLevel, isActive) => {
  const radius = zoomLevel < 10 ? 2 : 
                 zoomLevel < 12 ? 3 : 
                 zoomLevel < 14 ? 4 : 5;
  
  return {
    radius,
    fillColor: color,
    color: '#ffffff',
    weight: isActive ? 2 : 1,
    opacity: isActive ? 1 : 0.8,
    fillOpacity: isActive ? 0.9 : 0.6
  };
};

// ========== Station Popup Content with Real-Time Info ==========
const StationPopupContent = ({ station, lineData, compact = false }) => {
  const [info, setInfo] = React.useState(() => getStationInfo(station.name));
  const [, forceUpdate] = React.useState(0);

  const handleFix = (machineId) => {
    markMachineFixed(machineId);
    setInfo(getStationInfo(station.name));
    forceUpdate(n => n + 1);
  };

  if (compact) {
    return (
      <div className="p-2 min-w-[200px]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-4 rounded-sm" style={{ backgroundColor: lineData.color }}></div>
          <h3 className="font-bold text-gray-800 text-sm">{station.name}</h3>
          {info.isMajor && <span className="px-1 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded">★ MAJOR</span>}
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Code: {station.code} • {lineData.name}</div>
          <div className="flex items-center gap-1.5">
            <span>Crowd:</span>
            <span className="font-semibold" style={{ color: info.crowd.color }}>{info.crowd.level}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[60px]">
              <div className="h-1.5 rounded-full" style={{ width: `${info.crowd.percent}%`, backgroundColor: info.crowd.color }}></div>
            </div>
          </div>
          {info.defects.length > 0 && (
            <div className="text-red-600 font-medium">⚠ {info.defects.length} issue{info.defects.length > 1 ? 's' : ''}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 min-w-[260px] max-w-[300px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-6 rounded-sm" style={{ backgroundColor: lineData.color }}></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-gray-800">{station.name}</h3>
            {info.isMajor && <span className="px-1 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded">★</span>}
          </div>
          <p className="text-xs text-gray-500">Code: {station.code} • {lineData.name}</p>
        </div>
      </div>

      {/* Time Period */}
      <div className="text-xs text-gray-500 mb-2">
        {info.timePeriod.emoji} {info.timePeriod.label} • Updated {info.lastUpdated}
      </div>

      {/* Crowd Level */}
      <div className="rounded-lg p-2 mb-2" style={{ backgroundColor: info.crowd.bg }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-700">Crowd Level</span>
          <span className="text-xs font-bold" style={{ color: info.crowd.color }}>{info.crowd.level}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="h-2 rounded-full transition-all" style={{ width: `${info.crowd.percent}%`, backgroundColor: info.crowd.color }}></div>
        </div>
        <div className="text-[10px] text-gray-500 mt-1">{info.crowd.percent}% capacity</div>
      </div>

      {/* Line Info */}
      <div className="flex gap-2 mb-2 text-xs">
        <span className={`px-1.5 py-0.5 rounded font-medium ${lineData.type === 'bus' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
          {lineData.type === 'bus' ? '🚌 BUS' : '🚇 METRO'}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">Every {lineData.frequency}</span>
      </div>

      {/* Defective Machines */}
      {info.defects.length > 0 && (
        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="text-xs font-semibold text-red-600 mb-1">⚠ {info.defects.length} Defective Machine{info.defects.length > 1 ? 's' : ''}</div>
          <div className="space-y-1.5">
            {info.defects.map((d) => (
              <div key={d.id} className="flex items-center gap-1.5 bg-red-50 rounded px-2 py-1">
                <span className="text-sm">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-gray-800 truncate">{d.label}</div>
                  <div className="text-[10px] text-gray-500">{d.location}</div>
                </div>
                <button
                  onClick={() => handleFix(d.id)}
                  className="px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded hover:bg-green-600 whitespace-nowrap"
                >
                  ✓ Fix
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {info.defects.length === 0 && (
        <div className="border-t border-gray-200 pt-2 mt-2 text-xs text-green-600 font-medium">✓ All machines operational</div>
      )}
    </div>
  );
};

const MetroMap = ({ searchedRoute, externalActiveLine, externalMapClose }) => {
  const mapRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(12);
  const [activeLine, setActiveLine] = useState('red-line');
  const [showAllLines, setShowAllLines] = useState(true);
  const [showStationNames, setShowStationNames] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'metro', 'bus'
  const [mapCenter] = useState([28.7041, 77.1025]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapOpen, setMapOpen] = useState(false);

  // Sync external line selection from MetroLines component
  useEffect(() => {
    if (externalActiveLine !== undefined) {
      setActiveLine(externalActiveLine);
      setShowAllLines(false);
    }
  }, [externalActiveLine]);

  // Auto-open map when a route is searched
  useEffect(() => {
    if (searchedRoute) {
      setMapOpen(true);
    }
  }, [searchedRoute]);

  // Close map when triggered externally
  useEffect(() => {
    if (externalMapClose) {
      setMapOpen(false);
    }
  }, [externalMapClose]);

  // Filter lines based on type
  const filteredLines = useMemo(() => {
    return Object.entries(delhiMetroLines).filter(([key, line]) => {
      if (filterType === 'all') return true;
      if (filterType === 'metro') return line.type !== 'bus';
      if (filterType === 'bus') return line.type === 'bus';
      return true;
    });
  }, [filterType]);

  // Filter stations for low zoom levels
  const filteredStations = useMemo(() => {
    const line = delhiMetroLines[activeLine];
    if (!line) return [];
    
    if (zoomLevel < 10) {
      return [
        line.stations[0],
        line.stations[Math.floor(line.stations.length / 2)],
        line.stations[line.stations.length - 1]
      ];
    } else if (zoomLevel < 12) {
      return line.stations.filter((_, index) => index % 3 === 0);
    } else if (zoomLevel < 14) {
      return line.stations.filter((_, index) => index % 2 === 0);
    }
    return line.stations;
  }, [activeLine, zoomLevel]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const results = [];
    
    Object.entries(delhiMetroLines).forEach(([lineId, line]) => {
      line.stations.forEach(station => {
        if (station.name.toLowerCase().includes(query) || 
            station.code.toLowerCase().includes(query)) {
          results.push({
            lineId,
            lineName: line.name,
            station,
            color: line.color
          });
        }
      });
    });
    
    return results.slice(0, 10); // Limit results
  }, [searchQuery]);

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      
      map.on('zoom', () => {
        const newZoom = map.getZoom();
        setZoomLevel(newZoom);
        setShowStationNames(newZoom >= 14);
      });

      // If there's a searched route, fit to it
      if (searchedRoute && searchedRoute.path.length > 0) {
        const bounds = L.latLngBounds(searchedRoute.path.map(s => s.coords));
        map.fitBounds(bounds, { padding: [60, 60] });
      } else {
        // Fit to active line bounds
        const activeLineData = delhiMetroLines[activeLine];
        if (activeLineData && activeLineData.stations.length > 0) {
          const bounds = L.latLngBounds(activeLineData.stations.map(s => s.coords));
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  }, [activeLine, searchedRoute]);

  const handleRouteSelect = (routeName) => {
    setActiveLine(routeName);
    setShowAllLines(false);
    
    setTimeout(() => {
      setShowAllLines(true);
    }, 300);
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.setView(mapCenter, 12);
      setZoomLevel(12);
      setShowStationNames(false);
    }
  };

  const handleZoomToRoute = () => {
    if (mapRef.current && delhiMetroLines[activeLine]) {
      const bounds = L.latLngBounds(delhiMetroLines[activeLine].stations.map(s => s.coords));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const handleSearchSelect = (result) => {
    setActiveLine(result.lineId);
    if (mapRef.current) {
      mapRef.current.flyTo(result.station.coords, 15);
    }
  };

  return (
    <div>
      {/* Compact Map Toggle */}
      <div className={mapOpen ? 'mb-4' : ''}>
        <button
          onClick={() => setMapOpen(!mapOpen)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                     transition-all cursor-pointer border
                     ${mapOpen
                       ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                       : 'bg-gradient-to-r from-blue-600 to-purple-600 border-transparent text-white hover:from-blue-500 hover:to-purple-500 shadow-md shadow-blue-500/20'}`}
        >
          <span className="text-base">{mapOpen ? '✕' : '🗺️'}</span>
          {mapOpen ? 'Close Map' : 'Open Map'}
        </button>
      </div>

      {mapOpen && (
        <div>
            <div className="bg-white rounded-lg shadow overflow-hidden h-[600px]">
              <MapContainer
                center={mapCenter}
                zoom={zoomLevel}
                ref={mapRef}
                className="h-full w-full"
                zoomControl={false}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Searched Route Highlight */}
                {searchedRoute && searchedRoute.path.length > 1 && (
                  <>
                    {/* Glow background polyline */}
                    <Polyline
                      positions={searchedRoute.path.map(s => s.coords)}
                      pathOptions={{
                        color: '#00ff88',
                        weight: 12,
                        opacity: 0.25,
                      }}
                    />
                    {/* Main highlight polyline */}
                    <Polyline
                      positions={searchedRoute.path.map(s => s.coords)}
                      pathOptions={{
                        color: '#00ff88',
                        weight: 6,
                        opacity: 0.9,
                        dashArray: '12, 8',
                      }}
                    />

                    {/* Source marker */}
                    <Marker
                      position={searchedRoute.from.coords}
                      icon={L.divIcon({
                        html: `<div style="width:32px;height:32px;background:#22c55e;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center"><span style="color:white;font-size:16px;font-weight:bold">A</span></div>`,
                        className: 'custom-marker',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16],
                      })}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-green-700 text-sm">🟢 Source</h3>
                          <p className="font-semibold text-gray-800">{searchedRoute.from.name}</p>
                          <p className="text-xs text-gray-500">{searchedRoute.from.lineName}</p>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Destination marker */}
                    <Marker
                      position={searchedRoute.to.coords}
                      icon={L.divIcon({
                        html: `<div style="width:32px;height:32px;background:#ef4444;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center"><span style="color:white;font-size:16px;font-weight:bold">B</span></div>`,
                        className: 'custom-marker',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16],
                      })}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-red-700 text-sm">🔴 Destination</h3>
                          <p className="font-semibold text-gray-800">{searchedRoute.to.name}</p>
                          <p className="text-xs text-gray-500">{searchedRoute.to.lineName}</p>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Transfer station markers */}
                    {searchedRoute.path.filter(s => s.isTransfer).map((step, i) => (
                      <Marker
                        key={`transfer-${i}`}
                        position={step.coords}
                        icon={L.divIcon({
                          html: `<div style="width:26px;height:26px;background:#f59e0b;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center"><span style="color:white;font-size:12px;font-weight:bold">T</span></div>`,
                          className: 'custom-marker',
                          iconSize: [26, 26],
                          iconAnchor: [13, 13],
                        })}
                      >
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-bold text-amber-600 text-sm">🔄 Transfer</h3>
                            <p className="font-semibold text-gray-800">{step.name}</p>
                            <p className="text-xs text-gray-500">Change to {step.lineName}</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </>
                )}
                
                {/* Render only the active/selected metro line */}
                {filteredLines
                  .filter(([lineKey]) => activeLine === lineKey)
                  .map(([lineKey, lineData]) => {
                  const isActive = true;
                  const positions = lineData.stations.map(station => station.coords);
                  const displayStations = filteredStations;
                  
                  return (
                    <React.Fragment key={lineKey}>
                      {/* Metro/Bus Line */}
                      <Polyline
                        positions={positions}
                        pathOptions={{
                          color: lineData.color,
                          weight: zoomLevel < 12 ? 5 : 6,
                          opacity: zoomLevel < 12 ? 0.9 : 1,
                          dashArray: lineData.type === 'bus' ? '8, 8' : undefined
                        }}
                      />
                      
                      {/* Stations */}
                      {displayStations.map((station, idx) => {
                        const icon = createMetroIcon(
                          lineData.color, 
                          lineData.type === 'bus' ? 'bus' : 'metro', 
                          zoomLevel
                        );
                        
                        // For low zoom, use CircleMarker
                        if (zoomLevel < 13 || !icon) {
                          return (
                            <CircleMarker
                              key={`${lineKey}-${idx}`}
                              center={station.coords}
                              pathOptions={createCircleMarker(lineData.color, zoomLevel, isActive)}
                            >
                              <Popup>
                                <StationPopupContent station={station} lineData={lineData} compact />
                              </Popup>
                            </CircleMarker>
                          );
                        }
                        
                        // For high zoom, use Marker with icon
                        return (
                          <Marker
                            key={`${lineKey}-${idx}`}
                            position={station.coords}
                            icon={icon}
                          >
                            <Popup>
                              <StationPopupContent station={station} lineData={lineData} />
                            </Popup>
                          </Marker>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
                
                <ZoomControl position="bottomright" />
              </MapContainer>
            </div>

            {/* Active Route Info */}
            {delhiMetroLines[activeLine] && (
              <div className="mt-4 bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Active Route</h3>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-6 h-10 rounded-sm"
                      style={{ backgroundColor: delhiMetroLines[activeLine].color }}
                    ></div>
                    <div>
                      <h4 className="font-bold text-gray-800">{delhiMetroLines[activeLine].name}</h4>
                      <p className="text-xs text-gray-600">
                        {delhiMetroLines[activeLine].type === 'bus' ? 'Bus Route' : 'Metro Line'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{delhiMetroLines[activeLine].stations.length}</div>
                      <div className="text-xs text-gray-500">Stations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">{delhiMetroLines[activeLine].frequency}</div>
                      <div className="text-xs text-gray-500">Frequency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">
                        {zoomLevel >= 14 ? 'Detail' : 'Normal'}
                      </div>
                      <div className="text-xs text-gray-500">View</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default MetroMap;