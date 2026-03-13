import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest } from 'next/server';

// GET /api/inspections — 로그인 사용자의 점검 목록 (최근 30건)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const snap = await db
    .collection('inspections')
    .where('userEmail', '==', session.user.email)
    .orderBy('createdAt', 'desc')
    .limit(30)
    .get();

  const inspections = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id:             doc.id,
      shipName:       data.shipName,
      inspectionDate: data.inspectionDate,
      inspector:      data.inspector,
      status:         data.status,
      createdAt:      data.createdAt?.toDate().toISOString() ?? null,
      // 대시보드 호환: NC 개수를 기존 _count.results 형식으로 반환
      _count: { results: data.ncCount ?? 0 },
    };
  });

  return Response.json(inspections);
}

// POST /api/inspections — 새 점검 생성
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { shipName, inspectionDate, inspector } = await req.json();
  if (!shipName || !inspectionDate || !inspector)
    return Response.json({ error: 'Missing required fields' }, { status: 400 });

  const ref = await db.collection('inspections').add({
    shipName:       shipName.trim(),
    inspectionDate, // YYYY-MM-DD 문자열 그대로 저장
    inspector:      inspector.trim(),
    status:         'IN_PROGRESS',
    userEmail:      session.user.email,
    ncCount:        0,
    createdAt:      FieldValue.serverTimestamp(),
    updatedAt:      FieldValue.serverTimestamp(),
  });

  return Response.json(
    { id: ref.id, shipName, inspectionDate, inspector, status: 'IN_PROGRESS' },
    { status: 201 }
  );
}
