import { auth } from "@/app/(auth)/auth";
import { getAttachmentsByChatId } from "@/lib/db/queries";

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new Response("Chat ID is required", { status: 400 });
  }

  try {
    const attachments = await getAttachmentsByChatId({ chatId });
    return Response.json(attachments);
  } catch (error) {
    console.error("Failed to get attachments:", error);
    return new Response("Failed to get attachments", { status: 500 });
  }
} 