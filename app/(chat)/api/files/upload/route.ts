import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';

// Initialize S3 client for R2
const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'File size should be less than 5MB',
    })
    // Update the file type based on the kind of files you want to accept
    .refine((file) => ['image/jpeg', 'image/png'].includes(file.type), {
      message: 'File type should be JPEG or PNG',
    }),
});

const MAX_STORAGE_LIMIT = (parseInt(process.env.STORAGE_LIMIT_R2|| '1') * 1024 * 1024 * 1024); // Convert GB to bytes

async function getCurrentBucketSize() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
    });
    
    let totalSize = 0;
    let isTruncated = true;
    let continuationToken = undefined;
    
    while (isTruncated) {
      const response = await S3.send(command);
      response.Contents?.forEach(item => {
        totalSize += item.Size || 0;
      });
      
      isTruncated = response.IsTruncated || false;
      continuationToken = response.NextContinuationToken;
      
      if (continuationToken) {
        command.input.ContinuationToken = continuationToken;
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Error getting bucket size:', error);
    throw error;
  }
}

function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const currentSize = await getCurrentBucketSize();
    
    if (currentSize + fileBuffer.byteLength > MAX_STORAGE_LIMIT) {
      return NextResponse.json(
        { error: 'Storage limit exceeded' },
        { status: 400 }
      );
    }

    // Get filename from formData since Blob doesn't have name property
    const originalFilename = (formData.get('file') as File).name;
    const uniqueFilename = generateUniqueFileName(originalFilename);
    
    try {
      // Upload to R2 with unique filename
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: uniqueFilename,
        Body: Buffer.from(fileBuffer),
        ContentType: file.type,
        Metadata: {
          originalName: originalFilename // Store original filename as metadata
        }
      });

      await S3.send(uploadCommand);

      // Return the public URL with unique filename
      const fileUrl = `https://${process.env.R2_PUBLIC_DOMAIN}/${uniqueFilename}`;
      
      return NextResponse.json({
        url: fileUrl,
        pathname: uniqueFilename,
        originalName: originalFilename,
        contentType: file.type
      });
    } catch (error) {
      console.error('R2 upload error:', error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}
