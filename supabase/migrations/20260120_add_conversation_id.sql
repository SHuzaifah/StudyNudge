-- Migration to add conversation_id to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id uuid;

-- Optional: Create an index for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- Optional: Logic to backfill existing messages (Uncomment if needed)
-- This puts all old messages into a single "Legacy" conversation
-- UPDATE public.messages SET conversation_id = '00000000-0000-0000-0000-000000000000' WHERE conversation_id IS NULL;
