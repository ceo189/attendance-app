"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const LEAVE_TYPES = [
  { value: "annual", label: "연차" },
  { value: "sick", label: "병가" },
  { value: "personal", label: "개인사유" },
  { value: "other", label: "기타" },
] as const;

interface Props {
  userId: string;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LeaveRequestForm({
  userId,
  userEmail,
  onClose,
  onSuccess,
}: Props) {
  const [leaveType, setLeaveType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const showError = useCallback((msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!leaveType) { showError("휴가 종류를 선택해주세요."); return; }
    if (!startDate) { showError("시작일을 선택해주세요."); return; }
    if (!endDate) { showError("종료일을 선택해주세요."); return; }
    if (endDate < startDate) { showError("종료일이 시작일보다 빠를 수 없습니다."); return; }

    setLoading(true);
    try {
      const { error: insertError } = await supabase.from("leave_requests").insert({
        user_id: userId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim() || null,
        status: "pending",
      });

      if (insertError) {
        showError(`신청 실패: ${insertError.message}`);
        setLoading(false);
        return;
      }

      // Send notification
      try {
        const leaveLabel = LEAVE_TYPES.find((t) => t.value === leaveType)?.label ?? leaveType;
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "leave_request",
            email: userEmail,
            time: new Date().toISOString(),
            location: `${leaveLabel} (${startDate} ~ ${endDate})${reason ? ": " + reason : ""}`,
          }),
        });
      } catch {
        // Notification failure is non-fatal
      }

      onSuccess();
    } catch (err) {
      showError(`네트워크 오류: ${String(err)}`);
    }
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">휴가 신청</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              휴가 종류
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- 선택 --</option>
              {LEAVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                종료일
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              사유 <span className="font-normal text-gray-400">(선택)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="휴가 사유를 입력하세요"
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "신청 중..." : "휴가 신청"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
