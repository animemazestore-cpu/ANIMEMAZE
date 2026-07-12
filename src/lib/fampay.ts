const FAMPAY_API_KEY = 'fmpay_c0deedbc77d3d29dfbac858498bfd10d262a48a2';
const FAMPAY_BASE_URL = 'https://py.freepanel.in';

export interface FamPayOrderResponse {
  status: string;
  data: {
    order_id: string;
    qr_url: string;
    upi_id: string;
    amount: string;
    created_at_ist: string;
    expires_at_ist: string;
  };
}

export interface FamPayVerifyResponse {
  status: string;
  data?: {
    order_id: string;
    transaction_id: string;
    amount: number;
    utr: string;
    sender_name: string;
    payment_time_ist: string;
  };
  message?: string;
}

export async function createFamPayOrder(upiId: string, amount: number): Promise<FamPayOrderResponse> {
  const url = `${FAMPAY_BASE_URL}/qr?api_key=${FAMPAY_API_KEY}&upi=${encodeURIComponent(upiId)}&amount=${amount}`;
  
  console.log('FamPay API Request URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('FamPay API Response Status:', response.status);
    
    const data = await response.json();
    console.log('FamPay API Response Data:', data);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(data)}`);
    }
    
    return data;
  } catch (error) {
    console.error('FamPay API Error:', error);
    throw error;
  }
}

export async function verifyFamPayOrder(orderId: string): Promise<FamPayVerifyResponse> {
  const url = `${FAMPAY_BASE_URL}/verify_order?api_key=${FAMPAY_API_KEY}&order_id=${encodeURIComponent(orderId)}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return data;
}
