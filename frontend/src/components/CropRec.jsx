import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";

// Custom Red Location Icon
const redIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

// Component to update map center dynamically
const ChangeMapView = ({ position }) => {
  const map = useMap();
  map.setView(position, 12);
  return null;
};

const SearchBox = ({ setFullAddress, setPosition }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestions = async (input) => {
    if (!input) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${input}`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching location:", error);
      setSuggestions([]);
    }
  };

  const handleSelect = (place) => {
    setQuery(place.display_name);
    setFullAddress(place.display_name);
    setPosition([parseFloat(place.lat), parseFloat(place.lon)]);
    setSuggestions([]);
  };

  return (
    <div style={{ position: "relative", marginBottom: "10px" }}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          fetchSuggestions(e.target.value);
        }}
        placeholder="🔍 Search for a location..."
        style={{ width: "100%", padding: "10px", borderRadius: "8px", outline: "none" }}
      />
      {suggestions.length > 0 && (
        <ul
          style={{ position: "absolute", width: "100%", background: "white", listStyle: "none", padding: "5px", borderRadius: "8px", zIndex: 1000 }}>
          {suggestions.map((place) => (
            <li key={place.place_id} onClick={() => handleSelect(place)}
                style={{ padding: "10px", cursor: "pointer" }}>{place.display_name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

const MapCropPrediction = () => {
  const [fullAddress, setFullAddress] = useState("");
  const [position, setPosition] = useState([12.9716, 77.5946]);
  const [prediction, setPrediction] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("http://127.0.0.1:8001/predict", {
        N: 50.0,
        P: 40.0,
        K: 30.0,
        temperature: 25.0,
        humidity: 60.0,
        ph: 6.5,
        rainfall: 200,
      });

      if (!response.data.recommended_crops) {
        throw new Error("No crop recommendations received from API.");
      }
      setPrediction(response.data.recommended_crops);
    } catch (err) {
      setError(err.message || "Failed to fetch prediction. Ensure the API is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-6 p-6 bg-gray-100 dark:bg-gray-900 rounded-lg">
      {/* Map Section */}
      <div className="w-1/2 bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">📍 Search Location</h2>
        <SearchBox setFullAddress={setFullAddress} setPosition={setPosition} />
        <MapContainer center={position} zoom={12} style={{ height: "350px", borderRadius: "8px" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ChangeMapView position={position} />
          <Marker position={position} icon={redIcon}>
            <Popup>{fullAddress || "Selected Location"}</Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Prediction Section */}
      <div className="w-1/2 bg-white p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">🌾 Crop Prediction</h2>
        <p className="text-gray-600 mb-4">Location: {fullAddress || "Select a place on the map"}</p>
        <button
          onClick={handlePredict}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          disabled={loading}
        >
          {loading ? "Predicting..." : "Predict Crop"}
        </button>

        {error && <p className="text-red-500 mt-4">{error}</p>}
        {prediction.length > 0 && (
          <div className="mt-6 p-4 bg-green-100 rounded-lg">
            <h3 className="text-lg font-semibold text-green-700">Recommended Crops:</h3>
            <div className="text-lg text-green-900 font-bold flex flex-wrap justify-center gap-3 mt-2">
              {prediction.map((crop, index) => (
                <span key={index} className="px-4 py-2 bg-green-200 rounded-lg">{crop}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapCropPrediction;