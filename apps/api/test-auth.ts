async function main() {
  const loginRes = await fetch('http://localhost:3001/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'marketing@hassad.com', password: 'password123' })
  });
  
  if (!loginRes.ok) {
    console.error('Login failed:', await loginRes.text());
    return;
  }
  
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;
  
  console.log('Logged in successfully');
  
  const campRes = await fetch('http://localhost:3001/v1/campaigns/a6e02bbf-6a39-490c-b795-ad6832d93f9b', {
    headers: { 'Cookie': `token=${token}` }
  });
  
  console.log('Campaign status:', campRes.status);
  console.log('Campaign response:', await campRes.text());
}
main();
