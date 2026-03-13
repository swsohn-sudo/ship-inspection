'use client';

import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Plus,
  Ship,
  ChevronRight,
  Loader2,
  LogOut,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

type Inspection = {
  id: string;
  shipName: string;
  inspectionDate: string;
  inspector: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  _count: { results: number };
};

// ─────────────────────────────────────────────────────────────
// 로그인 화면
// ─────────────────────────────────────────────────────────────
function LoginScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-6 gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          <ClipboardList className="w-9 h-9 text-white" />
        </div>
        <p
          className="text-xs font-bold tracking-[0.2em] uppercase"
          style={{ color: '#1e3a5f' }}
        >
          SQT Official Document
        </p>
        <h1 className="text-xl font-bold text-slate-800">Ship Safety Inspection</h1>
        <p className="text-slate-500 text-sm max-w-xs">
          Sign in with your Google account to access the safety checklist.
        </p>
      </div>

      <button
        onClick={() => signIn('google')}
        className="w-full max-w-xs flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-md hover:shadow-lg active:scale-[0.97] transition-all"
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.84l6.1-6.1C34.46 3.1 29.5 1 24 1 14.82 1 7.07 6.48 3.58 14.19l7.1 5.52C12.45 13.1 17.76 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.7c-.55 2.97-2.2 5.48-4.67 7.17l7.18 5.57C43.46 37.28 46.52 31.34 46.52 24.5z" />
          <path fill="#FBBC05" d="M10.68 28.29A14.56 14.56 0 0 1 9.5 24c0-1.49.26-2.93.68-4.29l-7.1-5.52A23.94 23.94 0 0 0 0 24c0 3.87.93 7.53 2.58 10.77l8.1-6.48z" />
          <path fill="#34A853" d="M24 47c5.5 0 10.12-1.82 13.5-4.96l-7.18-5.57C28.46 38.13 26.35 39 24 39c-6.24 0-11.55-3.6-13.32-8.71l-8.1 6.48C6.07 44.52 14.48 47 24 47z" />
        </svg>
        <span className="text-sm font-bold text-slate-700">Sign in with Google</span>
      </button>

      <p className="text-[11px] text-slate-400 text-center max-w-xs">
        Only authorized accounts can access this application.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 삭제 확인 다이얼로그
// ─────────────────────────────────────────────────────────────
function DeleteDialog({
  shipName,
  onConfirm,
  onCancel,
}: {
  shipName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <p className="font-bold text-slate-800 text-base">정말 삭제하시겠습니까?</p>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          <span className="font-semibold text-slate-700">{shipName}</span> 점검표가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 active:scale-95 transition-all"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-600 text-sm font-semibold text-white active:scale-95 transition-all"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 대시보드 (메인)
// ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const { data: session, status } = useSession();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Inspection | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') {
      if (status === 'unauthenticated') setLoading(false);
      return;
    }
    fetch('/api/inspections')
      .then((r) => r.json())
      .then((data) => {
        setInspections(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load inspections');
        setLoading(false);
      });
  }, [status]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/inspections/${deleteTarget.id}`, { method: 'DELETE' });
      setInspections((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    } catch {
      setError('Failed to delete inspection');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  // 세션 로딩
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
      </div>
    );
  }

  // 미인증
  if (status === 'unauthenticated') return <LoginScreen />;

  // 대시보드
  return (
    <div className="min-h-screen bg-slate-100">
      {/* 삭제 확인 다이얼로그 */}
      {deleteTarget && (
        <DeleteDialog
          shipName={deleteTarget.shipName}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* 헤더 */}
      <header
        className="sticky top-0 z-20 shadow-md px-4 py-4"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] text-blue-300 font-semibold tracking-[0.2em] uppercase">
              SQT Official Document
            </p>
            <p className="text-white font-bold text-lg">Inspections</p>
          </div>
          <div className="flex items-center gap-3">
            {session?.user?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
              />
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-blue-200 hover:text-white active:scale-95 transition-all p-1"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-lg mx-auto px-4 py-4 space-y-3 pb-8">
        {/* 새 점검 시작 버튼 */}
        <Link
          href="/inspections/new"
          className="flex items-center gap-4 w-full rounded-2xl text-white px-5 py-5 shadow-lg active:scale-[0.98] transition-all"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-base">Start New Inspection</p>
            <p className="text-blue-200 text-xs font-normal mt-0.5">
              22 sections · 325 check items
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-200 shrink-0" />
        </Link>

        {/* 에러 */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* 점검 목록 */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : inspections.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-slate-400 shadow-sm">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">No inspections yet</p>
            <p className="text-xs mt-1">Start your first inspection above</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 pt-1">
              Recent Inspections
            </p>
            {inspections.map((insp) => (
              <div key={insp.id} className="relative">
                <Link
                  href={`/inspections/${insp.id}`}
                  className="bg-white rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm border border-slate-100 active:scale-[0.98] transition-all pr-14"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#1e3a5f18' }}
                  >
                    <Ship className="w-5 h-5" style={{ color: '#1e3a5f' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">
                      {insp.shipName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400">
                        {new Date(insp.inspectionDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400">{insp.inspector}</span>
                      {insp._count.results > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">
                          {insp._count.results} NC
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        insp.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {insp.status === 'COMPLETED' ? 'Done' : 'In Progress'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </Link>

                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteTarget(insp);
                  }}
                  disabled={deleting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center active:scale-95 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}