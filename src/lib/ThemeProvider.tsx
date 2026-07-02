import { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

// ============================================================
//  ThemeProvider — إدارة الوضع الفاتح/الداكن (الميزة 1)
//  مبني فوق next-themes: يطبّق كلاس "dark" على <html> ويحفظ
//  الاختيار في localStorage تلقائياً. كل الشاشات تتبعه لأنها
//  تستخدم متغيّرات CSS. نبقي واجهة { theme, toggleTheme } كما هي.
// ============================================================

type Theme = "light" | "dark";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"          // يضيف/يزيل class="dark" على <html>
      defaultTheme="dark"        // الوضع الداكن هو الأصلي
      enableSystem={false}       // لا نتبع نظام التشغيل — اختيار المستخدم فقط
      storageKey="alinma-theme"  // نفس مفتاح الحفظ السابق
    >
      {children}
    </NextThemesProvider>
  );
}

// خطّاف بواجهة ثابتة يلفّ next-themes
export function useTheme() {
  const { theme, resolvedTheme, setTheme } = useNextTheme();
  const current = ((resolvedTheme ?? theme) as Theme) || "dark";
  return {
    theme: current,
    toggleTheme: () => setTheme(current === "dark" ? "light" : "dark"),
  };
}
