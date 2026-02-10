
-- Create posts table to track post creation workflow
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  input_text TEXT,
  input_image_url TEXT,
  generated_post TEXT,
  post_status TEXT NOT NULL DEFAULT 'draft' CHECK (post_status IN ('draft', 'post_approved', 'poster_approved', 'scheduled', 'posted')),
  poster_image_url TEXT,
  feedback TEXT,
  telegram_group_id TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- No RLS needed for now as this is a single-user tool (no auth)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (single user tool)
CREATE POLICY "Allow all access" ON public.posts FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for posters
INSERT INTO storage.buckets (id, name, public) VALUES ('posters', 'posters', true);

CREATE POLICY "Public poster access" ON storage.objects FOR SELECT USING (bucket_id = 'posters');
CREATE POLICY "Anyone can upload posters" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posters');
CREATE POLICY "Anyone can update posters" ON storage.objects FOR UPDATE USING (bucket_id = 'posters');
