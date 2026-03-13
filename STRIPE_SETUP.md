# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payments for your MiniMinds application.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Node.js and npm installed
3. Your MiniMinds application running locally

## Step 1: Get Your Stripe API Keys

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com
2. Click on "Developers" in the left sidebar
3. Click on "API keys"
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_` for test mode)
   - **Secret key** (starts with `sk_test_` for test mode) - Click "Reveal test key"

## Step 2: Configure Environment Variables

Create or update your `.env` file in the root directory:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_DEFAULT_PAYMENT_PROVIDER=stripe

# Server Configuration
PORT=8000
FRONTEND_ORIGIN=http://localhost:5173
PUBLIC_API_BASE_URL=http://localhost:8000

# Supabase Configuration (if using)
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key_here
```

## Step 3: Set Up Stripe Webhooks (for Production)

Webhooks allow Stripe to notify your server when payments are completed.

### For Local Development (using Stripe CLI):

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:8000/api/payments/webhook/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_`) and add it to your `.env` file

### For Production:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/payments/webhook/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
5. Copy the "Signing secret" and add it to your production environment variables

## Step 4: Start Your Servers

### Terminal 1 - Start Backend Server:
```bash
cd server
node index.js
```

### Terminal 2 - Start Frontend:
```bash
npm run dev
```

## Step 5: Test the Payment Flow

1. Go to http://localhost:5173
2. Add a paid bundle to cart
3. Go to checkout
4. Select "Stripe" as payment gateway
5. Click "Pay Now"
6. You'll be redirected to Stripe Checkout
7. Use Stripe test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date (e.g., 12/34)
   - Use any 3-digit CVC (e.g., 123)
   - Use any ZIP code (e.g., 12345)

## Step 6: Verify Payment Success

After successful payment:
1. You'll be redirected to the success page
2. Check your Stripe Dashboard → Payments to see the test payment
3. The order should be marked as "paid" in your database

## Stripe Test Card Numbers

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0025 0000 3155 | Requires authentication (3D Secure) |

## Production Checklist

Before going live:

- [ ] Switch to live Stripe API keys (starts with `pk_live_` and `sk_live_`)
- [ ] Set up production webhook endpoint
- [ ] Update `VITE_API_BASE_URL` to your production API URL
- [ ] Update `FRONTEND_ORIGIN` to your production frontend URL
- [ ] Update `PUBLIC_API_BASE_URL` to your production API URL
- [ ] Test the complete payment flow in production
- [ ] Enable Stripe Radar for fraud prevention
- [ ] Set up email receipts in Stripe Dashboard

## Troubleshooting

### "STRIPE_SECRET_KEY is not configured"
- Make sure your `.env` file has `STRIPE_SECRET_KEY` set
- Restart your backend server after updating `.env`

### "Invalid Stripe signature"
- Make sure `STRIPE_WEBHOOK_SECRET` is correctly set
- For local development, use Stripe CLI to forward webhooks
- Check that the webhook secret matches the one from Stripe

### Payment succeeds but order not marked as paid
- Check webhook logs in Stripe Dashboard
- Verify webhook endpoint is accessible
- Check server logs for errors

### "VITE_API_BASE_URL is not configured"
- Add `VITE_API_BASE_URL=http://localhost:8000` to your `.env` file
- Restart your frontend dev server

## Currency and Pricing

The current implementation uses INR (Indian Rupees). To change currency:

1. Update the currency in `server/index.js`:
   ```javascript
   body.set(`line_items[${index}][price_data][currency]`, 'usd'); // Change from 'inr'
   ```

2. Update pricing display in frontend components to match your currency

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Test your integration: https://stripe.com/docs/testing

## Security Best Practices

1. **Never commit API keys to Git**
   - Add `.env` to `.gitignore`
   - Use environment variables for all secrets

2. **Use webhook signatures**
   - Always verify webhook signatures
   - Already implemented in `server/index.js`

3. **HTTPS in production**
   - Always use HTTPS for production
   - Stripe requires HTTPS for webhooks

4. **Keep dependencies updated**
   - Regularly update npm packages
   - Monitor security advisories

## Next Steps

1. Customize the checkout experience
2. Add email receipts
3. Implement refund handling
4. Add subscription support (if needed)
5. Set up Stripe Billing Portal for customers
