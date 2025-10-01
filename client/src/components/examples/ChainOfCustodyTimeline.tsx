import { ChainOfCustodyTimeline } from '../ChainOfCustodyTimeline';

export default function ChainOfCustodyTimelineExample() {
  // todo: remove mock functionality
  const mockEvents = [
    {
      id: "log-001",
      action: "recovered",
      performedBy: "Dr. Sarah Johnson",
      location: "Operating Room 3",
      timestamp: new Date("2025-01-15T08:30:00"),
      notes: "Successful recovery procedure completed",
      environmentalData: { temperature: 4, humidity: 45 }
    },
    {
      id: "log-002", 
      action: "processed",
      performedBy: "Lab Tech Mike Chen",
      location: "Processing Lab A",
      timestamp: new Date("2025-01-15T14:20:00"),
      notes: "Initial processing and quality checks completed",
      environmentalData: { temperature: -20, humidity: 30 }
    },
    {
      id: "log-003",
      action: "stored",
      performedBy: "Storage Manager Lisa Kim",
      location: "Freezer Unit A-12",
      timestamp: new Date("2025-01-15T16:45:00"),
      notes: "Transferred to long-term storage",
      environmentalData: { temperature: -80, humidity: 5 }
    }
  ];

  return (
    <div className="p-4 max-w-2xl">
      <ChainOfCustodyTimeline 
        events={mockEvents}
        specimenId="TIS-1737138567890-A1B2C3D4"
      />
    </div>
  );
}
