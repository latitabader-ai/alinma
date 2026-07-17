import { createContext, useContext, useState, ReactNode } from "react";

// ============================================================
//  AccountProvider — حالة الحساب المشتركة (الميزة 1)
//  رصيد الرئيسية + بيانات المصرفية المفتوحة (راتب، التزامات)
//  مصدر واحد للحقيقة يقرأه محرّك التمويل بقيم متّسقة لا عشوائية.
// ============================================================

interface AccountData {
  balance: number;      // رصيد الحساب الجاري المعروض في الرئيسية
  salary: number;       // الراتب الشهري (يُسحب عبر المصرفية المفتوحة)
  oblig: number;        // الالتزامات الشهرية
  statement: string;    // ملخّص كشف الحساب
  creditScore: number;  // التصنيف الائتماني (سمة)
  accountMask: string;  // آخر أرقام الحساب (مقنّع)
  transactions: Txn[];  // كشف الحساب — منه تُحتسب ثقة الدخل
}

export interface Txn { date: string; amount: number; type: "credit" | "debit"; desc: string }

// كشف حساب متّسق مع الملف: راتب منتظم 18,500 + خصم التزام 1,800
function buildStatement(salary: number, oblig: number, months = 6): Txn[] {
  const out: Txn[] = [];
  const now = new Date();
  for (let m = months; m > 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 27);
    out.push({ date: d.toISOString().slice(0, 10), amount: salary + ((m * 37) % 120), type: "credit", desc: "إيداع راتب" });
    const d2 = new Date(now.getFullYear(), now.getMonth() - m, 29);
    out.push({ date: d2.toISOString().slice(0, 10), amount: oblig, type: "debit", desc: "سداد التزام" });
  }
  return out;
}

interface AccountContextType extends AccountData {
  setBalance: (v: number) => void;
  deposit: (amount: number) => void;   // إضافة للرصيد (قبول تمويل)
  withdraw: (amount: number) => void;  // خصم من الرصيد (مساهمة / سداد)
}

// بيانات متّسقة — الراتب والالتزامات منطقيان بالنسبة للرصيد
const INITIAL: AccountData = {
  balance: 24550,
  salary: 18500,
  oblig: 1800,
  statement: "12 شهراً · تدفقات منتظمة",
  creditScore: 730,
  accountMask: "•••• 6000",
  transactions: buildStatement(18500, 1800),
};

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(INITIAL.balance);

  const deposit = (amount: number) => setBalance(b => b + Math.max(0, amount));
  const withdraw = (amount: number) => setBalance(b => Math.max(0, b - Math.max(0, amount)));

  return (
    <AccountContext.Provider
      value={{ ...INITIAL, balance, setBalance, deposit, withdraw }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}
