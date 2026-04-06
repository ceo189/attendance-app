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

        {/* iPhone */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-lg text-white">
              1
            </span>
            <h2 className="text-lg font-bold text-gray-900">
              iPhone (Safari)
            </h2>
          </div>
          <ol className="ml-4 space-y-4 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-blue-600">1.</span>
              <span>
                Safari에서{" "}
                <strong className="text-gray-900">
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
            반드시 <strong>Safari</strong>에서 열어야 합니다. 카카오톡/네이버
            등 인앱 브라우저에서는 설치가 안 됩니다.
          </div>
        </div>

        {/* Android */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-lg text-white">
              2
            </span>
            <h2 className="text-lg font-bold text-gray-900">
              Android (Chrome)
            </h2>
          </div>
          <ol className="ml-4 space-y-4 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-blue-600">1.</span>
              <span>
                Chrome에서{" "}
                <strong className="text-gray-900">
                  attendance-app-grovit.vercel.app
                </strong>{" "}
                접속
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-blue-600">2.</span>
              <span>
                상단에{" "}
                <strong className="text-gray-900">
                  &quot;홈 화면에 추가&quot; 배너
                </strong>
                가 뜨면 탭
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-blue-600">3.</span>
              <span>
                배너가 안 뜨면 우측 상단{" "}
                <strong className="text-gray-900">점 3개 메뉴</strong> →{" "}
                <strong className="text-gray-900">
                  &quot;홈 화면에 추가&quot;
                </strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-blue-600">4.</span>
              <span>
                <strong className="text-gray-900">&quot;설치&quot;</strong> 탭
              </span>
            </li>
          </ol>
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
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition active:scale-[0.98] hover:bg-blue-700"
          >
            근태관리 시작하기
          </a>
        </div>
      </div>
    </div>
  );
}
