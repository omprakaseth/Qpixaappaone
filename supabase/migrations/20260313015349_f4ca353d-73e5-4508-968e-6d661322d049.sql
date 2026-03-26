
DROP POLICY IF EXISTS "Authenticated users can upload prompt images" ON storage.objects;

CREATE POLICY "Authenticated users can upload own prompt images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prompt-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can update own prompt images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prompt-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'prompt-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
