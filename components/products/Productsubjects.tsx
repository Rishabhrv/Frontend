"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type Subject = {
  id: number;
  name: string;
  slug: string;
};

type Props = {
  productId?: number;
  mode?: "add" | "edit";
  selectedSubjects: number[];
  onChange: (ids: number[]) => void;
  error?: string;
};

export default function ProductSubjects({
  productId,
  mode,
  selectedSubjects,
  onChange,
  error,
}: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Fetch all active subjects for the checklist
  useEffect(() => {
    fetch(`${API_URL}/api/subjects/public`)
      .then((r) => r.json())
      .then((data) => setSubjects(Array.isArray(data) ? data : []))
      .catch(() => setSubjects([]));
  }, []);

  // In edit mode, pre-load the product's existing subjects
  useEffect(() => {
    if (mode !== "edit" || !productId) return;
    fetch(`${API_URL}/api/subjects/product/${productId}`)
      .then((r) => r.json())
      .then((data: Subject[]) => {
        if (Array.isArray(data)) onChange(data.map((s) => s.id));
      })
      .catch(() => {});
  }, [mode, productId]);

  const toggle = (id: number) => {
    onChange(
      selectedSubjects.includes(id)
        ? selectedSubjects.filter((s) => s !== id)
        : [...selectedSubjects, id]
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-300 p-4">
      <h2 className="mb-3 font-medium text-gray-700">Subjects</h2>

      {subjects.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No subjects available</p>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-1.5 bg-gray-50 p-3 rounded-lg">
          {subjects.map((subject) => (
            <label
              key={subject.id}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                className="w-3 h-3"
                checked={selectedSubjects.includes(subject.id)}
                onChange={() => toggle(subject.id)}
              />
              <span>{subject.name}</span>
            </label>
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}