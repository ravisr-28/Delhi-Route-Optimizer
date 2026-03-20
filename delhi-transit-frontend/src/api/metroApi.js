import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "http://localhost:3000/api";

// ================= METRO APIs =================

export const getMetroStations = () => axios.get(`${BASE_URL}/stations`);

export const getMetroLines = () => axios.get(`${BASE_URL}/routes?type=metro`);

export const getMetroRoute = (fromStation, toStation) =>
  axios.post(`${BASE_URL}/transit/routes/search`, {
    source: fromStation,
    destination: toStation,
  });