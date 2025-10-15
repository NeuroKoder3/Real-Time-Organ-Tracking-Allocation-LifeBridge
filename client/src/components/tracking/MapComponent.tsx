// src/components/tracking/MapComponent.tsx
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

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

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
      <MapContainer center={[39.8283, -98.5795]} zoom={4} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
      </MapContainer>
    </div>
  );
}
