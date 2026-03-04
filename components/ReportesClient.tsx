"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Props = {
  ingresosPorMes: { mes: string; ingresos: number; ordenes: number }[];
  distribucionEstados: { name: string; value: number; color: string }[];
  totalCobrado: number;
  totalPorCobrar: number;
  totalOrdenes: number;
  ticketPromedio: number;
  mejorMes: string;
  mejorMesValor: number;
};

const CustomTooltipBar = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#202637",
          border: "1px solid #374060",
          borderRadius: "10px",
          padding: "12px 16px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <p style={{ color: "#6b7899", fontSize: "11px", marginBottom: "6px" }}>
          {label}
        </p>
        <p style={{ color: "#34d399", fontWeight: 800, fontSize: "15px" }}>
          ${new Intl.NumberFormat("es-AR").format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const CustomTooltipLine = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#202637",
          border: "1px solid #374060",
          borderRadius: "10px",
          padding: "12px 16px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <p style={{ color: "#6b7899", fontSize: "11px", marginBottom: "6px" }}>
          {label}
        </p>
        <p style={{ color: "#4f8ef7", fontWeight: 800, fontSize: "15px" }}>
          {payload[0].value} órdenes
        </p>
      </div>
    );
  }
  return null;
};

const CustomTooltipPie = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#202637",
          border: "1px solid #374060",
          borderRadius: "10px",
          padding: "12px 16px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <p
          style={{
            color: payload[0].payload.color,
            fontWeight: 800,
            fontSize: "13px",
          }}
        >
          {payload[0].name}
        </p>
        <p style={{ color: "#dde3f0", fontWeight: 700, fontSize: "15px" }}>
          {payload[0].value} órdenes
        </p>
      </div>
    );
  }
  return null;
};

export default function ReportesClient({
  ingresosPorMes,
  distribucionEstados,
  totalCobrado,
  totalPorCobrar,
  totalOrdenes,
  ticketPromedio,
  mejorMes,
  mejorMesValor,
}: Props) {
  return (
    <div
      className="p-6 md:p-8"
      style={{
        background: "#1a1f2e",
        minHeight: "100vh",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div
          className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 pb-5 border-b"
          style={{ borderColor: "#2e3650" }}
        >
          <div>
            <h1
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: "#ffffff", letterSpacing: "-0.3px" }}
            >
              Reportes y Análisis
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#6b7899" }}>
              Métricas financieras y operativas del taller
            </p>
          </div>
          <div
            className="px-4 py-2 rounded-lg text-xs font-semibold border"
            style={{
              background: "#252b3b",
              borderColor: "#374060",
              color: "#a8b4cc",
            }}
          >
            ▸ Últimos 6 meses
          </div>
        </div>

        {/* MÉTRICAS RESUMEN */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Cobrado",
              value: `$${new Intl.NumberFormat("es-AR").format(totalCobrado)}`,
              color: "#34d399",
              icon: "$",
              bg: "rgba(52,211,153,0.08)",
            },
            {
              label: "Por Cobrar",
              value: `$${new Intl.NumberFormat("es-AR").format(totalPorCobrar)}`,
              color: "#fbbf24",
              icon: "◷",
              bg: "rgba(251,191,36,0.08)",
            },
            {
              label: "Total Órdenes",
              value: totalOrdenes.toString(),
              color: "#60a5fa",
              icon: "◈",
              bg: "rgba(96,165,250,0.08)",
            },
            {
              label: "Ticket Promedio",
              value: `$${new Intl.NumberFormat("es-AR").format(ticketPromedio)}`,
              color: "#c084fc",
              icon: "◉",
              bg: "rgba(192,132,252,0.08)",
            },
          ].map(({ label, value, color, icon, bg }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-4 rounded-xl border transition-all hover:-translate-y-0.5"
              style={{ background: "#252b3b", borderColor: "#2e3650" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: bg, color }}
              >
                {icon}
              </div>
              <div>
                <p
                  className="text-xs font-semibold"
                  style={{
                    color: "#6b7899",
                    fontSize: "10px",
                    letterSpacing: "0.5px",
                  }}
                >
                  {label}
                </p>
                <p
                  className="font-extrabold text-base"
                  style={{ color, letterSpacing: "-0.3px" }}
                >
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* FILA 1: Barras + Dona */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* GRÁFICO DE BARRAS — Ingresos por mes */}
          <div
            className="lg:col-span-2 rounded-xl border p-5"
            style={{ background: "#252b3b", borderColor: "#2e3650" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p
                  className="text-xs font-bold uppercase"
                  style={{ color: "#6b7899", letterSpacing: "1.5px" }}
                >
                  Ingresos por Mes
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#6b7899" }}>
                  Mejor mes:{" "}
                  <span style={{ color: "#34d399", fontWeight: 700 }}>
                    {mejorMes} — $
                    {new Intl.NumberFormat("es-AR").format(mejorMesValor)}
                  </span>
                </p>
              </div>
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: "#34d399", boxShadow: "0 0 8px #34d399" }}
              />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ingresosPorMes} barSize={28}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2e3650"
                  vertical={false}
                />
                <XAxis
                  dataKey="mes"
                  tick={{
                    fill: "#6b7899",
                    fontSize: 11,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fill: "#6b7899",
                    fontSize: 10,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    `$${new Intl.NumberFormat("es-AR").format(v)}`
                  }
                  width={70}
                />
                <Tooltip
                  content={<CustomTooltipBar />}
                  cursor={{ fill: "rgba(52,211,153,0.04)" }}
                />
                <Bar
                  dataKey="ingresos"
                  fill="#34d399"
                  radius={[6, 6, 0, 0]}
                  fillOpacity={0.9}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* GRÁFICO DE DONA — Distribución de estados */}
          <div
            className="rounded-xl border p-5"
            style={{ background: "#252b3b", borderColor: "#2e3650" }}
          >
            <p
              className="text-xs font-bold uppercase mb-5"
              style={{ color: "#6b7899", letterSpacing: "1.5px" }}
            >
              Estado de Órdenes
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={distribucionEstados}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {distribucionEstados.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipPie />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 mt-3">
              {distribucionEstados.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: d.color }}
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: "#a8b4cc" }}
                    >
                      {d.name}
                    </span>
                  </div>
                  <span
                    className="text-xs font-bold"
                    style={{ color: d.color }}
                  >
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FILA 2: Línea de tendencia */}
        <div
          className="rounded-xl border p-5"
          style={{ background: "#252b3b", borderColor: "#2e3650" }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p
                className="text-xs font-bold uppercase"
                style={{ color: "#6b7899", letterSpacing: "1.5px" }}
              >
                Volumen de Órdenes
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#6b7899" }}>
                Cantidad de trabajos ingresados por mes
              </p>
            </div>
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "#4f8ef7", boxShadow: "0 0 8px #4f8ef7" }}
            />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={ingresosPorMes}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#2e3650"
                vertical={false}
              />
              <XAxis
                dataKey="mes"
                tick={{
                  fill: "#6b7899",
                  fontSize: 11,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fill: "#6b7899",
                  fontSize: 11,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltipLine />}
                cursor={{ stroke: "#374060", strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="ordenes"
                stroke="#4f8ef7"
                strokeWidth={2.5}
                dot={{ fill: "#4f8ef7", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#4f8ef7", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
