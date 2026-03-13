import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { MASTER_ITEM_MAP } from '@/lib/masterData';

// ?Œìœ ê¶??•ì¸ ?¬í¼
async function verifyOwnership(inspectionId: string, userEmail: string) {
  const doc = await db.collection('inspections').doc(inspectionId).get();
  if (!doc.exists || doc.data()?.userEmail !== userEmail) return null;
  return doc;
}

// PATCH: photo ?ëŠ” comments ?€??(upsert)
// photo ?ˆìŒ ??NC / null ??OK
// ncCount ?„ë“œë¥?Firestore ?¸ëžœ??…˜?¼ë¡œ ?ìž??ê°±ì‹ 
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const inspDoc = await verifyOwnership(params.id, session.user.email);
  if (!inspDoc)
    return Response.json({ error: 'Not found' }, { status: 404 });

  const { photo, comments } = await req.json();
  const newPhoto = photo ?? null;

  const inspRef  = db.collection('inspections').doc(params.id);
  const resultRef = inspRef.collection('results').doc(params.itemId);

  // ë§ˆìŠ¤???°ì´?°ì—??sectionNo, sortOrder ì¡°íšŒ (?•ë ¬ ë³´ìž¥)
  const master = MASTER_ITEM_MAP.get(params.itemId);

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(resultRef);
    const hadPhoto = existing.exists ? Boolean(existing.data()?.photo) : false;
    const hasPhoto = Boolean(newPhoto);

    // NC ì¹´ìš´??ì¦ê°
    const ncDelta = (!hadPhoto && hasPhoto) ? 1 : (hadPhoto && !hasPhoto) ? -1 : 0;

    tx.set(resultRef, {
      photo:     newPhoto,
      comments:  comments ?? '',
      itemId:    params.itemId,
      itemNo:    master?.itemNo ?? params.itemId,
      sectionNo: master?.sectionNo ?? 0,
      sortOrder: master?.order ?? 0,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    }, { merge: true });

    if (ncDelta !== 0) {
      tx.update(inspRef, {
        ncCount:   FieldValue.increment(ncDelta),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  return Response.json({ ok: true });
}

// DELETE: ê²°ê³¼ ?? œ (??ª©??OK ?íƒœë¡?ë³µì›)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const inspDoc = await verifyOwnership(params.id, session.user.email);
  if (!inspDoc)
    return Response.json({ error: 'Not found' }, { status: 404 });

  const inspRef   = db.collection('inspections').doc(params.id);
  const resultRef = inspRef.collection('results').doc(params.itemId);

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(resultRef);
    if (!existing.exists) return;

    const hadPhoto = Boolean(existing.data()?.photo);
    tx.delete(resultRef);

    if (hadPhoto) {
      tx.update(inspRef, {
        ncCount:   FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  return Response.json({ ok: true });
}
