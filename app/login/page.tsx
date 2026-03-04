import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: "#1a1f2e",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Glow fondo */}
      <div
        style={{
          position: "fixed",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "500px",
          height: "300px",
          background:
            "radial-gradient(ellipse, rgba(79,142,247,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="w-full max-w-sm">
        {/* BRAND */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-4"
            style={{
              background: "linear-gradient(135deg, #4f8ef7, #3b7de8)",
              boxShadow: "0 8px 24px rgba(79,142,247,0.35)",
            }}
          >
            ▦
          </div>
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: "#ffffff", letterSpacing: "-0.3px" }}
          >
            MotorAdmin Pro
          </h1>
          <p
            className="text-xs font-semibold uppercase mt-1.5"
            style={{ color: "#6b7899", letterSpacing: "2px" }}
          >
            Taller System
          </p>
        </div>

        {/* CARD */}
        <div
          className="rounded-2xl p-7 border"
          style={{ background: "#202637", borderColor: "#2e3650" }}
        >
          <h2 className="text-base font-bold mb-1" style={{ color: "#dde3f0" }}>
            Ingresá a tu panel
          </h2>
          <p className="text-xs mb-6" style={{ color: "#6b7899" }}>
            Accedé con tu cuenta para gestionar el taller
          </p>

          {/* ERROR / INFO MESSAGE */}
          {message && (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-lg mb-5 text-xs font-medium"
              style={{
                background:
                  message.includes("Revisa") || message.includes("confirmar")
                    ? "rgba(52,211,153,0.08)"
                    : "rgba(248,113,113,0.08)",
                border: `1px solid ${
                  message.includes("Revisa") || message.includes("confirmar")
                    ? "rgba(52,211,153,0.2)"
                    : "rgba(248,113,113,0.2)"
                }`,
                color:
                  message.includes("Revisa") || message.includes("confirmar")
                    ? "#34d399"
                    : "#f87171",
              }}
            >
              <span>
                {message.includes("Revisa") || message.includes("confirmar")
                  ? "✓"
                  : "✕"}
              </span>
              {message}
            </div>
          )}

          <form className="flex flex-col gap-4">
            {/* EMAIL */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold"
                style={{ color: "#a8b4cc" }}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="taller@mail.com"
                className="rounded-lg text-sm outline-none transition-all w-full"
                style={{
                  background: "#252b3b",
                  border: "1px solid #374060",
                  padding: "10px 14px",
                  color: "#dde3f0",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* PASSWORD */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold"
                style={{ color: "#a8b4cc" }}
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="rounded-lg text-sm outline-none transition-all w-full"
                style={{
                  background: "#252b3b",
                  border: "1px solid #374060",
                  padding: "10px 14px",
                  color: "#dde3f0",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* BOTONES */}
            <div className="flex flex-col gap-2 mt-2">
              <button
                formAction={login}
                className="w-full rounded-lg text-sm font-bold text-white transition-all py-3"
                style={{ background: "#4f8ef7", fontFamily: "inherit" }}
              >
                Ingresar al panel
              </button>
              <button
                formAction={signup}
                className="w-full rounded-lg text-sm font-semibold transition-all py-3 border"
                style={{
                  background: "transparent",
                  borderColor: "#374060",
                  color: "#a8b4cc",
                  fontFamily: "inherit",
                }}
              >
                Crear cuenta nueva
              </button>
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <p className="text-center text-xs mt-6" style={{ color: "#6b7899" }}>
          Sistema de gestión profesional para talleres
        </p>
      </div>
    </div>
  );
}
