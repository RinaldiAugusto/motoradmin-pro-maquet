"use client";

import { CSSProperties } from "react";

export default function DeleteButton({
  mensaje,
  className,
  style,
  children,
}: {
  mensaje: string;
  className?: string;
  style?: CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      style={style}
      onClick={(e) => {
        if (!window.confirm(mensaje)) {
          e.preventDefault();
        }
      }}
      title="Eliminar"
    >
      {children}
    </button>
  );
}
