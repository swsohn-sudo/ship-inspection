'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import {
  ArrowLeft,
  Ship,
  Calendar,
  User,
  ChevronRight,
  Loader2,
  Info,
} from 'lucide-react';

type FormData = {
  shipName: string;
  inspectionDate: string;
  inspector: string;
};

export default function NewInspectionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      inspectionDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      const inspection = await res.json();
      router.push(`/inspections/${inspection.id}`);
    } catch {
      alert('Failed to create inspection. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 헤더 */}
      <header
        className="sticky top-0 z-10 px-4 py-4 shadow-md"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 text-blue-200 hover:text-white active:scale-90 transition-all rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-[10px] text-blue-300 font-semibold tracking-[0.2em] uppercase">
              New Inspection
            </p>
            <p className="text-white font-bold text-base leading-tight">
              Basic Information
            </p>
          </div>
        </div>
      </header>

      {/* 폼 */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 기본 정보 카드 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Inspection Details
            </h2>

            {/* 선박명 */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Ship className="w-3.5 h-3.5" />
                Ship&apos;s Name <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                {...register('shipName', { required: "Ship's name is required" })}
                placeholder="e.g. MV Hanbada"
                autoComplete="off"
                className={`w-full rounded-xl border-2 px-4 py-3.5 text-sm focus:outline-none transition-colors ${
                  errors.shipName
                    ? 'border-red-300 focus:border-red-500 bg-red-50/30'
                    : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.shipName && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.shipName.message}
                </p>
              )}
            </div>

            {/* 점검 날짜 */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Calendar className="w-3.5 h-3.5" />
                Inspection Date <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="date"
                {...register('inspectionDate', { required: 'Inspection date is required' })}
                className={`w-full rounded-xl border-2 px-4 py-3.5 text-sm focus:outline-none transition-colors ${
                  errors.inspectionDate
                    ? 'border-red-300 focus:border-red-500 bg-red-50/30'
                    : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.inspectionDate && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.inspectionDate.message}
                </p>
              )}
            </div>

            {/* 점검자 */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <User className="w-3.5 h-3.5" />
                Inspector Name <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                {...register('inspector', { required: 'Inspector name is required' })}
                placeholder="Your name"
                autoComplete="name"
                className={`w-full rounded-xl border-2 px-4 py-3.5 text-sm focus:outline-none transition-colors ${
                  errors.inspector
                    ? 'border-red-300 focus:border-red-500 bg-red-50/30'
                    : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.inspector && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.inspector.message}
                </p>
              )}
            </div>
          </div>

          {/* 안내 카드 */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-blue-800">22 Sections · 325 Check Items</p>
              <p className="text-xs text-blue-600 leading-relaxed">
                Covers Gangway · Bridge · Deck · Engine Room and more.
                Items with photos are automatically marked <strong>NC (Non-Conformity)</strong>.
              </p>
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
              isSubmitting
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'text-white'
            }`}
            style={isSubmitting ? undefined : { backgroundColor: '#1e3a5f' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Inspection...
              </>
            ) : (
              <>
                Start Inspection
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
