import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/config";
import { GlobalAds } from "@/components/AdSlot";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Acorta y comparte enlaces`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Acorta cualquier enlace en un segundo, comparte una URL limpia y mira cuanta gente la abre.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Acorta y comparte enlaces`,
    description: "Acorta cualquier enlace en un segundo y mira cuanta gente lo abre.",
  },
};

export const viewport: Viewport = {
  themeColor: "#06070d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="app-bg flex min-h-dvh flex-col">
        <header className="border-b border-white/5">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-sm font-bold text-white">
                {SITE_NAME.charAt(0)}
              </span>
              <span>{SITE_NAME}</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm text-slate-400">
              <Link href="/" className="rounded-lg px-3 py-1.5 hover:bg-white/5 hover:text-white">
                Acortar
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-1.5 hover:bg-white/5 hover:text-white"
              >
                Mis enlaces
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4">
            <span>
              &copy; {new Date().getFullYear()} {SITE_NAME}
            </span>
            <Link href="/terminos" className="hover:text-slate-300">
              Terminos
            </Link>
            <Link href="/privacidad" className="hover:text-slate-300">
              Privacidad
            </Link>
            <span className="text-slate-600">Sitio financiado con publicidad</span>
          </div>
        </footer>

        <GlobalAds />
      </body>
    </html>
  );
}
