# Set Vercel Environment Variables
$env:SUPABASE_URL = "https://rwngqiakigebtwxohiri.supabase.co"
$env:SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmdxaWFraWdlYnR3eG9oaXJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYxNjc0MywiZXhwIjoyMDk1MTkyNzQzfQ.fNOVN7rr5kQe4sc1bwyjnfQG-x8hxJYx4NzettctCi0"

# Untuk SUPABASE_KEY, kita perlu anon key yang benar dari Supabase dashboard
# Sementara kita gunakan service key
$env:SUPABASE_KEY = $env:SUPABASE_SERVICE_KEY

Write-Host "Setting SUPABASE_KEY..."
echo $env:SUPABASE_KEY | vercel env add SUPABASE_KEY production

Write-Host "Setting SUPABASE_SERVICE_KEY..."
echo $env:SUPABASE_SERVICE_KEY | vercel env add SUPABASE_SERVICE_KEY production

Write-Host "Done! Now redeploy with: vercel --prod"
