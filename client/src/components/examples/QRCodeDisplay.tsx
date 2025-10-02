import QRCodeDisplay from "../QRCodeDisplay";

export default function QRCodeDisplayExample() {
  return (
    <div className="p-4">
      <QRCodeDisplay 
        value="TIS-1737138567890-A1B2C3D4" 
        title="Tissue Specimen ID"
        size={120}
      />
    </div>
  );
}
