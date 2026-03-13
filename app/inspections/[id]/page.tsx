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

  // ?먭? ?몄뀡 濡쒕뱶 (?뚯쑀沅??뺤씤)
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

  // 22媛??뱀뀡 + 325媛???ぉ? ?뺤쟻 留덉뒪???곗씠?곗뿉??吏곸젒 ?ъ슜 (DB 議고쉶 遺덊븘??
  const sections = MASTER_SECTIONS;

  // 湲곗〈 ?먭? 寃곌낵 濡쒕뱶 (Firestore ?쒕툕而щ젆??
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
