import SpecimenCard from "../SpecimenCard";

export default function SpecimenCardExample() {
  // todo: remove mock functionality
  const mockSpecimen = {
    id: "spec-001",
    uii: "TIS-1737138567890-A1B2C3D4",
    tissueType: "bone",
    status: "stored",
    currentLocation: "Freezer A-12",
    storageConditions: "-80°C, <5% Humidity",
    expirationDate: new Date("2027-01-15"),
    qualityScore: "A",
    processingNotes: "Excellent quality, no contamination detected",
    createdAt: new Date("2025-01-15"),
  };

  const handleEdit = (specimenId: string) => {
    console.log(`Edit specimen: ${specimenId}`);
  };

  const handleViewHistory = (specimenId: string) => {
    console.log(`View history for specimen: ${specimenId}`);
  };

  return (
    <div className="p-4 max-w-md">
      <SpecimenCard 
        specimen={mockSpecimen}
        onEdit={handleEdit}
        onViewHistory={handleViewHistory}
      />
    </div>
  );
}
