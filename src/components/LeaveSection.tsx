"use client";

import { useState } from "react";
import LeaveRequestForm from "@/components/LeaveRequestForm";
import LeaveList, { LeaveRequest } from "@/components/LeaveList";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  userEmail: string;
  leaveRequests: LeaveRequest[];
}

export default function LeaveSection({
  userId,
  userEmail,
  leaveRequests: initialRequests,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState<LeaveRequest[]>(initialRequests);
  const supabase = createClient();

  async function refreshRequests() {
    const { data } = await supabase
      .from("leave_requests")
      .select("id, leave_type, start_date, end_date, reason, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setRequests(data);
  }

  function handleSuccess() {
    setShowForm(false);
    refreshRequests();
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">휴가 신청</h2>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 active:scale-95"
        >
          + 휴가 신청
        </button>
      </div>

      <LeaveList requests={requests} />

      {showForm && (
        <LeaveRequestForm
          userId={userId}
          userEmail={userEmail}
          onClose={() => setShowForm(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
