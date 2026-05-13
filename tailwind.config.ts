import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  /** siteLayoutWidth.ts — 동적 className 대비 */
  safelist: ["max-w-[900px]", "max-w-[840px]", "md:grid-cols-[510px_minmax(0,1fr)]", "aspect-[16/9]", "aspect-3/2", "aspect-[4/3]"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      /** 마이페이지·카드 썸네일 공통 — `aspect-[3/2]` 임의값이 일부 빌드에서 누락되는 경우 대비 */
      aspectRatio: {
        '3/2': '3 / 2',
      },
      fontFamily: {
        sans: [
          '"Pretendard Variable"',
          'Pretendard',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        /** wwwMainpagePlan — 에디토리얼 팔레트 */
        ink: {
          900: '#0F0F0F',
          700: '#2A2A2A',
          500: '#6B6B6B',
          300: '#A8A8A8',
          100: '#E8E5DD',
        },
        paper: '#FFFFFF',
        cream: '#F7F5F1',
        'cream-2': '#EFEBE3',
        'accent-lime': '#D9F032',
        'accent-lime-deep': '#B8CE25',
        'nav-gray': '#4B5563',
        'footer-dark': '#1A1A1A',
        // 룩엔필 브랜드 컬러 (이미지 디자인 기반)
        'neon-yellow': '#D9F032',
        'brand-yellow': '#FFDF38',
        'brand-purple': '#EA90FF',
        'brand-pink': '#FF75E1',
        'brand-coral': '#FF9F8A',
        'brand-orange': '#FFB803',
        'brand-grey': '#DADADA',
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#E1F800", // 네온 옐로우를 primary로
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config





