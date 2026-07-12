export const config = {
  runtime: 'edge',
};

const FAMPAY_API_KEY = 'fmpay_c0deedbc77d3d29dfbac858498bfd10d262a48a2';
const FAMPAY_BASE_URL = 'https://py.freepanel.in';

export default async function handler(req: Request) {
  // Enable CORS
  const corsHeaders = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(req.url);
    const upi = url.searchParams.get('upi');
    const amount = url.searchParams.get('amount');

    if (!upi || !amount) {
      return new Response(JSON.stringify({ error: 'Missing required parameters: upi and amount' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const famPayUrl = `${FAMPAY_BASE_URL}/qr?api_key=${FAMPAY_API_KEY}&upi=${encodeURIComponent(upi)}&amount=${amount}`;

    const response = await fetch(famPayUrl);
    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify(data), { 
        status: response.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('FamPay QR Proxy Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
