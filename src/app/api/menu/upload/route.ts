import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase/admin';
import { updateMenuItem } from '@/lib/firebase/menu';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const itemId = formData.get('itemId') as string | null;
    const restaurantId = formData.get('restaurantId') as string | null;

    if (!file || !itemId || !restaurantId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, itemId, restaurantId' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, AVIF' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 5MB' },
        { status: 400 }
      );
    }

    const storage = getAdminStorage();
    const bucket = storage.bucket();

    // Generate a unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `menu-images/${restaurantId}/${itemId}.${ext}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const bucketFile = bucket.file(fileName);

    await bucketFile.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Make the file publicly accessible
    await bucketFile.makePublic();

    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Update the menu item's imageUrl in Firestore
    await updateMenuItem(itemId, { imageUrl });

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
