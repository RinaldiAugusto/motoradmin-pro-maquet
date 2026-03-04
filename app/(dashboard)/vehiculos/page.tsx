import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import DeleteButton from "@/components/DeleteButton";

export default async function VehiculosPage() {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nombre")
    .order("nombre", { ascending: true });
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("*, clientes(nombre)")
    .order("created_at", { ascending: false });

  async function agregarVehiculo(formData: FormData) {
    "use server";
    const patente = formData.get("patente") as string;
    const marca = formData.get("marca") as string;
    const modelo = formData.get("modelo") as string;
    const año = formData.get("año") as string;
    const cliente_id = formData.get("cliente_id") as string;
    if (!patente || !cliente_id) return;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("vehiculos").insert({
      patente: patente.toUpperCase(),
      marca,
      modelo,
      año,
      cliente_id: parseInt(cliente_id),
      user_id: user?.id,
    });
    revalidatePath("/vehiculos");
  }

  async function eliminarVehiculo(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;
    const supabase = await createClient();
    await supabase.from("vehiculos").delete().eq("id", id);
    revalidatePath("/vehiculos");
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
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div
          className="flex justify-between items-center mb-6 pb-5 border-b"
          style={{ borderColor: "#2e3650" }}
        >
          <div>
            <h1
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: "#ffffff", letterSpacing: "-0.3px" }}
            >
              Flota de Vehículos
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#6b7899" }}>
              Registro de rodados y vinculación con titulares
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{
              background: "rgba(79,142,247,0.12)",
              color: "#4f8ef7",
              border: "1px solid rgba(79,142,247,0.2)",
            }}
          >
            ◈
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* FORM */}
          <div
            className="col-span-1 rounded-xl border p-5 h-fit"
            style={{ background: "#252b3b", borderColor: "#2e3650" }}
          >
            <p
              className="text-xs font-bold uppercase mb-4"
              style={{ color: "#6b7899", letterSpacing: "1.5px" }}
            >
              Ingresar Vehículo
            </p>
            <form action={agregarVehiculo} className="flex flex-col gap-3">
              <select
                name="cliente_id"
                required
                className="rounded-lg text-sm outline-none w-full"
                style={{
                  background: "#202637",
                  border: "1px solid #374060",
                  padding: "9px 13px",
                  color: "#dde3f0",
                  fontFamily: "inherit",
                }}
              >
                <option value="">Dueño del vehículo...</option>
                {clientes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="patente"
                required
                placeholder="Patente"
                className="rounded-lg text-sm outline-none w-full uppercase"
                style={{
                  background: "#202637",
                  border: "1px solid #374060",
                  padding: "9px 13px",
                  color: "#dde3f0",
                  fontFamily: "inherit",
                }}
              />
              <input
                type="text"
                name="marca"
                required
                placeholder="Marca (Ej: Ford)"
                className="rounded-lg text-sm outline-none w-full"
                style={{
                  background: "#202637",
                  border: "1px solid #374060",
                  padding: "9px 13px",
                  color: "#dde3f0",
                  fontFamily: "inherit",
                }}
              />
              <input
                type="text"
                name="modelo"
                required
                placeholder="Modelo (Ej: Fiesta)"
                className="rounded-lg text-sm outline-none w-full"
                style={{
                  background: "#202637",
                  border: "1px solid #374060",
                  padding: "9px 13px",
                  color: "#dde3f0",
                  fontFamily: "inherit",
                }}
              />
              <input
                type="text"
                name="año"
                placeholder="Año"
                className="rounded-lg text-sm outline-none w-full"
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
                className="w-full rounded-lg text-sm font-bold text-white transition-all mt-1"
                style={{
                  background: "#4f8ef7",
                  padding: "9px 13px",
                  fontFamily: "inherit",
                }}
              >
                + Guardar Vehículo
              </button>
            </form>
          </div>

          {/* LISTA */}
          <div
            className="col-span-2 rounded-xl border p-5"
            style={{ background: "#252b3b", borderColor: "#2e3650" }}
          >
            <div
              className="flex items-center justify-between mb-4 pb-3 border-b"
              style={{ borderColor: "#2e3650" }}
            >
              <p
                className="text-xs font-bold uppercase"
                style={{ color: "#6b7899", letterSpacing: "1.5px" }}
              >
                Parque Automotor
              </p>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: "#2a3145", color: "#6b7899" }}
              >
                {vehiculos?.length || 0} vehículos
              </span>
            </div>

            {vehiculos && vehiculos.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {vehiculos.map((v) => (
                  <li
                    key={v.id}
                    className="flex justify-between items-center p-4 rounded-xl border group transition-all hover:-translate-y-0.5"
                    style={{ background: "#202637", borderColor: "#2e3650" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                        style={{
                          background: "rgba(79,142,247,0.08)",
                          color: "#4f8ef7",
                          border: "1px solid rgba(79,142,247,0.15)",
                        }}
                      >
                        ◈
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p
                            className="font-bold text-sm"
                            style={{ color: "#dde3f0" }}
                          >
                            {v.marca} {v.modelo} {v.año && `(${v.año})`}
                          </p>
                          <span
                            className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                            style={{
                              background: "#2a3145",
                              color: "#a8b4cc",
                              letterSpacing: "1.5px",
                            }}
                          >
                            {v.patente}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: "#6b7899" }}>
                          Titular:{" "}
                          {(v.clientes as { nombre: string } | null)?.nombre}
                        </p>
                      </div>
                    </div>
                    <form
                      action={eliminarVehiculo}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <input type="hidden" name="id" value={v.id} />
                      <DeleteButton
                        mensaje={`¿Eliminar vehículo ${v.patente}?`}
                        className="text-xs px-2 py-1.5 rounded-lg transition-all"
                        style={{ color: "#6b7899", background: "transparent" }}
                      >
                        ✕
                      </DeleteButton>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                className="text-center text-xs py-10"
                style={{ color: "#6b7899" }}
              >
                No hay vehículos registrados todavía.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
