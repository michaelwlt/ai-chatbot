"use server";

import { type CoreUserMessage, generateText } from "ai";
import { cookies } from "next/headers";
import { auth } from "@/app/(auth)/auth";
import { saveChat } from "@/lib/db/queries";

export async function saveModelId(model: string) {
  console.log("Saving model ID:", model);
  const cookieStore = await cookies();
  cookieStore.set("model-id", model);
  console.log("Model ID saved successfully");
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: CoreUserMessage;
}) {
  console.log("Generating title from message:", message);
  try {
    const { text: title } = await generateText({
      model: customModel("gemini-1.5-flash-8b"),
      system: `\n
      - you will generate a short title based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long
      - the title should be a summary of the user's message
      - do not use quotes or colons`,
      prompt: JSON.stringify(message),
    });
    console.log("Generated title:", title);
    return title;
  } catch (error) {
    console.error("Error generating title:", error);
    throw error;
  }
}

export async function createChat({
  id,
  title = "New Chat",
}: {
  id: string;
  title?: string;
}) {
  console.log("Creating chat:", { id, title });

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    await saveChat({
      id,
      userId: session.user.id,
      title,
    });
    console.log("Chat created successfully");
  } catch (error) {
    console.error("Failed to create chat:", error);
    throw error;
  }
}
