import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest } from 'next/server';

// GET /api/inspections ??嚥≪뮄???????癒?벥 ?癒? 筌뤴뫖以?(筌ㅼ뮄??30椰?
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
      // ????뺣궖???紐낆넎: NC 揶쏆뮇?붺몴?疫꿸퀣??_count.results ?類ㅻ뻼??곗쨮 獄쏆꼹??
      _count: { results: data.ncCount ?? 0 },
    };
  });

  return Response.json(inspections);
}

// POST /api/inspections ?????癒? ??밴쉐
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { shipName, inspectionDate, inspector } = await req.json();
  if (!shipName || !inspectionDate || !inspector)
    return Response.json({ error: 'Missing required fields' }, { status: 400 });

  const ref = await db.collection('inspections').add({
    shipName:       shipName.trim(),
    inspectionDate, // YYYY-MM-DD ?얜챷???域밸챶?嚥?????
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
