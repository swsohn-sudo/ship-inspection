import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

// GET /api/inspections/[id] ???ê? ?ì„¸ + ê²°ê³¼ ëª©ë¡
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

// PATCH /api/inspections/[id] ???íƒœ ?…ë°?´íŠ¸ (status ?„ë“œë§??ˆìš©)
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
