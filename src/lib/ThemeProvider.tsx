import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// ============================================================
//  ThemeProvider — إدارة الوضع الفاتح/الداكن (الميزة 1)
//  - يحفظ اختيار المستخدم في localStorage
//  - يطبّق كلاس "dark" على <html> لتفعيل الوضع الداكن
//  - كل الشاشات تتبعه تلقائياً لأنها تستخدم متغيّرات CSS
// ============================================================

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // نبدأ بالوضع الداكن (التصميم الأصلي) ما لم يحفظ المستخدم غيره
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("alinma-theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });

  // تطبيق الثيم على عنصر <html> وحفظه عند كل تغيير
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("alinma-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// خطّاف للوصول للثيم من أي مكوّن
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
