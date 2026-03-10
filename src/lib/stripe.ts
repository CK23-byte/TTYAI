import { loadStripe } from '@stripe/stripe-js'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

export const stripePromise = publishableKey ? loadStripe(publishableKey) : null

export const SUBSCRIPTION_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 9.99,
    yearlyPrice: 99,
    credits: 250,
    profiles: 3,
    features: ['250 credits/month', '3 AI profiles', 'Text chat', 'Standard voices'],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 24.99,
    yearlyPrice: 249,
    credits: 625,
    profiles: 10,
    features: ['625 credits/month', '10 AI profiles', 'Text chat + Voice calls', 'Voice cloning', 'Priority support'],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 49.99,
    yearlyPrice: 499,
    credits: 1250,
    profiles: -1,
    features: ['1250 credits/month', 'Unlimited profiles', 'Text chat + Voice calls', 'Voice cloning', 'Priority support', 'Early access to features'],
    popular: false,
  },
] as const

export const CREDIT_PACKS = [
  { id: 'small', name: 'Small', price: 9.99, credits: 100, perCredit: 0.10 },
  { id: 'medium', name: 'Medium', price: 39.99, credits: 500, perCredit: 0.08 },
  { id: 'large', name: 'Large', price: 69.99, credits: 1000, perCredit: 0.07 },
  { id: 'xl', name: 'XL', price: 149.99, credits: 2500, perCredit: 0.06 },
] as const

export const CREDIT_COSTS = {
  textMessage: 1,
  voiceCallPerMinute: 25,
  voiceClone: 10,
} as const
