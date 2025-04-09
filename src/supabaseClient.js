import { createClient } from '@supabase/supabase-js'

// Substitua com os dados do seu projeto Supabase:
const supabaseUrl = 'https://sipbdfhrvxdmrbzafgka.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcGJkZmhydnhkbXJiemFmZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MDM3MDMsImV4cCI6MjA1OTE3OTcwM30.atnZ1E4pEVvGWV1fP4jt2TSDaVmt6nCxNfrD5IrBGdI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
