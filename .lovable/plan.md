# 3 Fixes Plan

## 1. App auto-refresh band karna

**Root cause:** `public/sw.js` har navigation request pe network-first strategy use kar raha hai aur successful response milte hi cache me daal raha hai. Jab bhi network response thoda alag aata hai (e.g., Vite HMR ya new build hash), browser ko naya HTML milta hai aur app silently reload ho jata hai. Plus SW `skipWaiting()` + `clients.claim()` immediately karta hai — naya SW activate hote hi clients claim ho jaate hain aur kabhi-kabhi page refresh trigger karta hai.

**Fix:**
- `sw.js` ko **navigation requests ke liye cache-first** banayenge (sirf static assets network-first).
- `skipWaiting`/`clients.claim` hata denge taa ki user ki current tab kabhi forcefully reclaim na ho.
- `index.html` me agar koi auto-reload listener hai (e.g., `controllerchange` → `location.reload`) to hata denge.

## 2. Auto-logout band karna

**Root cause:** `src/contexts/SupabaseAuthContext.tsx` me `getSession()` agar refresh-token error de to **forcibly `signOut()` call** ho raha hai (line 222–226). Network blip ya temporary token refresh failure pe user logout ho jaata hai. Login function me bhi same pattern hai.

**Fix:**
- Refresh-token error pe forced `signOut()` hata do; sirf state clear karo aur user ko silently retry karne do (Supabase client khud retry karta hai).
- `onAuthStateChange` me `TOKEN_REFRESHED` / `INITIAL_SESSION` events pe user state preserve karenge — sirf explicit `SIGNED_OUT` event pe role state clear karenge.
- `persistSession: true` already set hai (client.ts), to manual sign-out call hi sirf logout trigger karega.

## 3. Payment methods overhaul

**Current state:** Codebase me payment options hain: `cash | card | upi | due | part | wallet | split | credit`. UI me "Due" button dikhta hai. Reports me sirf raw `paymentMethod` string aata hai.

**User requirement:**
- Final list: **Cash, Card, UPI, Credit, Credit Outstanding, Credit Collected**
- **`due` ko `credit` se replace** karo (UI label + internal value dono)
- "Credit Outstanding" aur "Credit Collected" sirf **reports** ke breakdown me dikhne chahiye (ye derived hain — credit jo abhi tak due hai vs jo collect ho gaya).

**Files to touch:**

| File | Change |
|---|---|
| `src/lib/store.ts` | `paymentMethod` type: `due` hata do, `credit` rakho |
| `src/contexts/POSContext.tsx` | `placeOrder`/`printBillForOrder`/`directBillPrint` signatures se `due` hata do |
| `src/components/pos/Cart.tsx` | "Due" button → "Credit" button, internal value `'credit'` |
| `src/components/pos/MobileCart.tsx` | Same — `due` → `credit` |
| `src/pages/POSBillingPage.tsx` | Same replacement |
| `src/hooks/useAnalytics.ts` | Payment summary me `credit` ko split karo: agar `credit_ledger` me paid → "Credit Collected", warna "Credit Outstanding". Total "Credit" bhi show karo. |
| `src/pages/reports/SalesSummaryPage.tsx` / `CounterSummaryPage.tsx` / `OrderSummaryPage.tsx` / `TipSummaryPage.tsx` | Display labels update |

**Backward compatibility:** Purane orders jinme `paymentMethod = 'due'` save hai, unko reports me `credit` ke under count karenge (mapping at read time).

## Execution order

1. Payment methods overhaul (functional change, biggest)
2. Auto-logout fix in SupabaseAuthContext
3. Service worker fix for auto-refresh

Confirm karo to start karu — ya koi specific cheez pehle chahiye?
