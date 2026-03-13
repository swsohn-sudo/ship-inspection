import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * PDF 보고서 다운로드
 * TODO: 기존 lib/generatePdf.ts (html2canvas + jsPDF) 로직 서버사이드 이식
 *       또는 Puppeteer/Playwright 방식으로 변경
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
