import Link from "next/link";
import { ABOUT, VARS } from "@/samples/themes";
import type { ThemeName } from "@/samples/data";

export default function Gallery() {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <h1 className="text-3xl font-bold">Choose a direction</h1>
      <p className="mt-1 text-neutral-600">Same data in each. Open one, and try it at phone width too.</p>
      <ul className="mt-6 grid gap-6 md:grid-cols-2">
        {(Object.keys(ABOUT) as ThemeName[]).map((t) => (
          <li key={t}>
            <Link href={`/samples/${t}`} className="block overflow-hidden rounded-2xl border">
              <div className="relative h-72 overflow-hidden"><iframe title={ABOUT[t].name} src={`/samples/${t}`} tabIndex={-1} loading="lazy" className="pointer-events-none h-[640px] w-[222%] origin-top-left scale-[0.45] border-0" /></div>
              <div className="flex items-center gap-3 p-4"><span className="flex">{["--brand", "--s2", "--warn", "--ink"].map((v) => <span key={v} className="-ml-1 size-6 rounded-full border-2 border-white first:ml-0" style={{ background: VARS[t][v] }} />)}</span><span><b>{ABOUT[t].name}</b><br />{ABOUT[t].text}</span></div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
