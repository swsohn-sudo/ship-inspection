import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

// GET /api/inspections/[id] — 점검 상세 + 결과 목록
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const docRef = db.collection('inspections').doc(params.id);
  const doc = await docRef.get();

  if (!doc.exists || doc.data()?.userEmail !== session.user.email)
    return Response.json({ error: 'Not found' }, { status: 404 });

  const resultsSnap = await docRef.collection('results').get();
  const results = resultsSnap.docs.map((r) => ({ id: r.id, ...r.data() }));

  return Response.json({ id: doc.id, ...doc.data(), results });
}

// PATCH /api/inspections/[id] — 상태 업데이트 (status 필드만 허용)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const docRef = db.collection('inspections').doc(params.id);
  const doc = await docRef.get();

  if (!doc.exists || doc.data()?.userEmail !== session.user.email)
    return Response.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  if (body.status) {
    await docRef.update({
      status:    body.status,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return Response.json({ ok: true });
}
