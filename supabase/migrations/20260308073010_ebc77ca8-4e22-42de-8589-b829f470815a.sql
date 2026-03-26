INSERT INTO storage.buckets (id, name, public) VALUES ('watermarks', 'watermarks', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can view watermarks" ON storage.objects FOR SELECT USING (bucket_id = 'watermarks');
CREATE POLICY "Admins can upload watermarks" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'watermarks' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete watermarks" ON storage.objects FOR DELETE USING (bucket_id = 'watermarks' AND public.has_role(auth.uid(), 'admin'));