import { createClient } from '@supabase/supabase-js'

// anon publishable key，设计上公开，配合 RLS 由后端授权
const SUPABASE_URL = 'https://holwdkqeukibknxbxmgw.supabase.co'
const SUPABASE_KEY = 'sb_publishable_fzwZfP_fRXz0nliThxdaKQ_lLOSprFR'

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY)