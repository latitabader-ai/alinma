import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/ThemeProvider";

// ============================================================
//  ThemeToggle — زر تبديل الوضع الفاتح/الداكن (الميزة 1)
//  يوضع في الـAppBar بجانب أيقونتي الإشعارات والتعديل.
//  أيقونة متحرّكة: شمس في الوضع الداكن (لتشير للتحويل للفاتح)
//  وقمر في الوضع الفاتح.
// ============================================================

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "التبديل للوضع الفاتح" : "التبديل للوضع الداكن"}
      className="relative w-9 h-9 rounded-full flex items-center justify-center
                 text-foreground hover:bg-muted transition-colors"
      data-testid="theme-toggle"
    >
      {/* الشمس — تظهر في الوضع الداكن */}
      <Sun
        className={`absolute w-5 h-5 transition-all duration-300
          ${theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"}`}
      />
      {/* القمر — يظهر في الوضع الفاتح */}
      <Moon
        className={`absolute w-5 h-5 transition-all duration-300
          ${theme === "light" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-0"}`}
      />
    </button>
  );
}
