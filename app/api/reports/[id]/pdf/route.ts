import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * PDF 蹂닿퀬???ㅼ슫濡쒕뱶
 * TODO: 湲곗〈 lib/generatePdf.ts (html2canvas + jsPDF) 濡쒖쭅 ?쒕쾭?ъ씠???댁떇
 *       ?먮뒗 Puppeteer/Playwright 諛⑹떇?쇰줈 蹂寃?
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
    select: { id: true, shipName: true, inspectionDate: true, inspector: true },
  });

  if (!inspection)
    return Response.json({ error: 'Not found' }, { status: 404 });

  // TODO: implement PDF generation
  return Response.json(
    { message: 'PDF generation not yet implemented server-side. Use client-side export button.', id: params.id },
    { status: 501 }
  );
}
