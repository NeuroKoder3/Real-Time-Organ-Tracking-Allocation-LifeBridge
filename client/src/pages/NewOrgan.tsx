import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { fetchWithCsrf } from "@/utils/fetchWithCsrf"; // ✅ CSRF-safe POST helper

interface OrganForm {
  organType: string;
  bloodType: string;
  donorId: string;
  currentLocation: string;
  viabilityHours: number;
}

const initialForm: OrganForm = {
  organType: "",
  bloodType: "",
  donorId: "",
  currentLocation: "",
  viabilityHours: 24,
};

export default function NewOrgan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<OrganForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log("USER FROM useAuth:", user); // ✅ Log user

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await fetchWithCsrf("/api/organs", {
        method: "POST",
        body: JSON.stringify(form),
      });

      navigate("/organs");
    } catch (err: any) {
      console.error("Failed to register organ:", err);
      setError(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Register New Organ</h1>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Organ Type</label>
          <input
            type="text"
            name="organType"
            value={form.organType}
            onChange={handleChange}
            required
            className="w-full border px-2 py-1"
          />
        </div>
        <div>
          <label>Blood Type</label>
          <input
            type="text"
            name="bloodType"
            value={form.bloodType}
            onChange={handleChange}
            required
            className="w-full border px-2 py-1"
          />
        </div>
        <div>
          <label>Donor ID</label>
          <input
            type="text"
            name="donorId"
            value={form.donorId}
            onChange={handleChange}
            required
            className="w-full border px-2 py-1"
          />
        </div>
        <div>
          <label>Current Location</label>
          <input
            type="text"
            name="currentLocation"
            value={form.currentLocation}
            onChange={handleChange}
            required
            className="w-full border px-2 py-1"
          />
        </div>
        <div>
          <label>Viability Hours</label>
          <input
            type="number"
            name="viabilityHours"
            value={form.viabilityHours}
            onChange={handleChange}
            required
            className="w-full border px-2 py-1"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {loading ? "Registering..." : "Register Organ"}
          </button>
        </div>
      </form>
    </div>
  );
}
