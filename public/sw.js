// ─────────────────────────────────────────────────────────────────────────────
// 선박 점검표 PWA 서비스 워커 — 전략: 완전 Network-First
// 버전을 올리면 기존 캐시가 즉시 교체됩니다.
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_NAME = 'ship-inspection-v3';

// ── INSTALL: 즉시 활성화 ────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME));
});

// ── ACTIVATE: 이전 버전 캐시 완전 삭제 + 즉시 제어권 획득 ──────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => {
              console.log('[SW] 이전 캐시 삭제:', key);
              return caches.delete(key);
            }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── FETCH: 모든 요청에 Network-First 단일 전략 적용 ─────────────────────────
// 항상 네트워크에서 최신 리소스를 먼저 가져오고,
// 오프라인(네트워크 실패) 상태일 때만 캐시 폴백 사용.
// Stale-While-Revalidate / Cache-First 미사용.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(networkFirst(event.request));
});

// ─────────────────────────────────────────────────────────────────────────────
// Network-First: 네트워크 성공 시 캐시 갱신, 실패 시 캐시 폴백
// ─────────────────────────────────────────────────────────────────────────────
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    // 항상 네트워크 우선
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone()); // 성공 응답만 캐시에 저장
    }
    return response;
  } catch {
    // 네트워크 실패(오프라인) → 캐시에서 반환
    const cached = await cache.match(request);
    if (cached) return cached;

    // 캐시도 없는 경우 → 오프라인 안내 페이지
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>오프라인</title>' +
      '<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;' +
      'height:100vh;margin:0;background:#f1f5f9}.box{text-align:center;color:#475569}' +
      '.box h1{font-size:1.5rem;margin-bottom:.5rem}.box p{font-size:.9rem}</style>' +
      '<div class="box"><h1>📡 오프라인 상태</h1>' +
      '<p>인터넷 연결을 확인한 후 다시 시도해 주세요.</p></div>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 },
    );
  }
}
