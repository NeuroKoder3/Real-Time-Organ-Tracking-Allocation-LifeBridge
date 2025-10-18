import React, { useState } from "react";
import { format } from "date-fns";

type LabResult = {
  reqNumber: string;
  donorId: string;
  testName: string;
  result: string;
  collectedAt: string; // ISO date
};

const MOCK_RESULTS: LabResult[] = [
  {
    reqNumber: "REQ123456",
    donorId: "DONOR001",
    testName: "HIV",
    result: "Negative",
    collectedAt: "2025-10-15T14:20:00Z",
  },
  {
    reqNumber: "REQ789012",
    donorId: "DONOR002",
    testName: "Hepatitis B",
    result: "Positive",
    collectedAt: "2025-10-12T10:00:00Z",
  },
  {
    reqNumber: "REQ345678",
    donorId: "DONOR001",
    testName: "CMV",
    result: "Pending",
    collectedAt: "2025-10-18T08:30:00Z",
  },
];

export default function Labs() {
  const [searchReq, setSearchReq] = useState("");
  const [searchDonor, setSearchDonor] = useState("");
  const [filtered, setFiltered] = useState<LabResult[]>(MOCK_RESULTS);

  const handleSearch = () => {
    const results = MOCK_RESULTS.filter((entry) => {
      const matchReq = searchReq ? entry.reqNumber.includes(searchReq) : true;
      const matchDonor = searchDonor ? entry.donorId.includes(searchDonor) : true;
      return matchReq && matchDonor;
    });

    setFiltered(results);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Lab Results</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by Req #"
          value={searchReq}
          onChange={(e) => setSearchReq(e.target.value)}
          className="border px-4 py-2 rounded w-64"
        />
        <input
          type="text"
          placeholder="Search by Donor #"
          value={searchDonor}
          onChange={(e) => setSearchDonor(e.target.value)}
          className="border px-4 py-2 rounded w-64"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Filter
        </button>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="border px-4 py-2">Requisition #</th>
              <th className="border px-4 py-2">Donor ID</th>
              <th className="border px-4 py-2">Test</th>
              <th className="border px-4 py-2">Result</th>
              <th className="border px-4 py-2">Collected At</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lab, idx) => (
              <tr key={idx} className="border-t hover:bg-muted/40">
                <td className="px-4 py-2">{lab.reqNumber}</td>
                <td className="px-4 py-2">{lab.donorId}</td>
                <td className="px-4 py-2">{lab.testName}</td>
                <td className="px-4 py-2">{lab.result}</td>
                <td className="px-4 py-2">
                  {format(new Date(lab.collectedAt), "PPpp")}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted-foreground">
                  No lab results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
