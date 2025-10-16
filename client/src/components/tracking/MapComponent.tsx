import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Transport = {
  id: string;
  organType: string;
  origin: string;
  destination: string;
  status: string;
  currentLat: number;
  currentLng: number;
};

// Default organ marker icon
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Plane marker icon
const planeIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Simulated flights (mock data)
const mockFlights = [
  { id: "plane-1", lat: 38.5, lng: -97.0, callsign: "LIFE001" },
  { id: "plane-2", lat: 41.2, lng: -95.9, callsign: "LIFE002" },
];

export default function MapComponent() {
  const [transports, setTransports] = useState<Transport[]>([]);

  useEffect(() => {
    const fetchTransports = async () => {
      const res = await fetch("/api/transports", { credentials: "include" });
      const data = await res.json();
      setTransports(data);
    };

    fetchTransports();
    const interval = setInterval(fetchTransports, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[500px] rounded-md overflow-hidden border">
      <MapContainer center={[39.8283, -98.5795]} zoom={5} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          // To upgrade visuals, use Mapbox tiles (requires free token)
          // url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=YOUR_MAPBOX_TOKEN`}
        />

        {/* Organ Transports */}
        {transports.map((t) => (
          <Marker
            key={t.id}
            position={[t.currentLat, t.currentLng]}
            icon={defaultIcon}
          >
            <Popup>
              <strong>{t.organType}</strong><br />
              {t.origin} → {t.destination}<br />
              Status: {t.status}
            </Popup>
          </Marker>
        ))}

        {/* Mock Airplanes */}
        {mockFlights.map((plane) => (
          <Marker
            key={plane.id}
            position={[plane.lat, plane.lng]}
            icon={planeIcon}
          >
            <Popup>
              ✈️ <strong>{plane.callsign}</strong><br />
              Simulated flight path<br />
              Status: En Route
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
