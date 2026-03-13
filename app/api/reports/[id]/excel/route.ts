import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Excel 보고서 다운로드
 * TODO: 기존 lib/generateExcel.ts 로직을 서버사이드로 이식
 *       현재는 클라이언트에서 직접 생성하는 방식 유지
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
