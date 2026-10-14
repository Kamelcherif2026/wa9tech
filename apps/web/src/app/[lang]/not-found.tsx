import Link from "next/link";

export default function Introuvable() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-2xl font-bold">Page introuvable — الصفحة غير موجودة</h1>
      <p className="mt-4"><Link href="/" className="text-primary hover:underline">WA9TECH</Link></p>
    </div>
  );
}
