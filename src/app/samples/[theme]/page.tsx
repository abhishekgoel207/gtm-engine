import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getSampleData, type ThemeName } from "@/samples/data";
import { ABOUT, LAYOUTS, VARS } from "@/samples/themes";

async function Sample({ params }: { params: Promise<{ theme: string }> }) {
  const { theme } = await params;
  await connection();
  if (!Object.hasOwn(LAYOUTS, theme)) notFound();
  const name = theme as ThemeName;
  const Layout = LAYOUTS[name];
  const data = getSampleData(name);
  return (
    <div style={{ ...VARS[name], "--display": "var(--f-serif)", background: "var(--bg)", color: "var(--ink)", fontFamily: `var(--f-${name})` } as React.CSSProperties} className="min-h-dvh">
      <nav className="flex items-center gap-4 px-4 pt-3 text-sm md:px-8"><Link href="/samples" className="inline-flex min-h-11 items-center underline">All samples</Link><span>{ABOUT[name].name}. Demo data.</span></nav>
      {data.empty ? <p className="p-8">Open <Link className="underline" href="/">Home</Link> and press Load demo first.</p> : <Layout d={data} />}
    </div>
  );
}

export default function SamplePage({ params }: { params: Promise<{ theme: string }> }) {
  return <Suspense fallback={null}><Sample params={params} /></Suspense>;
}
