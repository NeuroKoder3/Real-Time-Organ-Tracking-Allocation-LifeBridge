import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Mock aircraft icon
const planeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
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

const mockPlanes = [
  { id: "flight-001", lat: 39.8, lng: -98.6, callsign: "LIFE001" },
  { id: "flight-002", lat: 40.7, lng: -90.2, callsign: "LIFE002" },
];

export default function LiveMap({ transports }: Props) {
  return (
    <MapContainer
      center={[39.8283, -98.5795]} // USA center
      zoom={5}
      style={{ height: "500px", width: "100%", borderRadius: "8px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        // Or use Mapbox with a free token:
        // url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=YOUR_MAPBOX_TOKEN`}
      />

      {/* Organ transports */}
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

      {/* Mock flights */}
      {mockPlanes.map((plane) => (
        <Marker
          key={plane.id}
          position={[plane.lat, plane.lng]}
          icon={planeIcon}
        >
          <Popup>
            <p>✈️ {plane.callsign}</p>
            <p>Mock flight - air tracking demo</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
