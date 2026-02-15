import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';
import { validateFile } from '@/lib/cloudinary';
import { fileToBase64DataUrl, MAX_IMAGE_SIZE_BYTES } from '@/lib/imageStorage';

export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          { error: 'File is required' },
          { status: 400 }
        );
      }

      const hotel = await prisma.hotels.findFirst({
        where: { ownerId: user.userId },
      });

      if (!hotel) {
        return NextResponse.json(
          { error: 'Hotel not found' },
          { status: 404 }
        );
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const validation = validateFile(file, {
        allowedTypes,
        maxSize: MAX_IMAGE_SIZE_BYTES,
      });

      if (!validation.isValid) {
        const message = (validation.error || '').includes('0MB')
          ? 'Image must be under 500KB for database storage.'
          : validation.error;
        return NextResponse.json(
          { error: message },
          { status: 400 }
        );
      }

      const dataUrl = await fileToBase64DataUrl(file);

      await prisma.hotels.update({
        where: { id: hotel.id },
        data: {
          logo: dataUrl,
          logoPublicId: null,
        },
      });

      return NextResponse.json({
        logoUrl: dataUrl,
        publicId: null,
      });
    } catch (error: any) {
      console.error('Hotel logo upload error:', error);
      const msg = error?.message || '';
      if (msg.includes('under') && msg.includes('KB')) {
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      return NextResponse.json(
        { error: 'Failed to upload hotel logo' },
        { status: 500 }
      );
    }
  });
}
