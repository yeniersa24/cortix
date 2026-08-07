import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-6xl font-bold text-brand-400">404</p>
      <h1 className="mt-4 text-2xl font-bold">Este enlace no existe</h1>
      <p className="mt-3 text-slate-400">
        Puede que se haya escrito mal o que su creador lo haya borrado.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-600"
      >
        Acortar un enlace
      </Link>
    </div>
  );
}
