import { DonorCard } from '../DonorCard';

export default function DonorCardExample() {
  // todo: remove mock functionality
  const mockDonor = {
    id: "dnr-001",
    uii: "DNR-1737138567890-A1B2C3D4",
    firstName: "John",
    lastName: "Smith",
    dateOfBirth: new Date("1985-03-15"),
    eligibilityStatus: "eligible",
    consentStatus: "consented",
    consentDocumentUrl: "/docs/consent-001.pdf",
    createdAt: new Date("2025-01-15"),
  };

  const handleEdit = (donorId: string) => {
    console.log(`Edit donor: ${donorId}`);
  };

  const handleViewConsent = (donorId: string) => {
    console.log(`View consent for donor: ${donorId}`);
  };

  return (
    <div className="p-4 max-w-md">
      <DonorCard 
        donor={mockDonor}
        onEdit={handleEdit}
        onViewConsent={handleViewConsent}
      />
    </div>
  );
}
