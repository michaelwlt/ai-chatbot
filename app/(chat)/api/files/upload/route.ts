import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import { getChatById, saveAttachment } from "@/lib/db/queries";

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    // Update the file type based on the kind of files you want to accept
    .refine((file) => ["image/jpeg", "image/png"].includes(file.type), {
      message: "File type should be JPEG or PNG",
    }),
});

export async function POST(request: Request) {
  console.log("[File Upload] Starting upload process");

  try {
    const session = await auth();
    console.log("[File Upload] Session:", {
      exists: !!session,
      userId: session?.user?.id,
    });

    if (!session?.user?.id) {
      console.error("[File Upload] Unauthorized - No valid session");
      return NextResponse.json(
        { error: "Unauthorized - Invalid session" },
        { status: 401 },
      );
    }

    if (request.body === null) {
      console.error("[File Upload] Empty request body");
      return NextResponse.json(
        { error: "Request body is empty" },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as Blob;
    const chatId = formData.get("chatId") as string;

    console.log("[File Upload] Request details:", {
      hasFile: !!file,
      fileSize: file?.size,
      fileType: file?.type,
      chatId,
    });

    if (!file || !chatId) {
      console.error("[File Upload] Missing required fields:", {
        hasFile: !!file,
        hasChatId: !!chatId,
      });
      return NextResponse.json(
        { error: "File and chatId are required" },
        { status: 400 },
      );
    }

    const chat = await getChatById({ id: chatId });
    console.log("[File Upload] Chat lookup result:", {
      exists: !!chat,
      chatUserId: chat?.userId,
      requestUserId: session.user.id,
    });

    if (!chat) {
      console.error("[File Upload] Chat not found:", chatId);
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chat.userId !== session.user.id) {
      console.error("[File Upload] Unauthorized - User does not own chat:", {
        chatUserId: chat.userId,
        requestUserId: session.user.id,
      });
      return NextResponse.json(
        { error: "Unauthorized - Not chat owner" },
        { status: 401 },
      );
    }

    const validatedFile = FileSchema.safeParse({ file });
    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");
      console.error("[File Upload] File validation failed:", errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const filename = (formData.get("file") as File).name;
    const fileBuffer = await file.arrayBuffer();

    try {
      console.log("[File Upload] Uploading to blob storage:", { filename });
      const { url } = await put(`${chatId}/${filename}`, fileBuffer, {
        access: "public",
      });

      console.log("[File Upload] Saving attachment to database");
      await saveAttachment({
        chatId,
        url,
        name: filename,
        contentType: file.type,
      });

      console.log("[File Upload] Upload successful:", { url, filename });
      return NextResponse.json({
        url,
        pathname: filename,
        contentType: file.type,
      });
    } catch (error) {
      console.error("[File Upload] Upload/save failed:", error);
      return NextResponse.json(
        {
          error: "Upload failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[File Upload] Request processing failed:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
