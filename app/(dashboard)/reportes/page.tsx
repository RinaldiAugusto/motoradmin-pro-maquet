import { createClient } from "@/utils/supabase/server";
import ReportesClient from "@/components/ReportesClient";

export default async function ReportesPage() {
  const supabase = await createClient();

  const { data: ordenes } = await supabase
    .from("ordenes")
    .select("id, costo, estado, created_at")
    .order("created_at", { ascending: true });

  if (!ordenes || ordenes.length === 0) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{
          background: "#1a1f2e",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <div className="text-center">
          <p className="text-4xl mb-4">◈</p>
          <p className="text-sm font-semibold" style={{ color: "#6b7899" }}>
            Todavía no hay datos suficientes para generar reportes.
          </p>
          <p className="text-xs mt-1" style={{ color: "#4a5068" }}>
            Ingresá órdenes desde el Tablero General para ver las métricas aquí.
          </p>
        </div>
      </div>
    );
  }

  // ── INGRESOS POR MES (últimos 6 meses) ──
  const mesesNombres = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  const hoy = new Date();
  const ultimos6: { mes: string; ingresos: number; ordenes: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth();

    const ordenesDelMes = ordenes.filter((o) => {
      const d = new Date(o.created_at);
      return d.getFullYear() === anio && d.getMonth() === mes;
    });

    const esFinalizado = (e: string) => e === "Finalizado" || e === "Terminado";

    const ingresos = ordenesDelMes
      .filter((o) => esFinalizado(o.estado))
      .reduce((acc, o) => acc + (Number(o.costo) || 0), 0);

    ultimos6.push({
      mes: `${mesesNombres[mes]} ${anio !== hoy.getFullYear() ? anio : ""}`.trim(),
      ingresos,
      ordenes: ordenesDelMes.length,
    });
  }

  // ── DISTRIBUCIÓN DE ESTADOS ──
  const esFinalizado = (e: string) => e === "Finalizado" || e === "Terminado";
  const esEnCurso = (e: string) => e === "En Curso" || e === "En curso";

  const countFinalizado = ordenes.filter((o) => esFinalizado(o.estado)).length;
  const countEnCurso = ordenes.filter((o) => esEnCurso(o.estado)).length;
  const countPendiente = ordenes.filter(
    (o) => !esFinalizado(o.estado) && !esEnCurso(o.estado),
  ).length;

  const distribucionEstados = [
    { name: "Completado", value: countFinalizado, color: "#34d399" },
    { name: "En Proceso", value: countEnCurso, color: "#fbbf24" },
    { name: "Pendiente", value: countPendiente, color: "#6b7899" },
  ].filter((d) => d.value > 0);

  // ── MÉTRICAS GLOBALES ──
  const totalCobrado = ordenes
    .filter((o) => esFinalizado(o.estado))
    .reduce((acc, o) => acc + (Number(o.costo) || 0), 0);
  const totalPorCobrar = ordenes
    .filter((o) => !esFinalizado(o.estado))
    .reduce((acc, o) => acc + (Number(o.costo) || 0), 0);
  const totalOrdenes = ordenes.length;
  const ticketPromedio =
    totalOrdenes > 0
      ? Math.round((totalCobrado + totalPorCobrar) / totalOrdenes)
      : 0;

  const mejorMesData = [...ultimos6].sort((a, b) => b.ingresos - a.ingresos)[0];
  const mejorMes = mejorMesData?.ingresos > 0 ? mejorMesData.mes : "—";
  const mejorMesValor = mejorMesData?.ingresos ?? 0;

  return (
    <ReportesClient
      ingresosPorMes={ultimos6}
      distribucionEstados={distribucionEstados}
      totalCobrado={totalCobrado}
      totalPorCobrar={totalPorCobrar}
      totalOrdenes={totalOrdenes}
      ticketPromedio={ticketPromedio}
      mejorMes={mejorMes}
      mejorMesValor={mejorMesValor}
    />
  );
}
