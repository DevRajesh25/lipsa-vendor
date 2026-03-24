import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) {
      return NextResponse.json({
        configured: false,
        error: 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME not set'
      });
    }

    if (!uploadPreset) {
      return NextResponse.json({
        configured: false,
        error: 'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET not set'
      });
    }

    // Test if the upload preset exists by making a request to Cloudinary
    const testUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload_presets/${uploadPreset}`;
    
    try {
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString('base64')}`
        }
      });

      if (response.ok) {
        const presetData = await response.json();
        return NextResponse.json({
          configured: true,
          cloudName,
          uploadPreset,
          presetExists: true,
          presetData: {
            name: presetData.name,
            unsigned: presetData.unsigned,
            settings: presetData.settings
          }
        });
      } else {
        return NextResponse.json({
          configured: true,
          cloudName,
          uploadPreset,
          presetExists: false,
          error: `Upload preset '${uploadPreset}' not found`
        });
      }
    } catch (presetError) {
      // If we can't check the preset, still return basic config info
      return NextResponse.json({
        configured: true,
        cloudName,
        uploadPreset,
        presetExists: 'unknown',
        note: 'Could not verify preset existence (API credentials may be missing)'
      });
    }

  } catch (error: any) {
    return NextResponse.json({
      configured: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return NextResponse.json({ 
        error: 'Cloudinary not configured properly' 
      }, { status: 500 });
    }

    // Test upload to Cloudinary
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('upload_preset', uploadPreset);
    uploadFormData.append('folder', 'test-uploads');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: uploadFormData,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json({
        success: false,
        error: errorData,
        status: response.status
      }, { status: 400 });
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      url: data.secure_url,
      publicId: data.public_id
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}