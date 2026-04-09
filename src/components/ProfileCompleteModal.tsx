"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
}

export default function ProfileCompleteModal({ userId }: Props) {
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ name: name.trim(), team: team.trim(), title: title.trim() })
      .eq("id", userId);

    if (updateError) {
      setError(`저장 실패: ${updateError.message}`);
      setLoading(false);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-0 sm:items-center sm:pb-4">
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl sm:p-8">
        <h2 className="mb-2 text-xl font-bold text-gray-900">프로필을 완성해주세요</h2>
        <p className="mb-6 text-sm text-gray-500">
          근태 관리를 위해 아래 정보를 입력해주세요.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="profile-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              id="profile-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label
                htmlFor="profile-team"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                팀 <span className="font-normal text-gray-400">(선택)</span>
              </label>
              <input
                id="profile-team"
                type="text"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="개발팀"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="profile-title"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                직책 <span className="font-normal text-gray-400">(선택)</span>
              </label>
              <input
                id="profile-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="팀장"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3.5 text-base font-semibold text-white transition active:scale-[0.98] hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "저장 중..." : "저장하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
