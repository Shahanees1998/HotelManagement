import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary, validateFile } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          { error: 'File is required' },
          { status: 400 }
        );
      }

      // Get user's hotel
      const hotel = await prisma.hotels.findFirst({
        where: {
          ownerId: user.userId
        }
      });

      if (!hotel) {
        return NextResponse.json(
          { error: 'Hotel not found' },
          { status: 404 }
        );
      }

      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const validation = validateFile(file, {
        allowedTypes,
        maxSize: 5 * 1024 * 1024 // 5MB
      });

      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      // Upload image to Cloudinary with optimization
      const cloudinaryResult = await uploadToCloudinary(file, {
        folder: 'hotel-management/hotel-logos',
        resource_type: 'image',
        transformation: [
          { width: 300, height: 300, crop: 'fill', gravity: 'center' },
          { quality: 'auto', fetch_format: 'auto' }
        ],
        max_bytes: 5 * 1024 * 1024 // 5MB
      });

      // Update hotel's logo in database
      await prisma.hotels.update({
        where: { id: hotel.id },
        data: { 
          logo: cloudinaryResult.secure_url,
          logoPublicId: cloudinaryResult.public_id
        },
      });

      return NextResponse.json({ 
        logoUrl: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id
      });
    } catch (error) {
      console.error('Hotel logo upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload hotel logo' },
        { status: 500 }
      );
    }
  });
}
