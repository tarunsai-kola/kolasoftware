import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Or anon key

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const params = new URLSearchParams({
    select: 'id,name,is_accepting_orders,announcement_message',
    'name': 'eq.sudha',
  })
  const res = await fetch(`${baseUrl}/rest/v1/restaurants?${params.toString()}`, {
    method: 'GET',
    headers: {
      apikey: serviceKey!,
      Authorization: `Bearer ${serviceKey}`,
      Accept: 'application/json',
    }
  })
  const rows = await res.json()
  console.log('REST response:', rows)
}

main()
