import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import DeleteButton from "@/components/DeleteButton";

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false });

  async function agregarCliente(formData: FormData) {
    "use server";
    const nombre = formData.get("nombre") as string;
    const telefono = formData.get("telefono") as string;
    const email = formData.get("email") as string;
    if (!nombre) return;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("clientes")
      .insert({ nombre, telefono, email, user_id: user?.id });
    revalidatePath("/clientes");
  }

  async function eliminarCliente(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;
    const supabase = await createClient();
    await supabase.from("clientes").delete().eq("id", id);
    revalidatePath("/clientes");
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
              Base de Clientes
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#6b7899" }}>
              Registro y administración de titulares
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
            ◉
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
              Nuevo Cliente
            </p>
            <form action={agregarCliente} className="flex flex-col gap-3">
              <input
                type="text"
                name="nombre"
                required
                placeholder="Nombre completo"
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
                name="telefono"
                placeholder="Teléfono"
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
                type="email"
                name="email"
                placeholder="Email"
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
                + Guardar Cliente
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
                Listado Activo
              </p>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: "#2a3145", color: "#6b7899" }}
              >
                {clientes?.length || 0} registros
              </span>
            </div>

            {clientes && clientes.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {clientes.map((c) => (
                  <li
                    key={c.id}
                    className="flex justify-between items-center p-4 rounded-xl border group transition-all hover:-translate-y-0.5"
                    style={{ background: "#202637", borderColor: "#2e3650" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{
                          background: "rgba(79,142,247,0.12)",
                          color: "#4f8ef7",
                        }}
                      >
                        {c.nombre?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p
                          className="font-bold text-sm"
                          style={{ color: "#dde3f0" }}
                        >
                          {c.nombre}
                        </p>
                        <p className="text-xs" style={{ color: "#6b7899" }}>
                          {c.telefono && <span>{c.telefono}</span>}
                          {c.telefono && c.email && <span> · </span>}
                          {c.email && <span>{c.email}</span>}
                        </p>
                      </div>
                    </div>
                    <form
                      action={eliminarCliente}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <input type="hidden" name="id" value={c.id} />
                      <DeleteButton
                        mensaje={`¿Eliminar a ${c.nombre}?`}
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
                No hay clientes registrados todavía.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
