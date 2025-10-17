// src/components/reports/AuditLogsTable.tsx
export default function AuditLogsTable() {
  const logs = [
    { id: 1, user: "admin", action: "Registered new organ", timestamp: "2025-10-16 14:22" },
    { id: 2, user: "coordinator", action: "Edited recipient details", timestamp: "2025-10-16 15:40" },
    { id: 3, user: "transporter", action: "Updated organ location", timestamp: "2025-10-17 09:10" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border mt-4">
        <thead className="bg-muted text-left">
          <tr>
            <th className="p-2 font-semibold">User</th>
            <th className="p-2 font-semibold">Action</th>
            <th className="p-2 font-semibold">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t">
              <td className="p-2">{log.user}</td>
              <td className="p-2">{log.action}</td>
              <td className="p-2">{log.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
