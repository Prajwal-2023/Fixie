// Browser console test - paste this in your browser console at http://localhost:8080

// Test direct connection
fetch('https://lsgdmlyzrofmwxajdiig.supabase.co/rest/v1/tickets?select=*&limit=1', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZ2RtbHl6cm9mbXd4YWpkaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzY0MDEsImV4cCI6MjA3NDk1MjQwMX0.03L3bnVMchUJK2VQDKuFHAzKd-qdzLefu0kZ2N_h76s',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZ2RtbHl6cm9mbXd4YWpkaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzY0MDEsImV4cCI6MjA3NDk1MjQwMX0.03L3bnVMchUJK2VQDKuFHAzKd-qdzLefu0kZ2N_h76s'
  }
})
.then(response => {
  console.log('✅ Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('✅ Response data:', data);
})
.catch(error => {
  console.error('❌ Fetch error:', error);
});
