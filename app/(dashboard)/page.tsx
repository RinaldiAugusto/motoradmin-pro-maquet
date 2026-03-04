import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import DeleteButton from "@/components/DeleteButton";
import Link from "next/link";

type VehiculoRelacion = {
  patente: string;
  marca: string;
  modelo: string;
} | null;

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q || "";
  const supabase = await createClient();

  // 1. DATA FETCHING
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("id, patente, marca, modelo");

  const { data: ordenesRaw } = await supabase
    .from("ordenes")
    .select(
      `id, descripcion, costo, estado, vehiculo_id, vehiculos ( patente, marca, modelo )`,
    )
    .order("created_at", { ascending: false });

  // 2. NORMALIZACIÓN Y FILTRADO
  const todasLasOrdenes =
    ordenesRaw
      ?.map((o) => {
        const e = o.estado?.trim();
        let estadoLimpio = "Pendiente";
        if (e === "En Curso" || e === "En curso") estadoLimpio = "En Curso";
        if (e === "Finalizado" || e === "Terminado")
          estadoLimpio = "Finalizado";
        const v = o.vehiculos as VehiculoRelacion;
        return { ...o, estadoLimpio, vehiculoData: v };
      })
      .filter(
        (o) =>
          o.vehiculoData?.patente.toLowerCase().includes(query.toLowerCase()) ||
          o.vehiculoData?.marca.toLowerCase().includes(query.toLowerCase()) ||
          o.descripcion.toLowerCase().includes(query.toLowerCase()),
      ) || [];

  const pendientes = todasLasOrdenes.filter(
    (o) => o.estadoLimpio === "Pendiente",
  );
  const enCurso = todasLasOrdenes.filter((o) => o.estadoLimpio === "En Curso");
  const historial = todasLasOrdenes.filter(
    (o) => o.estadoLimpio === "Finalizado",
  );

  // 3. MÉTRICAS
  const metricasGlobales =
    ordenesRaw?.map((o) => ({
      ...o,
      esFinalizado: o.estado === "Finalizado" || o.estado === "Terminado",
    })) || [];

  const cajaTotal = metricasGlobales
    .filter((o) => o.esFinalizado)
    .reduce((acc, curr) => acc + (Number(curr.costo) || 0), 0);
  const cuentasPorCobrar = metricasGlobales
    .filter((o) => !o.esFinalizado)
    .reduce((acc, curr) => acc + (Number(curr.costo) || 0), 0);

  // SERVER ACTIONS
  async function agregarOrden(formData: FormData) {
    "use server";
    const vehiculo_id = formData.get("vehiculo_id");
    const descripcion = formData.get("descripcion");
    const costo = formData.get("costo");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("ordenes").insert({
      vehiculo_id: parseInt(vehiculo_id as string),
      descripcion,
      costo: parseInt(costo as string) || 0,
      user_id: user?.id,
      estado: "Pendiente",
    });
    revalidatePath("/");
  }

  async function moverEstado(formData: FormData) {
    "use server";
    const id = formData.get("id");
    const estadoActual = formData.get("estado");
    const nuevoEstado =
      estadoActual === "Pendiente" ? "En Curso" : "Finalizado";
    const supabase = await createClient();
    await supabase.from("ordenes").update({ estado: nuevoEstado }).eq("id", id);
    revalidatePath("/");
  }

  async function eliminarOrden(formData: FormData) {
    "use server";
    const id = formData.get("id");
    const supabase = await createClient();
    await supabase.from("ordenes").delete().eq("id", id);
    revalidatePath("/");
  }

  return (
    <div
      className="p-8"
      style={{
        background: "#1a1f2e",
        minHeight: "100vh",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* TOPBAR */}
        <div
          className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 pb-5 border-b"
          style={{ borderColor: "#2e3650" }}
        >
          <div>
            <h1
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: "#ffffff", letterSpacing: "-0.3px" }}
            >
              Gestión Operativa
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#6b7899" }}>
              Control total de reparaciones y facturación
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="px-4 py-2 rounded-lg text-xs font-semibold border"
              style={{
                background: "#252b3b",
                borderColor: "#374060",
                color: "#a8b4cc",
              }}
            >
              ▸ Panel activo
            </div>
            <form className="relative">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Buscar patente, marca..."
                className="rounded-lg text-sm outline-none transition-all"
                style={{
                  background: "#252b3b",
                  border: "1px solid #374060",
                  padding: "9px 14px 9px 36px",
                  color: "#dde3f0",
                  width: "240px",
                  fontFamily: "inherit",
                }}
              />
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: "#6b7899" }}
              >
                ⌕
              </span>
            </form>
          </div>
        </div>

        {/* MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div
            className="flex items-center gap-4 p-5 rounded-xl border transition-all hover:-translate-y-0.5"
            style={{ background: "#252b3b", borderColor: "#2e3650" }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
              style={{ background: "rgba(52,211,153,0.08)", color: "#34d399" }}
            >
              $
            </div>
            <div>
              <p
                className="text-xs font-semibold uppercase"
                style={{
                  color: "#6b7899",
                  letterSpacing: "1px",
                  fontSize: "10px",
                }}
              >
                Balance Cobrado
              </p>
              <p
                className="text-2xl font-extrabold tracking-tight"
                style={{ color: "#34d399", letterSpacing: "-0.5px" }}
              >
                ${new Intl.NumberFormat("es-AR").format(cajaTotal)}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-4 p-5 rounded-xl border transition-all hover:-translate-y-0.5"
            style={{ background: "#252b3b", borderColor: "#2e3650" }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-base flex-shrink-0"
              style={{ background: "rgba(251,191,36,0.08)", color: "#fbbf24" }}
            >
              ◷
            </div>
            <div>
              <p
                className="text-xs font-semibold uppercase"
                style={{
                  color: "#6b7899",
                  letterSpacing: "1px",
                  fontSize: "10px",
                }}
              >
                Pendiente de Cobro
              </p>
              <p
                className="text-2xl font-extrabold tracking-tight"
                style={{ color: "#fbbf24", letterSpacing: "-0.5px" }}
              >
                ${new Intl.NumberFormat("es-AR").format(cuentasPorCobrar)}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-4 p-5 rounded-xl border transition-all hover:-translate-y-0.5"
            style={{ background: "#252b3b", borderColor: "#2e3650" }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-base flex-shrink-0"
              style={{ background: "rgba(96,165,250,0.08)", color: "#60a5fa" }}
            >
              ◈
            </div>
            <div>
              <p
                className="text-xs font-semibold uppercase"
                style={{
                  color: "#6b7899",
                  letterSpacing: "1px",
                  fontSize: "10px",
                }}
              >
                Vehículos en Taller
              </p>
              <p
                className="text-2xl font-extrabold tracking-tight"
                style={{ color: "#60a5fa", letterSpacing: "-0.5px" }}
              >
                {pendientes.length + enCurso.length}
              </p>
            </div>
          </div>
        </div>

        {/* FORM */}
        <div
          className="p-5 rounded-xl border mb-5"
          style={{ background: "#252b3b", borderColor: "#2e3650" }}
        >
          <p
            className="text-xs font-bold uppercase mb-3"
            style={{ color: "#6b7899", letterSpacing: "1.5px" }}
          >
            Ingresar Nuevo Vehículo a Reparación
          </p>
          <form
            action={agregarOrden}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center"
          >
            <select
              name="vehiculo_id"
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
              <option value="">Seleccionar vehículo...</option>
              {vehiculos?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.patente} – {v.marca} {v.modelo}
                </option>
              ))}
            </select>
            <input
              name="descripcion"
              required
              placeholder="Descripción de la falla o servicio..."
              className="md:col-span-2 rounded-lg text-sm outline-none"
              style={{
                background: "#202637",
                border: "1px solid #374060",
                padding: "9px 13px",
                color: "#dde3f0",
                fontFamily: "inherit",
              }}
            />
            <div className="flex gap-2">
              <input
                type="number"
                name="costo"
                placeholder="$ Costo"
                className="w-full rounded-lg text-sm outline-none"
                style={{
                  background: "#202637",
                  border: "1px solid #374060",
                  padding: "9px 13px",
                  color: "#dde3f0",
                  fontFamily: "inherit",
                }}
              />
              <button
                type="submit"
                className="rounded-lg text-sm font-bold text-white transition-all active:scale-95 whitespace-nowrap"
                style={{
                  background: "#4f8ef7",
                  padding: "9px 18px",
                  fontFamily: "inherit",
                }}
              >
                + Ingresar
              </button>
            </div>
          </form>
        </div>

        {/* KANBAN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* PENDIENTES */}
          <div
            className="rounded-xl border p-4"
            style={{ background: "#252b3b", borderColor: "#2e3650" }}
          >
            <div
              className="flex items-center gap-2 mb-3 pb-3 border-b"
              style={{ borderColor: "#2e3650" }}
            >
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase"
                style={{
                  background: "rgba(107,120,153,0.12)",
                  color: "#6b7899",
                  letterSpacing: "1px",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ background: "#6b7899" }}
                />
                Pendiente
              </span>
              <span
                className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "#2a3145", color: "#6b7899" }}
              >
                {pendientes.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {pendientes.map((o) => (
                <div
                  key={o.id}
                  className="rounded-xl p-4 border transition-all hover:-translate-y-0.5"
                  style={{ background: "#202637", borderColor: "#2e3650" }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className="font-mono text-xs font-bold px-2.5 py-1 rounded"
                      style={{
                        background: "#2a3145",
                        color: "#a8b4cc",
                        letterSpacing: "1.5px",
                      }}
                    >
                      {o.vehiculoData?.patente}
                    </span>
                    <form action={eliminarOrden}>
                      <input type="hidden" name="id" value={o.id} />
                      <DeleteButton
                        mensaje="¿Eliminar esta orden?"
                        className="text-xs px-1.5 py-1 rounded transition-colors"
                        style={{ color: "#6b7899" }}
                      >
                        ✕
                      </DeleteButton>
                    </form>
                  </div>
                  <Link
                    href={`/ordenes/${o.id}`}
                    className="font-bold text-sm mb-1 block hover:underline"
                    style={{ color: "#dde3f0", textDecoration: "none" }}
                  >
                    {o.vehiculoData?.marca} {o.vehiculoData?.modelo}
                  </Link>
                  <p
                    className="text-xs mb-3 leading-relaxed"
                    style={{ color: "#6b7899" }}
                  >
                    {o.descripcion}
                  </p>
                  <div
                    className="flex justify-between items-center pt-2.5 border-t"
                    style={{ borderColor: "#2e3650" }}
                  >
                    <span
                      className="font-extrabold text-base"
                      style={{ color: "#dde3f0", letterSpacing: "-0.3px" }}
                    >
                      ${new Intl.NumberFormat("es-AR").format(o.costo)}
                    </span>
                    <form action={moverEstado}>
                      <input type="hidden" name="id" value={o.id} />
                      <input
                        type="hidden"
                        name="estado"
                        value={o.estadoLimpio}
                      />
                      <button
                        type="submit"
                        className="text-xs font-bold px-3 py-1.5 rounded-md transition-all uppercase"
                        style={{
                          background: "rgba(79,142,247,0.12)",
                          color: "#4f8ef7",
                          border: "1px solid rgba(79,142,247,0.22)",
                          fontFamily: "inherit",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Siguiente →
                      </button>
                    </form>
                  </div>
                </div>
              ))}
              {pendientes.length === 0 && (
                <p
                  className="text-center text-xs py-6"
                  style={{ color: "#6b7899" }}
                >
                  Sin órdenes pendientes
                </p>
              )}
            </div>
          </div>

          {/* EN CURSO */}
          <div
            className="rounded-xl border p-4"
            style={{ background: "#252b3b", borderColor: "#2e3650" }}
          >
            <div
              className="flex items-center gap-2 mb-3 pb-3 border-b"
              style={{ borderColor: "#2e3650" }}
            >
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase"
                style={{
                  background: "rgba(251,191,36,0.08)",
                  color: "#fbbf24",
                  border: "1px solid rgba(251,191,36,0.2)",
                  letterSpacing: "1px",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{
                    background: "#fbbf24",
                    boxShadow: "0 0 6px #fbbf24",
                  }}
                />
                En Proceso
              </span>
              <span
                className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "#2a3145", color: "#6b7899" }}
              >
                {enCurso.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {enCurso.map((o) => (
                <div
                  key={o.id}
                  className="rounded-xl p-4 transition-all hover:-translate-y-0.5"
                  style={{
                    background: "#202637",
                    border: "1px solid #2e3650",
                    borderLeftColor: "#fbbf24",
                    borderLeftWidth: "3px",
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className="font-mono text-xs font-bold px-2.5 py-1 rounded"
                      style={{
                        background: "rgba(251,191,36,0.1)",
                        color: "#fbbf24",
                        border: "1px solid rgba(251,191,36,0.25)",
                        letterSpacing: "1.5px",
                      }}
                    >
                      {o.vehiculoData?.patente}
                    </span>
                  </div>
                  <Link
                    href={`/ordenes/${o.id}`}
                    className="font-bold text-sm mb-1 block hover:underline"
                    style={{ color: "#dde3f0", textDecoration: "none" }}
                  >
                    {o.vehiculoData?.marca} {o.vehiculoData?.modelo}
                  </Link>
                  <p
                    className="text-xs font-semibold mb-3 uppercase"
                    style={{
                      color: "rgba(251,191,36,0.6)",
                      letterSpacing: "0.3px",
                    }}
                  >
                    ⚙ Trabajando en el vehículo
                  </p>
                  <div
                    className="flex justify-between items-center pt-2.5 border-t"
                    style={{ borderColor: "#2e3650" }}
                  >
                    <span
                      className="font-extrabold text-base"
                      style={{ color: "#dde3f0", letterSpacing: "-0.3px" }}
                    >
                      ${new Intl.NumberFormat("es-AR").format(o.costo)}
                    </span>
                    <form action={moverEstado}>
                      <input type="hidden" name="id" value={o.id} />
                      <input
                        type="hidden"
                        name="estado"
                        value={o.estadoLimpio}
                      />
                      <button
                        type="submit"
                        className="text-xs font-bold px-3 py-1.5 rounded-md transition-all uppercase"
                        style={{
                          background: "rgba(251,191,36,0.1)",
                          color: "#fbbf24",
                          border: "1px solid rgba(251,191,36,0.22)",
                          fontFamily: "inherit",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Siguiente →
                      </button>
                    </form>
                  </div>
                </div>
              ))}
              {enCurso.length === 0 && (
                <p
                  className="text-center text-xs py-6"
                  style={{ color: "#6b7899" }}
                >
                  Sin vehículos en proceso
                </p>
              )}
            </div>
          </div>

          {/* FINALIZADO */}
          <div
            className="rounded-xl border p-4"
            style={{ background: "#252b3b", borderColor: "#2e3650" }}
          >
            <div
              className="flex items-center gap-2 mb-3 pb-3 border-b"
              style={{ borderColor: "#2e3650" }}
            >
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase"
                style={{
                  background: "rgba(52,211,153,0.08)",
                  color: "#34d399",
                  border: "1px solid rgba(52,211,153,0.2)",
                  letterSpacing: "1px",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{
                    background: "#34d399",
                    boxShadow: "0 0 6px #34d399",
                  }}
                />
                Completado
              </span>
              <span
                className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "#2a3145", color: "#6b7899" }}
              >
                {historial.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {historial.map((o) => (
                <div
                  key={o.id}
                  className="rounded-xl p-4 transition-all hover:-translate-y-0.5"
                  style={{
                    background: "#202637",
                    border: "1px solid #2e3650",
                    borderLeftColor: "#34d399",
                    borderLeftWidth: "3px",
                    opacity: 0.85,
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className="font-mono text-xs font-bold px-2.5 py-1 rounded"
                      style={{
                        background: "rgba(52,211,153,0.08)",
                        color: "#34d399",
                        border: "1px solid rgba(52,211,153,0.2)",
                        letterSpacing: "1.5px",
                      }}
                    >
                      {o.vehiculoData?.patente}
                    </span>
                  </div>
                  <Link
                    href={`/ordenes/${o.id}`}
                    className="font-bold text-sm mb-1 block hover:underline"
                    style={{ color: "#dde3f0", textDecoration: "none" }}
                  >
                    {o.vehiculoData?.marca} {o.vehiculoData?.modelo}
                  </Link>
                  <p
                    className="text-xs mb-3 leading-relaxed"
                    style={{ color: "#6b7899" }}
                  >
                    {o.descripcion}
                  </p>
                  <div
                    className="flex justify-between items-center pt-2.5 border-t"
                    style={{ borderColor: "#2e3650" }}
                  >
                    <span
                      className="font-extrabold text-base"
                      style={{ color: "#34d399", letterSpacing: "-0.3px" }}
                    >
                      ${new Intl.NumberFormat("es-AR").format(o.costo)}
                    </span>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded"
                      style={{
                        background: "rgba(52,211,153,0.08)",
                        color: "#34d399",
                      }}
                    >
                      ✓ Cobrado
                    </span>
                  </div>
                </div>
              ))}
              {historial.length === 0 && (
                <p
                  className="text-center text-xs py-6"
                  style={{ color: "#6b7899" }}
                >
                  Sin órdenes finalizadas
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
