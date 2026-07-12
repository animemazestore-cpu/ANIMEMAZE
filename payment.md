API Documentation
Integrate our FamPay Payment Verification API into your apps, bots, and websites.

Important: To use the API, you must first register an account and connect your FamPay Gmail in the Dashboard to get your api_key.
1. Create Order & Generate QR
Generate a dynamic QR code for a specific UPI ID and amount.

GET /qr?api_key=YOUR_API_KEY&upi=fampay@id&amount=10
Response:

{ "status": "success", "data": { "order_id": "FAMPAY20240709...", "qr_url": "https://api.qrserver.com/...", "upi_id": "fampay@id", "amount": "10", "created_at_ist": "09-07-2026 10:00:00", "expires_at_ist": "09-07-2026 10:05:00" } }
2. Verify Payment
Check the status of an order. The API automatically polls your Gmail inbox to verify if the payment was received.

GET /verify_order?api_key=YOUR_API_KEY&order_id=FAMPAY20240709...
Response (Success):

{ "status": "success", "data": { "order_id": "FAMPAY20240709...", "transaction_id": "FMPXXXXXXX", "amount": 10.0, "utr": "123456789012", "sender_name": "FamPay User", "payment_time_ist": "09-07-2026 10:02:15" } }
Integration Examples
You can use the built-in Checkout page by redirecting users to:

https://py.freepanel.in/pay.php?api_key=YOUR_API_KEY&amount=50
Custom PHP Checkout Page
If you want to host your own checkout page, you can use the following PHP snippet:


<?php
// --- CONFIGURATION ---
define('API_KEY', 'YOUR_API_KEY');
define('BASE_URL', 'https://py.freepanel.in');
define('RECEIVER_UPI', 'demo123@fam'); // Replace with your UPI
define('AMOUNT', '10');

// Handle AJAX Request for verification
if (isset($_GET['action']) && $_GET['action'] == 'verify' && isset($_GET['order_id'])) {
    header('Content-Type: application/json');
    $order_id = urlencode($_GET['order_id']);
    
    $verify_url = BASE_URL . "/verify_order?api_key=" . API_KEY . "&order_id=" . $order_id;
    $response = @file_get_contents($verify_url);
    
    echo $response ? $response : json_encode(['status' => 'error', 'message' => 'API Error']);
    exit;
}

// Create Order & Generate QR
$qr_url = ""; $order_id = ""; $error_msg = "";
$create_url = BASE_URL . "/qr?api_key=" . API_KEY . "&upi=" . urlencode(RECEIVER_UPI) . "&amount=" . AMOUNT;
$response = @file_get_contents($create_url);

if ($response) {
    $res = json_decode($response, true);
    if ($res['status'] == 'success') {
        $qr_url = $res['data']['qr_url'];
        $order_id = $res['data']['order_id'];
    } else { $error_msg = $res['message']; }
} else { $error_msg = "Gateway Error"; }
?>

<!-- HTML and Polling Logic (See full snippet for styling) -->
<img src="<?php echo $qr_url; ?>">
<script>
setInterval(() => {
    fetch(`?action=verify&order_id=<?php echo $order_id; ?>`)
    .then(r => r.json()).then(data => {
        if(data.status === 'success') alert('Paid: ' + data.data.utr);
    });
}, 5000);
</script>