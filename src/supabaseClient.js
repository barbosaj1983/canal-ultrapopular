import { createClient } from '@supabase/supabase-js'

// Substitua com os dados do seu projeto Supabase:
const supabaseUrl = 'https://gkpbtquuovubbrlrjzti.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrcGJ0cXV1b3Z1YmJybHJqenRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODE5MjEsImV4cCI6MjA4OTM1NzkyMX0.NHbDRivxmBLgEGCQ-_roSNhliD6f47KvfWywTuLUHjk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
