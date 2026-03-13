// ─────────────────────────────────────────────────────────────────────────────
// 내보내기(Export)용 이미지 압축 유틸리티
//
// · 업로드 시 압축 (page.tsx compressImage):  max 1024px / JPEG 0.80 → 앱 내 미리보기 품질 우선
// · 내보내기 전 압축 (여기):                   max 800px  / JPEG 0.72 → 문서 삽입 용량 우선
//   → A4 지면에서 사진 1컷 실제 출력 크기: ~95mm ≈ 360px @96dpi
//      → 800px 은 실제 출력 해상도의 2배 이상 → 충분한 인쇄 품질
//      → JPEG 0.72: 현장 사진 기준 1장 ≈ 150~280KB 목표
// ─────────────────────────────────────────────────────────────────────────────

const EXPORT_MAX_PX = 800;
const EXPORT_QUALITY = 0.72;

/**
 * File → 내보내기 최적화된 JPEG data URL
 *
 * @param file    - 업로드 완료된 이미지 File (이미 1차 압축 상태)
 * @param maxPx   - 긴 변 기준 최대 픽셀 (기본 800px)
 * @param quality - JPEG 화질 0~1 (기본 0.72)
 * @returns       - "data:image/jpeg;base64,..." 형태의 data URL
 */
export function compressForExport(
  file: File,
  maxPx   = EXPORT_MAX_PX,
  quality = EXPORT_QUALITY,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // 긴 변이 maxPx 를 넘는 경우에만 축소 (이미 작은 이미지는 확대하지 않음)
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
      const w = Math.round(img.width  * ratio);
      const h = Math.round(img.height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context 초기화 실패'));
        return;
      }

      // 흰 배경 채우기 (PNG → JPEG 변환 시 투명 영역 대비)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`이미지 로드 실패: ${file.name}`));
    };

    img.src = url;
  });
}

/**
 * data URL 에서 순수 base64 문자열만 추출
 * "data:image/jpeg;base64,XXXX" → "XXXX"
 */
export function dataUrlToBase64(dataUrl: string): string {
  const idx = dataUrl.indexOf(',');
  if (idx === -1) throw new Error('유효하지 않은 data URL 형식');
  return dataUrl.slice(idx + 1);
}

/**
 * Cloudinary URL 또는 data URL에서 base64 문자열 추출 (Excel 삽입용)
 *
 * · data URL  → 접두사 제거 후 순수 base64 반환 (동기 변환)
 * · HTTP URL  → fetch 후 ArrayBuffer → base64 변환
 *   (Cloudinary는 기본적으로 CORS 허용 — 브라우저에서 직접 fetch 가능)
 */
export async function fetchOrExtractBase64(photoSrc: string): Promise<string> {
  if (photoSrc.startsWith('data:')) {
    return dataUrlToBase64(photoSrc);
  }

  // HTTP(S) URL: fetch → ArrayBuffer → base64
  const res = await fetch(photoSrc);
  if (!res.ok) throw new Error(`이미지 fetch 실패: ${photoSrc}`);

  const buffer = await res.arrayBuffer();
  const bytes  = new Uint8Array(buffer);
  let binary   = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
