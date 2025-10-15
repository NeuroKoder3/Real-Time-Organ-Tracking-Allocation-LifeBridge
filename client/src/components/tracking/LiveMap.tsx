// src/components/tracking/LiveMap.tsx
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Plane } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's missing default icon issue in some bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Transport = {
  id: string;
  organType: string;
  origin: string;
  destination: string;
  status: string;
  eta: string;
  currentLat: number;
  currentLng: number;
};

type Props = {
  transports: Transport[];
};

export default function LiveMap({ transports }: Props) {
  return (
    <MapContainer
      center={[37.7749, -122.4194]}
      zoom={5}
      style={{ height: "500px", width: "100%", borderRadius: "8px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {transports.map((t) => (
        <Marker key={t.id} position={[t.currentLat, t.currentLng]}>
          <Popup>
            <div>
              <p className="font-bold">{t.organType}</p>
              <p className="text-sm">
                {t.origin} → {t.destination}
              </p>
              <p className="text-xs text-muted-foreground mt-1">ETA: {t.eta}</p>
              <p className="text-xs capitalize">Status: {t.status}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
