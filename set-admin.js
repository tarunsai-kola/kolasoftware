const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setAdmin() {
  // Get all users
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError || !users?.users?.length) {
    console.log('No users found in Authentication. Please create one in Supabase dashboard first!');
    return;
  }
  
  // Pick the first user (the one they just created)
  const firstUser = users.users[0];
  console.log(`Found user: ${firstUser.email} (ID: ${firstUser.id})`);

  // Insert into super_admins table
  const { error: insertError } = await supabase
    .from('super_admins')
    .upsert({ id: firstUser.id })
    .select();

  if (insertError) {
    console.error('Failed to make user super admin:', insertError.message);
  } else {
    console.log(`✅ Successfully made ${firstUser.email} a Super Admin!`);
  }
}

setAdmin();
