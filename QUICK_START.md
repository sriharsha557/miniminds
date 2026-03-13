# MiniMinds Quick Start Guide

Get your MiniMinds application up and running with Stripe payments in minutes!

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Configure Environment

```bash
# Copy the example environment file
copy .env.example .env
```

Edit `.env` and add your Stripe test keys:
- Get keys from: https://dashboard.stripe.com/test/apikeys
- Add your `STRIPE_SECRET_KEY` (starts with `sk_test_`)

### 3. Start the Application

**Option A: Using two terminals**

Terminal 1 - Backend:
```bash
cd server
node index.js
```

Terminal 2 - Frontend:
```bash
npm run dev
```

**Option B: Using the dev server already running**

If your frontend is already running at http://localhost:5173, just start the backend:
```bash
cd server
node index.js
```

### 4. Test Payment Flow

1. Open http://localhost:5173
2. Click on a paid bundle (e.g., "Mega Bundle")
3. Click "Add to Cart"
4. Go to checkout
5. Fill in your details
6. Select "Stripe" as payment gateway
7. Click "Pay Now"
8. Use test card: `4242 4242 4242 4242`
9. Any future date, any CVC, any ZIP

## 📋 What's Already Set Up

✅ Stripe payment integration
✅ Shopping cart functionality  
✅ Checkout page with Stripe redirect
✅ Payment success page
✅ Google Drive download links for paid bundles
✅ Webhook handling for payment confirmation
✅ Order management system

## 🔑 Required Environment Variables

Minimum required for Stripe to work:

```env
STRIPE_SECRET_KEY=sk_test_your_key_here
VITE_API_BASE_URL=http://localhost:8000
VITE_DEFAULT_PAYMENT_PROVIDER=stripe
```

## 🧪 Test Cards

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | ✅ Success |
| 4000 0000 0000 0002 | ❌ Declined |
| 4000 0000 0000 9995 | ❌ Insufficient funds |

## 📚 Next Steps

1. **Read the full setup guide**: See `STRIPE_SETUP.md` for detailed instructions
2. **Configure webhooks**: For production, set up Stripe webhooks
3. **Customize checkout**: Modify `src/pages/CheckoutPage.tsx`
4. **Add more bundles**: Edit `public/bundles.json`
5. **Deploy**: See deployment instructions in `README.md`

## 🐛 Troubleshooting

### Backend won't start
- Make sure you're in the `server` directory
- Check that `.env` file exists with `STRIPE_SECRET_KEY`
- Run `npm install` in the server directory

### Frontend can't connect to backend
- Make sure backend is running on port 8000
- Check `VITE_API_BASE_URL=http://localhost:8000` in `.env`
- Restart frontend dev server after changing `.env`

### Payment doesn't work
- Check browser console for errors
- Verify `STRIPE_SECRET_KEY` is set correctly
- Make sure you're using test mode keys (starts with `sk_test_`)

## 💡 Tips

- Use Stripe test mode for development (keys start with `sk_test_`)
- Check Stripe Dashboard → Payments to see test transactions
- Use Stripe CLI for local webhook testing
- Keep your `.env` file secure and never commit it to Git

## 📞 Need Help?

- Check `STRIPE_SETUP.md` for detailed setup instructions
- Visit Stripe docs: https://stripe.com/docs
- Check server logs for error messages
- Verify all environment variables are set correctly

---

Happy coding! 🎉
