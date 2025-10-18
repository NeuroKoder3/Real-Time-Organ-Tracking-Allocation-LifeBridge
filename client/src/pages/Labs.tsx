// src/pages/Labs.tsx

import React, { useState } from "react";

const Labs = () => {
  const [labResults, setLabResults] = useState<string[]>([]);
  const [newResult, setNewResult] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newResult.trim()) {
      setLabResults([...labResults, newResult]);
      setNewResult("");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Lab Results</h1>

      <form onSubmit={handleSubmit} className="mb-4 space-x-2">
        <input
          type="text"
          value={newResult}
          onChange={(e) => setNewResult(e.target.value)}
          placeholder="Enter lab result"
          className="border px-3 py-2 rounded w-64"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Submit
        </button>
      </form>

      <ul className="list-disc pl-5 space-y-1">
        {labResults.map((result, index) => (
          <li key={index}>{result}</li>
        ))}
      </ul>
    </div>
  );
};

export default Labs;
