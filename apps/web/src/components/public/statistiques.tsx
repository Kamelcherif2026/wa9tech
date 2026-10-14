"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Compte une vue de la fiche (une fois par chargement). */
export function CompteurVue({ id }: { id: string }) {
  useEffect(() => {
    createClient().rpc("compter_vue", { p_evenement: id }).then(() => {});
  }, [id]);
  return null;
}

/** Lien de réservation qui compte le clic. */
export function LienReservation({ id, href, children, className }: { id: string; href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className={className}
      onClick={() => {
        createClient().rpc("compter_clic_reservation", { p_evenement: id }).then(() => {});
      }}
    >
      {children}
    </a>
  );
}
