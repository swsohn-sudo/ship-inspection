import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { MASTER_SECTIONS } from '@/lib/masterData';
import { notFound, redirect } from 'next/navigation';
import InspectionClient from './InspectionClient';

export default async function InspectionPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/');

  // ?ê? ?¸ì…˜ ë¡œë“œ (?Œìœ ê¶??•ì¸)
  const docRef = db.collection('inspections').doc(params.id);
  const doc    = await docRef.get();

  if (!doc.exists || doc.data()?.userEmail !== session.user.email) notFound();

  const data = doc.data()!;
  const inspection = {
    id:             doc.id,
    shipName:       data.shipName,
    inspectionDate: data.inspectionDate,
    inspector:      data.inspector,
    status:         data.status,
  };

  // 22ê°??¹ì…˜ + 325ê°???ª©?€ ?•ì  ë§ˆìŠ¤???°ì´?°ì—??ì§ì ‘ ?¬ìš© (DB ì¡°íšŒ ë¶ˆí•„??
  const sections = MASTER_SECTIONS;

  // ê¸°ì¡´ ?ê? ê²°ê³¼ ë¡œë“œ (Firestore ?œë¸Œì»¬ë ‰??
  const resultsSnap = await docRef.collection('results').get();
  const results = resultsSnap.docs.map((r) => {
    const d = r.data();
    return {
      id:       r.id,
      itemId:   r.id, // Firestore doc ID = itemId
      photo:    d.photo ?? null,
      comments: d.comments ?? '',
    };
  });

  return (
    <InspectionClient
      inspection={inspection}
      sections={sections}
      initialResults={results}
    />
  );
}
