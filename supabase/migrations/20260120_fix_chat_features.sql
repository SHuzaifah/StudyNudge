-- 1. Add conversation_id column if it doesn't exist
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id uuid;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- 3. Enable Delete Policy for Users
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Enable Update Policy for Users (in case we want to edit messages later)
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = user_id);
