import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { MASTER_ITEM_MAP } from '@/lib/masterData';

// 소유권 확인 헬퍼
async function verifyOwnership(inspectionId: string, userEmail: string) {
  const doc = await db.collection('inspections').doc(inspectionId).get();
  if (!doc.exists || doc.data()?.userEmail !== userEmail) return null;
  return doc;
}

// PATCH: photo 또는 comments 저장 (upsert)
// photo 있음 → NC / null → OK
// ncCount 필드를 Firestore 트랜잭션으로 원자적 갱신
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

  // 마스터 데이터에서 sectionNo, sortOrder 조회 (정렬 보장)
  const master = MASTER_ITEM_MAP.get(params.itemId);

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(resultRef);
    const hadPhoto = existing.exists ? Boolean(existing.data()?.photo) : false;
    const hasPhoto = Boolean(newPhoto);

    // NC 카운트 증감
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

// DELETE: 결과 삭제 (항목을 OK 상태로 복원)
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
