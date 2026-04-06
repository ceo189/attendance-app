"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
}

export default function ConsentModal({ userId }: Props) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleConsent() {
    setLoading(true);
    await supabase
      .from("profiles")
      .update({
        location_consent: true,
        consent_date: new Date().toISOString(),
      })
      .eq("id", userId);
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          위치정보 수집 및 이용 동의 (필수)
        </h2>
        <div className="mb-6 rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
          본 서비스는 직원의 정당한 출퇴근 기록 확인 및 근무지 증빙을 위해서만
          위치정보(GPS 좌표)를 수집합니다. 수집된 정보는 최고
          관리자(Master) 외에는 절대 열람이 불가능하며, 수집 목적 달성 시
          안전하게 파기됩니다. 동의를 거부할 권리가 있으나, 미동의 시 출퇴근
          기능 이용이 제한될 수 있습니다.
        </div>
        <button
          onClick={handleConsent}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "처리 중..." : "동의함"}
        </button>
      </div>
    </div>
  );
}
