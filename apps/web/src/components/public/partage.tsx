"use client";

import { useState } from "react";
import { Link2, MessageCircle, Share2 } from "lucide-react";

export function Partage({
  url,
  titre,
  libelles,
}: {
  url: string;
  titre: string;
  libelles: { partager: string; copier: string; copie: string };
}) {
  const [copie, setCopie] = useState(false);
  const texte = encodeURIComponent(`${titre} — ${url}`);
  const bouton = "inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted";

  return (
    <div className="flex flex-wrap gap-2">
      <a className={`${bouton} border-[#25D366] text-[#128C7E]`} href={`https://wa.me/?text=${texte}`} target="_blank" rel="noreferrer">
        <MessageCircle className="size-4" /> WhatsApp
      </a>
      <a className={bouton} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer">
        <Share2 className="size-4" /> Facebook
      </a>
      <button
        type="button"
        className={bouton}
        onClick={async () => {
          if (navigator.share) {
            try { await navigator.share({ title: titre, url }); return; } catch { /* annulé */ }
          }
          await navigator.clipboard.writeText(url);
          setCopie(true);
          setTimeout(() => setCopie(false), 2000);
        }}
      >
        <Link2 className="size-4" /> {copie ? libelles.copie : libelles.copier}
      </button>
    </div>
  );
}
