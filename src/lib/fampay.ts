// Use '/api' prefix for both development (via Vite proxy) and production (via Vercel functions)
const getBaseUrl = () => {
  return '/api';
};

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
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/fampay-qr?upi=${encodeURIComponent(upiId)}&amount=${amount}`;

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
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/fampay-verify?order_id=${encodeURIComponent(orderId)}`;

  console.log('FamPay Verify Request URL:', url);

  try {
    const response = await fetch(url);
    console.log('FamPay Verify Response Status:', response.status);

    const data = await response.json();
    console.log('FamPay Verify Response Data:', data);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    console.error('FamPay Verify API Error:', error);
    throw error;
  }
}
