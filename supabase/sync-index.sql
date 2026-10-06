-- Jalankan sekali di Supabase Dashboard > SQL Editor.
-- Membantu query baca/hapus berdasarkan user_id dan urutan id saat sinkronisasi.
-- Index ini tidak menghapus data dan aman dijalankan ulang.
create index if not exists laporan_pkl_user_id_id_idx
    on public.laporan_pkl using btree (user_id, id);

analyze public.laporan_pkl;
