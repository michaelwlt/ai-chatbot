CREATE TABLE IF NOT EXISTS "Attachment" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
    "chatId" uuid NOT NULL,
    "messageId" uuid,
    "url" text NOT NULL,
    "name" text NOT NULL,
    "contentType" text NOT NULL,
    "createdAt" timestamp NOT NULL,
    CONSTRAINT "Attachment_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat" ("id") ON DELETE CASCADE,
    CONSTRAINT "Attachment_messageId_Message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message" ("id") ON DELETE SET NULL
);

CREATE INDEX "Attachment_chatId_idx" ON "Attachment" ("chatId");
