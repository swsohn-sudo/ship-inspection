import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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

  // 점검 세션 로드 (소유권 확인)
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

  // 22개 섹션 + 325개 항목은 정적 마스터 데이터에서 직접 사용 (DB 조회 불필요)
  const sections = MASTER_SECTIONS;

  // 기존 점검 결과 로드 (Firestore 서브컬렉션)
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
