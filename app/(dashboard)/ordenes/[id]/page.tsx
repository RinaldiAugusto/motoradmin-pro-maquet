import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function OrdenDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: orden } = await supabase
    .from("ordenes")
    .select(`*, vehiculos ( *, clientes ( nombre, telefono, email ) )`)
    .eq("id", id)
    .single();

  if (!orden) notFound();

  const vehiculo = orden.vehiculos as {
    id: number;
    patente: string;
    marca: string;
    modelo: string;
    año: string;
    clientes: { nombre: string; telefono: string; email: string } | null;
  } | null;

  const { data: historial } = await supabase
    .from("ordenes")
    .select("id, descripcion, costo, estado, created_at")
    .eq("vehiculo_id", vehiculo?.id)
    .neq("id", id)
    .order("created_at", { ascending: false });

  const estadoColor = {
    Pendiente: {
      bg: "rgba(107,120,153,0.12)",
      color: "#6b7899",
      border: "rgba(107,120,153,0.2)",
    },
    "En Curso": {
      bg: "rgba(251,191,36,0.08)",
      color: "#fbbf24",
      border: "rgba(251,191,36,0.2)",
    },
    Finalizado: {
      bg: "rgba(52,211,153,0.08)",
      color: "#34d399",
      border: "rgba(52,211,153,0.2)",
    },
  };

  const estadoNorm =
    orden.estado === "Terminado"
      ? "Finalizado"
      : orden.estado === "En curso"
        ? "En Curso"
        : ((orden.estado as "Pendiente" | "En Curso" | "Finalizado") ??
          "Pendiente");

  const estilo = estadoColor[estadoNorm] ?? estadoColor["Pendiente"];
  const esFinalizado = estadoNorm === "Finalizado";
  const yaCobrado = orden.pagado === true;

  // ── SERVER ACTIONS ──

  async function registrarPago(formData: FormData) {
    "use server";
    const metodo = formData.get("metodo_pago") as string;
    const monto_cobrado = formData.get("monto_cobrado") as string;
    const supabase = await createClient();
    await supabase
      .from("ordenes")
      .update({
        pagado: true,
        fecha_pago: new Date().toISOString(),
        metodo_pago: metodo,
        monto_cobrado: parseFloat(monto_cobrado) || orden.costo,
      })
      .eq("id", id);
    revalidatePath(`/ordenes/${id}`);
  }

  async function generarLinkMP(formData: FormData) {
    "use server";
    const monto = formData.get("monto_mp") as string;
    const montoFinal = parseFloat(monto) || orden.costo;
    const titulo = `${vehiculo?.marca} ${vehiculo?.modelo} – ${orden.descripcion}`;
    const token = process.env.MP_ACCESS_TOKEN;
    const supabase = await createClient();

    if (!token) {
      // Sin token: guardamos link de demo para mostrar el flujo
      await supabase
        .from("ordenes")
        .update({ mp_link: `https://mpago.la/demo-${id}` })
        .eq("id", id);
      revalidatePath(`/ordenes/${id}`);
      return;
    }

    try {
      const res = await fetch(
        "https://api.mercadopago.com/checkout/preferences",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: [
              {
                title: titulo,
                quantity: 1,
                unit_price: montoFinal,
                currency_id: "ARS",
              },
            ],
            back_urls: {
              success: `${process.env.NEXT_PUBLIC_APP_URL}/ordenes/${id}`,
              failure: `${process.env.NEXT_PUBLIC_APP_URL}/ordenes/${id}`,
            },
            auto_return: "approved",
          }),
        },
      );
      const data = await res.json();
      const link = data.init_point || data.sandbox_init_point;
      if (link)
        await supabase.from("ordenes").update({ mp_link: link }).eq("id", id);
    } catch (e) {
      console.error("Error MP:", e);
    }
    revalidatePath(`/ordenes/${id}`);
  }

  async function desmarcarPago() {
    "use server";
    const supabase = await createClient();
    await supabase
      .from("ordenes")
      .update({
        pagado: false,
        fecha_pago: null,
        metodo_pago: null,
        monto_cobrado: null,
      })
      .eq("id", id);
    revalidatePath(`/ordenes/${id}`);
  }

  return (
    <div
      className="p-6 md:p-8"
      style={{
        background: "#1a1f2e",
        minHeight: "100vh",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div className="mx-auto max-w-4xl">
        {/* BACK */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold mb-6 transition-all hover:gap-3"
          style={{ color: "#6b7899" }}
        >
          ← Volver al tablero
        </Link>

        {/* HEADER */}
        <div
          className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 pb-5 border-b"
          style={{ borderColor: "#2e3650" }}
        >
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1
                className="text-2xl font-extrabold tracking-tight"
                style={{ color: "#ffffff", letterSpacing: "-0.3px" }}
              >
                {vehiculo?.marca} {vehiculo?.modelo}
              </h1>
              <span
                className="font-mono text-xs font-bold px-2.5 py-1 rounded"
                style={{
                  background: "#2a3145",
                  color: "#a8b4cc",
                  letterSpacing: "1.5px",
                }}
              >
                {vehiculo?.patente}
              </span>
            </div>
            <p className="text-sm" style={{ color: "#6b7899" }}>
              Titular: {vehiculo?.clientes?.nombre}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {yaCobrado && (
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{
                  background: "rgba(52,211,153,0.08)",
                  color: "#34d399",
                  border: "1px solid rgba(52,211,153,0.2)",
                }}
              >
                ✓ Cobrado
              </span>
            )}
            <span
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase"
              style={{
                background: estilo.bg,
                color: estilo.color,
                border: `1px solid ${estilo.border}`,
                letterSpacing: "1px",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{
                  background: estilo.color,
                  boxShadow: `0 0 6px ${estilo.color}`,
                }}
              />
              {estadoNorm}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* COLUMNA IZQUIERDA */}
          <div className="md:col-span-2 flex flex-col gap-5">
            {/* Detalle orden */}
            <div
              className="rounded-xl border p-5"
              style={{ background: "#252b3b", borderColor: "#2e3650" }}
            >
              <p
                className="text-xs font-bold uppercase mb-4"
                style={{ color: "#6b7899", letterSpacing: "1.5px" }}
              >
                Detalle de la Orden
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs" style={{ color: "#6b7899" }}>
                    Descripción / Servicio
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "#dde3f0" }}
                  >
                    {orden.descripcion}
                  </span>
                </div>
                <div
                  className="grid grid-cols-2 gap-4 pt-3 mt-1 border-t"
                  style={{ borderColor: "#2e3650" }}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs" style={{ color: "#6b7899" }}>
                      Presupuesto
                    </span>
                    <span
                      className="text-xl font-extrabold"
                      style={{ color: "#34d399", letterSpacing: "-0.5px" }}
                    >
                      ${new Intl.NumberFormat("es-AR").format(orden.costo)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs" style={{ color: "#6b7899" }}>
                      Fecha de ingreso
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "#dde3f0" }}
                    >
                      {new Date(orden.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL DE COBRO — solo visible si está Finalizado */}
            {esFinalizado && (
              <div
                className="rounded-xl border p-5"
                style={{
                  background: yaCobrado ? "rgba(52,211,153,0.04)" : "#252b3b",
                  borderColor: yaCobrado ? "rgba(52,211,153,0.25)" : "#2e3650",
                }}
              >
                <p
                  className="text-xs font-bold uppercase mb-4"
                  style={{
                    color: yaCobrado ? "#34d399" : "#6b7899",
                    letterSpacing: "1.5px",
                  }}
                >
                  {yaCobrado ? "✓ Pago Registrado" : "Registrar Cobro"}
                </p>

                {yaCobrado ? (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs" style={{ color: "#6b7899" }}>
                          Monto cobrado
                        </span>
                        <span
                          className="text-lg font-extrabold"
                          style={{ color: "#34d399" }}
                        >
                          $
                          {new Intl.NumberFormat("es-AR").format(
                            orden.monto_cobrado ?? orden.costo,
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs" style={{ color: "#6b7899" }}>
                          Método
                        </span>
                        <span
                          className="text-sm font-bold capitalize"
                          style={{ color: "#dde3f0" }}
                        >
                          {orden.metodo_pago ?? "—"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs" style={{ color: "#6b7899" }}>
                          Fecha
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: "#dde3f0" }}
                        >
                          {orden.fecha_pago
                            ? new Date(orden.fecha_pago).toLocaleDateString(
                                "es-AR",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </span>
                      </div>
                    </div>
                    <form
                      action={desmarcarPago}
                      className="pt-2 border-t"
                      style={{ borderColor: "rgba(52,211,153,0.15)" }}
                    >
                      <button
                        type="submit"
                        className="text-xs font-semibold transition-all"
                        style={{
                          color: "#6b7899",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Desmarcar como pagado
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Formulario cobro manual */}
                    <form
                      action={registrarPago}
                      className="flex flex-col gap-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label
                            className="text-xs font-semibold"
                            style={{ color: "#a8b4cc" }}
                          >
                            Método de pago
                          </label>
                          <select
                            name="metodo_pago"
                            required
                            className="rounded-lg text-sm outline-none"
                            style={{
                              background: "#202637",
                              border: "1px solid #374060",
                              padding: "9px 13px",
                              color: "#dde3f0",
                              fontFamily: "inherit",
                            }}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Mercado Pago">Mercado Pago</option>
                            <option value="Tarjeta de débito">
                              Tarjeta de débito
                            </option>
                            <option value="Tarjeta de crédito">
                              Tarjeta de crédito
                            </option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label
                            className="text-xs font-semibold"
                            style={{ color: "#a8b4cc" }}
                          >
                            Monto{" "}
                            <span style={{ color: "#6b7899", fontWeight: 400 }}>
                              (vacío = presupuesto)
                            </span>
                          </label>
                          <input
                            type="number"
                            name="monto_cobrado"
                            placeholder={`$${new Intl.NumberFormat("es-AR").format(orden.costo)}`}
                            className="rounded-lg text-sm outline-none"
                            style={{
                              background: "#202637",
                              border: "1px solid #374060",
                              padding: "9px 13px",
                              color: "#dde3f0",
                              fontFamily: "inherit",
                            }}
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full rounded-lg text-sm font-bold py-2.5 transition-all"
                        style={{
                          background: "#34d399",
                          color: "#0a1628",
                          fontFamily: "inherit",
                        }}
                      >
                        ✓ Confirmar Cobro
                      </button>
                    </form>

                    {/* Separador */}
                    <div className="flex items-center gap-3">
                      <div
                        className="flex-1 h-px"
                        style={{ background: "#2e3650" }}
                      />
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "#6b7899" }}
                      >
                        o cobrá online
                      </span>
                      <div
                        className="flex-1 h-px"
                        style={{ background: "#2e3650" }}
                      />
                    </div>

                    {/* Mercado Pago */}
                    {orden.mp_link ? (
                      <div className="flex flex-col gap-2">
                        <div
                          className="flex items-center gap-2 p-3 rounded-lg border"
                          style={{
                            background: "rgba(79,142,247,0.05)",
                            borderColor: "rgba(79,142,247,0.2)",
                          }}
                        >
                          <span
                            className="text-xs font-semibold flex-shrink-0"
                            style={{ color: "#4f8ef7" }}
                          >
                            ◈ Link:
                          </span>
                          <a
                            href={orden.mp_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono truncate flex-1 hover:underline"
                            style={{ color: "#a8b4cc" }}
                          >
                            {orden.mp_link}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <form
                        action={generarLinkMP}
                        className="flex flex-col gap-2"
                      >
                        <div className="flex flex-col gap-1.5">
                          <label
                            className="text-xs font-semibold"
                            style={{ color: "#a8b4cc" }}
                          >
                            Monto para Mercado Pago
                          </label>
                          <input
                            type="number"
                            name="monto_mp"
                            placeholder={`$${new Intl.NumberFormat("es-AR").format(orden.costo)}`}
                            className="rounded-lg text-sm outline-none"
                            style={{
                              background: "#202637",
                              border: "1px solid #374060",
                              padding: "9px 13px",
                              color: "#dde3f0",
                              fontFamily: "inherit",
                            }}
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full rounded-lg text-sm font-bold py-2.5 border transition-all"
                          style={{
                            background: "rgba(79,142,247,0.08)",
                            borderColor: "rgba(79,142,247,0.3)",
                            color: "#4f8ef7",
                            fontFamily: "inherit",
                          }}
                        >
                          ◈ Generar Link de Mercado Pago
                        </button>
                        <p
                          className="text-xs text-center"
                          style={{ color: "#4a5068" }}
                        >
                          Configurá{" "}
                          <span
                            style={{
                              color: "#4f8ef7",
                              fontFamily: "monospace",
                            }}
                          >
                            MP_ACCESS_TOKEN
                          </span>{" "}
                          en .env.local para cobros reales
                        </p>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Historial */}
            <div
              className="rounded-xl border p-5"
              style={{ background: "#252b3b", borderColor: "#2e3650" }}
            >
              <div className="flex items-center justify-between mb-4">
                <p
                  className="text-xs font-bold uppercase"
                  style={{ color: "#6b7899", letterSpacing: "1.5px" }}
                >
                  Historial del Vehículo
                </p>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: "#2a3145", color: "#6b7899" }}
                >
                  {historial?.length ?? 0} registros anteriores
                </span>
              </div>
              {historial && historial.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {historial.map((h) => {
                    const hEstado =
                      h.estado === "Terminado"
                        ? "Finalizado"
                        : h.estado === "En curso"
                          ? "En Curso"
                          : (h.estado ?? "Pendiente");
                    const hEstilo =
                      estadoColor[hEstado as keyof typeof estadoColor] ??
                      estadoColor["Pendiente"];
                    return (
                      <Link
                        key={h.id}
                        href={`/ordenes/${h.id}`}
                        className="flex justify-between items-center p-4 rounded-xl border transition-all hover:-translate-y-0.5"
                        style={{
                          background: "#202637",
                          borderColor: "#2e3650",
                          textDecoration: "none",
                        }}
                      >
                        <div>
                          <p
                            className="text-sm font-semibold mb-0.5"
                            style={{ color: "#dde3f0" }}
                          >
                            {h.descripcion}
                          </p>
                          <p className="text-xs" style={{ color: "#6b7899" }}>
                            {new Date(h.created_at).toLocaleDateString(
                              "es-AR",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          <span
                            className="font-bold text-sm"
                            style={{ color: "#dde3f0" }}
                          >
                            ${new Intl.NumberFormat("es-AR").format(h.costo)}
                          </span>
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{
                              background: hEstilo.bg,
                              color: hEstilo.color,
                              border: `1px solid ${hEstilo.border}`,
                            }}
                          >
                            {hEstado}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p
                  className="text-xs text-center py-6"
                  style={{ color: "#6b7899" }}
                >
                  Este es el primer registro de este vehículo.
                </p>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="flex flex-col gap-5">
            {/* Vehículo */}
            <div
              className="rounded-xl border p-5"
              style={{ background: "#252b3b", borderColor: "#2e3650" }}
            >
              <p
                className="text-xs font-bold uppercase mb-4"
                style={{ color: "#6b7899", letterSpacing: "1.5px" }}
              >
                Vehículo
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Marca", value: vehiculo?.marca },
                  { label: "Modelo", value: vehiculo?.modelo },
                  { label: "Año", value: vehiculo?.año },
                  { label: "Patente", value: vehiculo?.patente },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center"
                  >
                    <span className="text-xs" style={{ color: "#6b7899" }}>
                      {label}
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{
                        color: label === "Patente" ? "#a8b4cc" : "#dde3f0",
                        fontFamily:
                          label === "Patente" ? "monospace" : "inherit",
                        letterSpacing: label === "Patente" ? "1.5px" : "normal",
                      }}
                    >
                      {value ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cliente */}
            <div
              className="rounded-xl border p-5"
              style={{ background: "#252b3b", borderColor: "#2e3650" }}
            >
              <p
                className="text-xs font-bold uppercase mb-4"
                style={{ color: "#6b7899", letterSpacing: "1.5px" }}
              >
                Titular
              </p>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: "rgba(79,142,247,0.12)",
                    color: "#4f8ef7",
                  }}
                >
                  {vehiculo?.clientes?.nombre?.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-bold" style={{ color: "#dde3f0" }}>
                  {vehiculo?.clientes?.nombre}
                </p>
              </div>
              <div
                className="flex flex-col gap-2.5 pt-3 border-t"
                style={{ borderColor: "#2e3650" }}
              >
                {vehiculo?.clientes?.telefono && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: "#6b7899" }}>
                      Teléfono
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "#dde3f0" }}
                    >
                      {vehiculo.clientes.telefono}
                    </span>
                  </div>
                )}
                {vehiculo?.clientes?.email && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: "#6b7899" }}>
                      Email
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "#dde3f0" }}
                    >
                      {vehiculo.clientes.email}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen financiero */}
            <div
              className="rounded-xl border p-5"
              style={{ background: "#252b3b", borderColor: "#2e3650" }}
            >
              <p
                className="text-xs font-bold uppercase mb-4"
                style={{ color: "#6b7899", letterSpacing: "1.5px" }}
              >
                Resumen
              </p>
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "#6b7899" }}>
                    Presupuesto
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: "#dde3f0" }}
                  >
                    ${new Intl.NumberFormat("es-AR").format(orden.costo)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "#6b7899" }}>
                    Cobrado
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: yaCobrado ? "#34d399" : "#6b7899" }}
                  >
                    {yaCobrado
                      ? `$${new Intl.NumberFormat("es-AR").format(orden.monto_cobrado ?? orden.costo)}`
                      : "—"}
                  </span>
                </div>
                <div
                  className="flex justify-between items-center pt-2 border-t"
                  style={{ borderColor: "#2e3650" }}
                >
                  <span
                    className="text-xs font-bold"
                    style={{ color: "#6b7899" }}
                  >
                    Estado de pago
                  </span>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: yaCobrado
                        ? "rgba(52,211,153,0.08)"
                        : "rgba(251,191,36,0.08)",
                      color: yaCobrado ? "#34d399" : "#fbbf24",
                      border: `1px solid ${yaCobrado ? "rgba(52,211,153,0.2)" : "rgba(251,191,36,0.2)"}`,
                    }}
                  >
                    {yaCobrado ? "Cobrado" : "Pendiente"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
