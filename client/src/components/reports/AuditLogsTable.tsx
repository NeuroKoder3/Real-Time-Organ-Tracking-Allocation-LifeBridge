// src/components/reports/AuditLogsTable.tsx
type AuditLog = {
  id: number;
  user: string;
  action: string;
  timestamp: string;
};

export default function AuditLogsTable() {
  const logs: AuditLog[] = [
    { id: 1, user: "admin", action: "Registered new organ", timestamp: "2025-10-16 14:22" },
    { id: 2, user: "coordinator", action: "Edited recipient details", timestamp: "2025-10-16 15:40" },
    { id: 3, user: "transporter", action: "Updated organ location", timestamp: "2025-10-17 09:10" },
  ];

  return (
    <div className="overflow-x-auto mt-6">
      <table className="w-full text-sm border border-gray-300 rounded-md">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3 font-semibold text-gray-700">User</th>
            <th className="p-3 font-semibold text-gray-700">Action</th>
            <th className="p-3 font-semibold text-gray-700">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t border-gray-200 hover:bg-gray-50">
              <td className="p-3 text-gray-800">{log.user}</td>
              <td className="p-3 text-gray-800">{log.action}</td>
              <td className="p-3 text-gray-600">{log.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
