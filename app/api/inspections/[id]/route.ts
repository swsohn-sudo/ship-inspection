import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

// GET /api/inspections/[id] ???먭? ?곸꽭 + 寃곌낵 紐⑸줉
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

// PATCH /api/inspections/[id] ???곹깭 ?낅뜲?댄듃 (status ?꾨뱶留??덉슜)
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
// DELETE /api/inspections/[id] 점검표 삭제
export async function DELETE(
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

  // 하위 컬렉션(results) 먼저 삭제
  const resultsSnap = await docRef.collection('results').get();
  const batch = db.batch();
  resultsSnap.docs.forEach((r) => batch.delete(r.ref));
  await batch.commit();

  // 본 문서 삭제
  await docRef.delete();

  return Response.json({ ok: true });
}