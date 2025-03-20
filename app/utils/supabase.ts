import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://reizphewyhtrezuxzwuf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlaXpwaGV3eWh0cmV6dXh6d3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3MDk4NzEsImV4cCI6MjA1NjI4NTg3MX0.Ncl5y5N9Z_IDAnoa1H2ORMyPI5XdP7IZ3Qbrj_9XHVg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 