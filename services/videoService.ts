import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  doc,
  updateDoc,
  increment,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { InfluencerVideo } from '@/lib/types';

export const uploadVideoToCloudinary = async (
  videoFile: File,
  thumbnailFile?: File
): Promise<{ videoUrl: string; thumbnailUrl?: string }> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'vendor_products';

  if (!cloudName) {
    throw new Error('Cloudinary cloud name not configured');
  }

  // Upload video
  const videoFormData = new FormData();
  videoFormData.append('file', videoFile);
  videoFormData.append('upload_preset', uploadPreset);
  videoFormData.append('folder', 'vendor-videos');
  videoFormData.append('resource_type', 'video');

  const videoResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    {
      method: 'POST',
      body: videoFormData,
    }
  );

  if (!videoResponse.ok) {
    throw new Error('Failed to upload video to Cloudinary');
  }

  const videoData = await videoResponse.json();
  let thumbnailUrl: string | undefined;

  // Upload thumbnail if provided
  if (thumbnailFile) {
    const thumbnailFormData = new FormData();
    thumbnailFormData.append('file', thumbnailFile);
    thumbnailFormData.append('upload_preset', uploadPreset);
    thumbnailFormData.append('folder', 'vendor-video-thumbnails');

    const thumbnailResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: thumbnailFormData,
      }
    );

    if (thumbnailResponse.ok) {
      const thumbnailData = await thumbnailResponse.json();
      thumbnailUrl = thumbnailData.secure_url;
    }
  }

  return {
    videoUrl: videoData.secure_url,
    thumbnailUrl
  };
};

export const createInfluencerVideo = async (
  vendorId: string,
  productId: string,
  productName: string,
  videoUrl: string,
  title: string,
  thumbnailUrl?: string
): Promise<string> => {
  try {
    const videoData = {
      vendorId,
      productId,
      productName,
      videoUrl,
      thumbnail: thumbnailUrl || null,
      title,
      views: 0,
      status: 'pending' as const,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    console.log('Creating video with data:', videoData);
    const docRef = await addDoc(collection(db, 'influencerVideos'), videoData);
    console.log('Video created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating video:', error);
    throw new Error(error.message || 'Failed to create video');
  }
};

export const getVendorVideos = async (vendorId: string): Promise<InfluencerVideo[]> => {
  try {
    const q = query(
      collection(db, 'influencerVideos'),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as InfluencerVideo[];
  } catch (error: any) {
    console.error('Error fetching vendor videos:', error);
    // If it's a permission error, return empty array instead of throwing
    if (error.code === 'permission-denied') {
      console.warn('Permission denied for vendor videos, returning empty array');
      return [];
    }
    throw new Error(error.message || 'Failed to fetch videos');
  }
};

export const updateVideoViews = async (videoId: string): Promise<void> => {
  const videoRef = doc(db, 'influencerVideos', videoId);
  await updateDoc(videoRef, {
    views: increment(1)
  });
};

export const getApprovedVideos = async (limitCount: number = 10): Promise<InfluencerVideo[]> => {
  const q = query(
    collection(db, 'influencerVideos'),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date()
  })) as InfluencerVideo[];
};