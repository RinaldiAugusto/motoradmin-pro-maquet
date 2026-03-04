"use client";

import { usePathname } from "next/navigation";
import { signOut } from "../login/actions";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  const navItem = (path: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive(path)
        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
    }`;

  const navIcon = (path: string) =>
    `w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 transition-all ${
      isActive(path)
        ? "bg-blue-500/15 text-blue-400"
        : "bg-slate-800 text-slate-400"
    }`;

  const sectionLabel = (text: string) => (
    <p
      className="text-xs font-bold uppercase px-2 pt-4 pb-1.5"
      style={{ color: "#6b7899", letterSpacing: "1.5px", fontSize: "9.5px" }}
    >
      {text}
    </p>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: "#1a1f2e",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* SIDEBAR */}
      <aside
        className="w-60 min-w-[240px] flex flex-col border-r"
        style={{ background: "#202637", borderColor: "#2e3650" }}
      >
        {/* BRAND */}
        <div
          className="flex items-center gap-3 px-5 py-6 border-b"
          style={{ borderColor: "#2e3650" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #4f8ef7, #3b7de8)",
              boxShadow: "0 4px 12px rgba(79,142,247,0.3)",
            }}
          >
            ▦
          </div>
          <div>
            <div className="text-white font-extrabold text-sm leading-tight tracking-tight">
              MotorAdmin Pro
            </div>
            <div
              className="text-xs font-medium uppercase tracking-widest mt-0.5"
              style={{
                color: "#6b7899",
                letterSpacing: "1.5px",
                fontSize: "9px",
              }}
            >
              Taller System
            </div>
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          {/* Principal */}
          {sectionLabel("Principal")}
          <Link href="/" className={navItem("/")}>
            <span className={navIcon("/")}>▦</span>
            Tablero General
          </Link>

          {/* Gestión */}
          {sectionLabel("Gestión")}
          <Link href="/clientes" className={navItem("/clientes")}>
            <span className={navIcon("/clientes")}>◉</span>
            Base de Clientes
          </Link>
          <Link href="/vehiculos" className={navItem("/vehiculos")}>
            <span className={navIcon("/vehiculos")}>◈</span>
            Flota de Vehículos
          </Link>

          {/* Análisis */}
          {sectionLabel("Análisis")}
          <Link href="/reportes" className={navItem("/reportes")}>
            <span className={navIcon("/reportes")}>▲</span>
            Reportes
          </Link>
        </nav>

        {/* FOOTER */}
        <div className="p-3 border-t" style={{ borderColor: "#2e3650" }}>
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-2"
            style={{ background: "#252b3b" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              A
            </div>
            <div>
              <div
                className="text-sm font-semibold"
                style={{ color: "#dde3f0" }}
              >
                Administrador
              </div>
              <div className="text-xs" style={{ color: "#6b7899" }}>
                Panel de control
              </div>
            </div>
          </div>
          <form action={signOut}>
            <button
              className="w-full py-2 rounded-lg text-xs font-semibold transition-all border"
              style={{
                background: "transparent",
                color: "#6b7899",
                borderColor: "#374060",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(248,113,113,0.3)";
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(248,113,113,0.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#6b7899";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "#374060";
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
              }}
            >
              → Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ background: "#1a1f2e" }}
      >
        {children}
      </main>
    </div>
  );
}
