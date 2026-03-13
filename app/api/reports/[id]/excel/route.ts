import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Excel ë³´ê³ ???¤ìš´ë¡œë“œ
 * TODO: ê¸°ì¡´ lib/generateExcel.ts ë¡œì§???œë²„?¬ì´?œë¡œ ?´ì‹
 *       ?„ì¬???´ë¼?´ì–¸?¸ì—??ì§ì ‘ ?ì„±?˜ëŠ” ë°©ì‹ ? ì?
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const inspection = await prisma.inspection.findFirst({
    where: { id: params.id, userEmail: session.user.email },
    include: {
      results: {
        include: { item: { include: { section: true } } },
        orderBy: { item: { order: 'asc' } },
      },
    },
  });

  if (!inspection)
    return Response.json({ error: 'Not found' }, { status: 404 });

  // TODO: implement ExcelJS generation
  return Response.json(
    { message: 'Excel generation not yet implemented server-side. Use client-side export button.', id: params.id },
    { status: 501 }
  );
}
