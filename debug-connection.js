// Debug Supabase connection
console.log('🔍 Debugging Supabase Connection...');

// Check if we can reach the URL
const url = 'https://lsgdmlyzrofmwxajdiig.supabase.co';
console.log('Testing URL:', url);

fetch(url + '/rest/v1/')
  .then(response => {
    console.log('✅ URL accessible, status:', response.status);
    return response.text();
  })
  .then(text => {
    console.log('Response preview:', text.substring(0, 100));
  })
  .catch(error => {
    console.error('❌ URL not accessible:', error.message);
  });
