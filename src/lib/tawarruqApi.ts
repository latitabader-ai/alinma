// ============================================================
//  tawarruqApi — الاتصال بمحرك التورق المنظم
//  طبقة تكوين العقد بين محرك الذكاء الاصطناعي والصرف.
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || "https://sharik-risk-api.onrender.com";

export type ContractType = "murabaha" | "tawarruq";

export interface Quote {
  cost_price: number;
  profit_amount: number;   // ربح ثابت بالريال — لا يتغيّر بعد التوقيع
  total_price: number;
  monthly: number;
  spread: number;
  indicative_rate: number;
  benchmark: { name: string; value: number; role: string };
}

export interface Lot {
  lot_id: string;
  commodity_ar: string;
  quantity: number;
  unit: string;
  possession_ts: string;
}

export interface Contract {
  contract_id: string;
  contract_type: ContractType;
  state: string;
  quote?: Quote;
  lot?: Lot;
  sale?: { ownership: string };
  liquidation?: { proceeds: number; buyer: string; slippage: number };
  disbursement?: { amount: number; payment_ref: string };
  syndicate?: { funded: number };
}

async function call<T>(path: string, body?: unknown, timeoutMs = 8000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      signal: ctrl.signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail?.message || `HTTP ${res.status}`);
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

export const tawarruq = {
  route: (b: { request_id: string; purpose: string; amount: number; tenor: number; ai: { level: string; dbr: number; confidence: number } }) =>
    call<Contract>("/tawarruq/route", b),
  quote: (id: string) => call<Contract>(`/tawarruq/${id}/quote`),
  syndicate: (id: string, investors: { id: string; amount: number }[]) =>
    call<Contract>(`/tawarruq/${id}/syndicate`, { investors }),
  acquire: (id: string) => call<Contract>(`/tawarruq/${id}/commodity/acquire`, { commodity: "copper" }),
  sign: (id: string, customer_id = "CUST-1") => call<Contract>(`/tawarruq/${id}/contract/sign`, { customer_id }),
  liquidate: (id: string) => call<Contract>(`/tawarruq/${id}/commodity/liquidate`, { buyer: "BROKER_B" }),
  disburse: (id: string, iban = "SA0000000000000000000000") => call<Contract>(`/tawarruq/${id}/disburse`, { iban }),
};
