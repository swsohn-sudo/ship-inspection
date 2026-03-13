import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { dataUrl } = (await req.json()) as { dataUrl: string };
    if (!dataUrl?.startsWith('data:image/'))
      return Response.json({ error: 'Invalid image data' }, { status: 400 });

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: 'ship-inspection',
    });

    return Response.json({ url: result.secure_url, publicId: result.public_id });

  } catch (err: any) {
    console.error('Cloudinary upload error:', err);
    return Response.json({ error: err.message ?? 'Upload failed' }, { status: 500 });
  }
}
