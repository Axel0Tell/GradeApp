import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rmhxczezynardogopcpr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtaHhjemV6eW5hcmRvZ29wY3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1OTE4OTEsImV4cCI6MjA2MTE2Nzg5MX0.BDKxF29WnmmsTCr9M1zCQpTPsPRostUE2pQOGd5ryg4';
export const supabase = createClient(supabaseUrl, supabaseKey);