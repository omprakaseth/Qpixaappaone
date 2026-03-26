
-- Create storage bucket for prompt preview images
INSERT INTO storage.buckets (id, name, public)
VALUES ('prompt-images', 'prompt-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload prompt images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'prompt-images');

-- Allow anyone to view prompt images (public bucket)
CREATE POLICY "Anyone can view prompt images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'prompt-images');

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete own prompt images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'prompt-images' AND (storage.foldername(name))[1] = auth.uid()::text);
