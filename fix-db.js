const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log('Fetching menu items...');
  const { data, error } = await supabase.from('menu_items').select('id, name, addon_groups');
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  for (const item of data) {
    if (item.addon_groups && item.addon_groups.length > 0) {
      let changed = false;
      const newGroups = item.addon_groups.map(g => {
        if (g.max_selections === 1) {
          changed = true;
          return { ...g, max_selections: null };
        }
        return g;
      });
      
      if (changed) {
        console.log(`Updating ${item.name}...`);
        await supabase.from('menu_items').update({ addon_groups: newGroups }).eq('id', item.id);
      }
    }
  }
  console.log('Done!');
}

fix();
