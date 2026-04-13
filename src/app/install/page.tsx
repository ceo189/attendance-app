export default function InstallGuidePage() {
  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="mx-auto max-w-xl px-4 py-8">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          근태관리 앱 설치 안내
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          홈 화면에 추가하면 일반 앱처럼 사용할 수 있습니다
        </p>

        {/* 중요 안내 */}
        <div className="mb-6 rounded-2xl border-2 border-red-200 bg-red-50 p-5">
          <h3 className="mb-2 font-bold text-red-800">
            반드시 읽어주세요!
          </h3>
          <ul className="space-y-1.5 text-sm text-red-700">
            <li className="flex gap-2">
              <span>-</span>
              <span>
                <strong>카카오톡/네이버 등에서 링크를 열면 로그인이 안 됩니다</strong>
              </span>
            </li>
            <li className="flex gap-2">
              <span>-</span>
              <span>
                반드시 <strong>Safari</strong>(아이폰) 또는{" "}
                <strong>Chrome</strong>(안드로이드)에서 직접 열어주세요
              </span>
            </li>
            <li className="flex gap-2">
              <span>-</span>
              <span>
                링크를 카톡으로 받았다면 → 우측 상단 <strong>...</strong> →{" "}
                <strong>&quot;기본 브라우저로 열기&quot;</strong> 선택
              </span>
            </li>
          </ul>
        </div>

        {/* Android */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-lg text-white">
              1
            </span>
            <h2 className="text-lg font-bold text-gray-900">
              갤럭시 / 안드로이드 (Chrome)
            </h2>
          </div>
          <ol className="ml-4 space-y-4 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-green-600">1.</span>
              <span>
                <strong>Chrome 앱</strong>을 열고 주소창에{" "}
                <strong className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-900">
                  attendance-app-grovit.vercel.app
                </strong>{" "}
                입력
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-green-600">2.</span>
              <span>
                로그인 화면이 뜨면 먼저 <strong>회원가입</strong> 또는{" "}
                <strong>로그인</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-green-600">3.</span>
              <span>
                우측 상단 <strong>점 3개 메뉴 (⋮)</strong> 탭
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-green-600">4.</span>
              <span>
                <strong>&quot;홈 화면에 추가&quot;</strong> 또는{" "}
                <strong>&quot;앱 설치&quot;</strong> 선택
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-green-600">5.</span>
              <span>
                <strong>&quot;설치&quot;</strong> 탭 → 홈 화면에 앱 아이콘 생성!
              </span>
            </li>
          </ol>
          <div className="mt-4 rounded-lg bg-green-50 p-3 text-xs text-green-800">
            설치 후 홈 화면의 <strong>근태관리</strong> 아이콘을 탭하면 앱처럼
            전체 화면으로 실행됩니다.
          </div>
        </div>

        {/* iPhone */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-lg text-white">
              2
            </span>
            <h2 className="text-lg font-bold text-gray-900">
              아이폰 (Safari)
            </h2>
          </div>
          <ol className="ml-4 space-y-4 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-blue-600">1.</span>
              <span>
                <strong>Safari</strong>에서{" "}
                <strong className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-900">
                  attendance-app-grovit.vercel.app
                </strong>{" "}
                접속
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-blue-600">2.</span>
              <span>
                하단 메뉴바에서{" "}
                <strong className="text-gray-900">
                  공유 버튼 (네모 + 위쪽 화살표)
                </strong>{" "}
                탭
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-blue-600">3.</span>
              <span>
                스크롤해서{" "}
                <strong className="text-gray-900">
                  &quot;홈 화면에 추가&quot;
                </strong>{" "}
                선택
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-blue-600">4.</span>
              <span>
                이름 확인 후{" "}
                <strong className="text-gray-900">&quot;추가&quot;</strong> 탭
              </span>
            </li>
          </ol>
          <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
            반드시 <strong>Safari</strong>에서 열어야 합니다. Chrome이나
            카카오톡에서는 &quot;홈 화면에 추가&quot;가 나오지 않습니다.
          </div>
        </div>

        {/* 로그인 안 될 때 */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-lg text-white">
              ?
            </span>
            <h2 className="text-lg font-bold text-gray-900">
              로그인이 안 될 때
            </h2>
          </div>
          <ol className="ml-4 space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-orange-500">1.</span>
              <span>
                홈 화면의 앱 아이콘을 <strong>길게 눌러서 삭제</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-orange-500">2.</span>
              <span>
                Chrome(안드로이드) 또는 Safari(아이폰)에서{" "}
                <strong>직접 주소 입력</strong>해서 접속
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-orange-500">3.</span>
              <span>
                로그인 성공 확인 후 <strong>다시 홈 화면에 추가</strong>
              </span>
            </li>
          </ol>
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            그래도 안 되면 관리자(한재연 대표)에게 문의하세요. 비밀번호
            초기화를 도와드립니다.
          </div>
        </div>

        {/* Benefits */}
        <div className="rounded-2xl bg-blue-50 p-6">
          <h3 className="mb-3 font-bold text-blue-900">
            설치하면 좋은 점
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex gap-2">
              <span>-</span>
              <span>홈 화면에서 바로 실행 (브라우저 주소 입력 불필요)</span>
            </li>
            <li className="flex gap-2">
              <span>-</span>
              <span>전체 화면으로 깔끔하게 사용</span>
            </li>
            <li className="flex gap-2">
              <span>-</span>
              <span>일반 앱과 동일한 사용 경험</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/login"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3.5 text-base font-semibold text-white transition active:scale-[0.98] hover:bg-blue-700"
          >
            근태관리 시작하기
          </a>
        </div>
      </div>
    </div>
  );
}
