'use client';

import {
  useState,
  useCallback,
  useRef,
  useMemo,
  memo,
  useTransition,
} from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  ChevronDown,
  ChevronUp,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  Table2,
  LogOut,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { buildDeficiencyList } from '@/lib/deficiencyReport';

// ─────────────────────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────────────────────
type CheckItemData = {
  id: string;
  itemNo: string;
  description: string;
  riskScore: number;
  order: number;
};

type SectionData = {
  id: string;
  no: number;
  nameEn: string;
  order: number;
  items: CheckItemData[];
};

type InspectionData = {
  id: string;
  shipName: string;
  inspectionDate: string;
  inspector: string;
  status: string;
};

type ResultEntry = {
  id?: string;
  photo: string | null;
  comments: string;
};

type ResultsState = Record<string, ResultEntry>; // itemId → entry

// ─────────────────────────────────────────────────────────────
// CheckItemRow — 개별 점검 항목 행
// ─────────────────────────────────────────────────────────────
interface CheckItemRowProps {
  item: CheckItemData;
  result: ResultEntry | undefined;
  isExpanded: boolean;
  isSaving: boolean;
  onToggle: () => void;
  onPhotoChange: (photo: string | null) => void;
  onCommentChange: (comments: string) => void;
}

const CheckItemRow = memo(function CheckItemRow({
  item,
  result,
  isExpanded,
  isSaving,
  onToggle,
  onPhotoChange,
  onCommentChange,
}: CheckItemRowProps) {
  const hasPhoto = Boolean(result?.photo);
  const comments = result?.comments ?? '';
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = ''; // reset input

      setIsCompressing(true);
      try {
        // 1단계: 브라우저 이미지 압축 (목표 300KB)
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.82,
          fileType: 'image/jpeg',
        });

        // 2단계: base64 변환
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload  = (ev) => resolve(ev.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(compressed);
        });

        // 3단계: Cloudinary 업로드 → 영구 URL 수신
        const res = await fetch('/api/upload', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ dataUrl }),
        });
        if (!res.ok) throw new Error('Upload failed');
        const { url } = await res.json() as { url: string };

        onPhotoChange(url);
      } catch (err) {
        console.error('[PhotoUpload]', err);
        alert('Failed to process or upload image. Please try again.');
      } finally {
        setIsCompressing(false);
      }
    },
    [onPhotoChange]
  );

  const handleRemovePhoto = useCallback(() => {
    if (confirm('Remove photo? Item will be reset to OK.')) {
      onPhotoChange(null);
    }
  }, [onPhotoChange]);

  return (
    <div>
      {/* ── 항목 행 헤더 (탭 영역) ── */}
      <button
        onClick={onToggle}
        className="w-full flex items-center px-4 py-4 text-left active:bg-slate-50 transition-colors min-h-[56px]"
      >
        {/* 번호 */}
        <span className="w-12 text-[11px] font-mono text-slate-400 shrink-0 font-bold">
          {item.itemNo}
        </span>

        {/* 설명 */}
        <span className="flex-1 text-sm text-slate-700 leading-snug line-clamp-2 mr-2">
          {item.description}
        </span>

        {/* 상태 배지 + 화살표 */}
        <div className="shrink-0 flex items-center gap-2">
          {(isCompressing || isSaving) && (
            <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
          )}
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              hasPhoto
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {hasPhoto ? 'NC' : 'OK'}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* ── 확장 영역 ── */}
      {isExpanded && (
        <div
          className={`px-4 pb-5 border-t border-slate-100 ${
            hasPhoto ? 'bg-red-50/30' : 'bg-green-50/20'
          }`}
        >
          {/* 촬영 버튼 그리드 */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            {/* 카메라 촬영 */}
            <label
              className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-2xl border-2 border-dashed bg-white select-none transition-all ${
                isCompressing
                  ? 'border-slate-200 cursor-not-allowed opacity-60'
                  : 'border-slate-300 cursor-pointer active:scale-95 hover:border-blue-400'
              }`}
            >
              <Camera className="w-5 h-5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600">
                {isCompressing ? 'Processing…' : 'Take Photo'}
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
                disabled={isCompressing}
              />
            </label>

            {/* 갤러리 선택 */}
            <label
              className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-2xl border-2 border-dashed bg-white select-none transition-all ${
                isCompressing
                  ? 'border-slate-200 cursor-not-allowed opacity-60'
                  : 'border-slate-300 cursor-pointer active:scale-95 hover:border-blue-400'
              }`}
            >
              <ImageIcon className="w-5 h-5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600">
                {isCompressing ? 'Processing…' : 'Gallery'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isCompressing}
              />
            </label>
          </div>

          {/* 압축/업로드 중 표시 */}
          {isCompressing && (
            <div className="mt-3 flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-3 rounded-xl">
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
              <span className="text-xs font-medium">
                Compressing &amp; uploading…
              </span>
            </div>
          )}

          {/* ── NC 상태: 사진 + 코멘트 ── */}
          {hasPhoto && !isCompressing && (
            <div className="mt-4 space-y-3">
              {/* 사진 미리보기 */}
              <div className="relative rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result!.photo!}
                  alt="Defect photo"
                  className="w-full h-52 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

                {/* 삭제 버튼 */}
                <button
                  onClick={handleRemovePhoto}
                  className="absolute top-2.5 right-2.5 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center text-sm active:scale-90 transition-transform"
                >
                  ✕
                </button>

                {/* NC 배지 */}
                <span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  🚨 NC
                </span>

                {isSaving && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    Saving…
                  </div>
                )}
              </div>

              {/* 코멘트 입력 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-red-700 uppercase tracking-wider">
                  Non-Conformity Comments
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => onCommentChange(e.target.value)}
                  placeholder="결함 내용을 입력하세요 / Describe the defect in detail…"
                  className="w-full rounded-xl border-2 border-red-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-red-500 focus:outline-none resize-none h-24 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* ── OK 상태 표시 ── */}
          {!hasPhoto && !isCompressing && (
            <div className="mt-3 flex items-center gap-2.5 bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-100">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-xs font-medium">
                No defect found — Item OK
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// InspectionClient — 메인 클라이언트 컴포넌트
// ─────────────────────────────────────────────────────────────
interface Props {
  inspection: InspectionData;
  sections: SectionData[];
  initialResults: { id: string; itemId: string; photo: string | null; comments: string }[];
}

export default function InspectionClient({
  inspection,
  sections,
  initialResults,
}: Props) {
  // results 초기화
  const [results, setResults] = useState<ResultsState>(() => {
    const map: ResultsState = {};
    initialResults.forEach((r) => {
      map[r.itemId] = { id: r.id, photo: r.photo, comments: r.comments ?? '' };
    });
    return map;
  });

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<'pdf' | 'excel' | null>(null);
  const [, startTransition] = useTransition();

  // 코멘트 디바운스 타이머
  const commentTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );

  // ── 통계 ──
  const totalItems = useMemo(
    () => sections.reduce((s, sec) => s + sec.items.length, 0),
    [sections]
  );
  const ncCount = useMemo(
    () => Object.values(results).filter((r) => r.photo).length,
    [results]
  );

  // ── 결함 목록: 사진 + 코멘트 모두 있는 항목 (보고서 기준) ──
  const deficiencyList = useMemo(
    () => buildDeficiencyList(sections, results),
    [sections, results]
  );

  // ── DB 저장 ──
  const saveResult = useCallback(
    async (itemId: string, data: { photo: string | null; comments: string }) => {
      setSavingItems((prev) => new Set(prev).add(itemId));
      try {
        const res = await fetch(
          `/api/inspections/${inspection.id}/items/${itemId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          }
        );
        if (!res.ok) throw new Error('Save failed');
        setSaveError(null);
      } catch {
        setSaveError('Auto-save failed — check connection');
      } finally {
        setSavingItems((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }
    },
    [inspection.id]
  );

  // ── 사진 변경 핸들러 (즉시 저장) ──
  const handlePhotoChange = useCallback(
    (itemId: string, photo: string | null) => {
      setResults((prev) => {
        const existing = prev[itemId] ?? { photo: null, comments: '' };
        const comments = photo ? existing.comments : ''; // 사진 제거 시 코멘트도 초기화
        const updated = { ...existing, photo, comments };
        // 즉시 DB 저장
        saveResult(itemId, { photo, comments });
        return { ...prev, [itemId]: updated };
      });
    },
    [saveResult]
  );

  // ── 코멘트 변경 핸들러 (800ms 디바운스) ──
  const handleCommentChange = useCallback(
    (itemId: string, comments: string) => {
      setResults((prev) => ({
        ...prev,
        [itemId]: { ...(prev[itemId] ?? { photo: null, comments: '' }), comments },
      }));

      clearTimeout(commentTimers.current[itemId]);
      commentTimers.current[itemId] = setTimeout(() => {
        setResults((prev) => {
          const current = prev[itemId];
          if (current) saveResult(itemId, { photo: current.photo, comments });
          return prev;
        });
      }, 800);
    },
    [saveResult]
  );

  // ── Excel Deficiency List 내보내기 ──
  const handleExcelExport = useCallback(async () => {
    if (deficiencyList.length === 0) {
      alert(
        '보고서에 포함할 항목이 없습니다.\n' +
        '사진(NC)이 촬영되고 코멘트가 작성된 항목만 Deficiency List에 포함됩니다.'
      );
      return;
    }
    setIsExporting('excel');
    try {
      const { buildDeficiencyExcelBlob } = await import(
        '@/lib/generateDeficiencyExcel'
      );
      const blob    = await buildDeficiencyExcelBlob(inspection, deficiencyList);
      const url     = URL.createObjectURL(blob);
      const a       = document.createElement('a');
      a.href        = url;
      const dateStr = inspection.inspectionDate.slice(0, 10).replace(/-/g, '');
      a.download    = `DeficiencyList_${inspection.shipName}_${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[DeficiencyExcel]', err);
      alert('Excel 생성에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsExporting(null);
    }
  }, [inspection, deficiencyList]);

  // ── PDF Deficiency List 내보내기 ──
  const handlePdfExport = useCallback(async () => {
    if (deficiencyList.length === 0) {
      alert(
        '보고서에 포함할 항목이 없습니다.\n' +
        '사진(NC)이 촬영되고 코멘트가 작성된 항목만 Deficiency List에 포함됩니다.'
      );
      return;
    }
    setIsExporting('pdf');
    try {
      const { buildPdfBlob } = await import('@/lib/generatePdf');
      const blob    = await buildPdfBlob(inspection, deficiencyList);
      const url     = URL.createObjectURL(blob);
      const a       = document.createElement('a');
      a.href        = url;
      const dateStr = inspection.inspectionDate.slice(0, 10).replace(/-/g, '');
      a.download    = `DeficiencyList_${inspection.shipName}_${dateStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[DeficiencyPDF]', err);
      alert('PDF 생성에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsExporting(null);
    }
  }, [inspection, deficiencyList]);

  // ── 섹션 토글 ──
  const toggleSection = useCallback((id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── 항목 토글 ──
  const toggleItem = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── 전체 펼치기 / 접기 ──
  const expandAll = useCallback(() => {
    startTransition(() => {
      setExpandedSections(new Set(sections.map((s) => s.id)));
    });
  }, [sections]);

  const collapseAll = useCallback(() => {
    startTransition(() => {
      setExpandedSections(new Set());
      setExpandedItems(new Set());
    });
  }, []);

  const inspDate = new Date(inspection.inspectionDate).toLocaleDateString(
    'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' }
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ── 헤더 ── */}
      <header
        className="sticky top-0 z-20 shadow-md"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        <div className="max-w-lg mx-auto px-4 py-3 space-y-2">
          {/* 상단 행: 뒤로가기 + 선박명 + 로그아웃 */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-1.5 text-blue-200 hover:text-white active:scale-90 transition-all rounded-lg shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base leading-tight truncate">
                {inspection.shipName}
              </p>
              <p className="text-blue-200 text-[11px] mt-0.5">
                {inspDate} · {inspection.inspector}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-1.5 text-blue-200 hover:text-white active:scale-95 transition-all shrink-0"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* 진행률 바 */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-blue-200">
              <span>NC Items (Photo Required)</span>
              <span className="font-bold">
                {ncCount} found · {totalItems} total
              </span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-400 to-amber-400 transition-all duration-500"
                style={{
                  width: `${totalItems > 0 ? (ncCount / totalItems) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* 저장 에러 */}
          {saveError && (
            <p className="text-red-300 text-[11px] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {saveError}
            </p>
          )}
        </div>
      </header>

      {/* ── 본문 ── */}
      <main className="max-w-lg mx-auto px-4 py-4 space-y-2 pb-36">
        {/* 전체 펼치기/접기 */}
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            Collapse All
          </button>
        </div>

        {/* 섹션 데이터 없는 경우 (정상적으로는 표시되지 않음 — 정적 마스터 데이터 사용) */}
        {sections.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">
                Checklist data not found
              </p>
              <p className="text-xs text-amber-700 mt-1">
                페이지를 새로고침하거나 관리자에게 문의해 주세요.
              </p>
            </div>
          </div>
        )}

        {/* 22개 섹션 아코디언 */}
        {sections.map((section) => {
          const sectionNc = section.items.filter(
            (i) => results[i.id]?.photo
          ).length;
          const isOpen = expandedSections.has(section.id);

          return (
            <div
              key={section.id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100"
            >
              {/* 섹션 헤더 */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full text-left"
              >
                <div
                  className="flex items-center px-4 py-4 gap-3"
                  style={{ backgroundColor: '#1e3a5f' }}
                >
                  {/* 섹션 번호 원형 뱃지 */}
                  <span className="w-8 h-8 rounded-full bg-white/20 text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {section.no}
                  </span>

                  {/* 섹션명 */}
                  <span className="flex-1 text-white font-bold text-[15px] leading-snug">
                    {section.nameEn}
                  </span>

                  {/* NC 카운트 + 항목 수 + 화살표 */}
                  <div className="shrink-0 flex items-center gap-2">
                    {sectionNc > 0 && (
                      <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {sectionNc} NC
                      </span>
                    )}
                    <span className="text-blue-300 text-[11px]">
                      {section.items.length}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-blue-200 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
              </button>

              {/* 항목 목록 */}
              {isOpen && (
                <div className="divide-y divide-slate-100">
                  {section.items.map((item) => (
                    <CheckItemRow
                      key={item.id}
                      item={item}
                      result={results[item.id]}
                      isExpanded={expandedItems.has(item.id)}
                      isSaving={savingItems.has(item.id)}
                      onToggle={() => toggleItem(item.id)}
                      onPhotoChange={(photo) =>
                        handlePhotoChange(item.id, photo)
                      }
                      onCommentChange={(comments) =>
                        handleCommentChange(item.id, comments)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* ── Off-screen PDF template (항상 DOM에 마운트, 뷰포트 밖) ── */}
      {/* ── 하단 고정 버튼 (Export) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg safe-bottom">
        <div className="max-w-lg mx-auto px-4 py-3">
          {/* NC / Deficiency 요약 */}
          {ncCount > 0 && (
            <div className="text-center text-xs text-slate-500 mb-2 space-y-0.5">
              <p>
                <span className="font-bold text-red-600">{ncCount} NC</span>
                {' '}(photo)
                {ncCount - deficiencyList.length > 0 && (
                  <span className="text-amber-600">
                    {' '}· {ncCount - deficiencyList.length} need comments
                  </span>
                )}
              </p>
              {deficiencyList.length > 0 && (
                <p className="font-bold text-emerald-700">
                  {deficiencyList.length} deficiencies ready for report
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {/* PDF 다운로드 */}
            <button
              onClick={handlePdfExport}
              disabled={isExporting !== null}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm text-white active:scale-[0.98] transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              {isExporting === 'pdf' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {isExporting === 'pdf' ? 'Generating…' : 'Deficiency PDF'}
            </button>

            {/* Excel 다운로드 */}
            <button
              onClick={handleExcelExport}
              disabled={isExporting !== null}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm text-slate-700 border-2 border-slate-300 bg-white active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isExporting === 'excel' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Table2 className="w-4 h-4" />
              )}
              {isExporting === 'excel' ? 'Generating…' : 'Deficiency Excel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
