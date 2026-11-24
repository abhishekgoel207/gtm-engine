import { Bricolage_Grotesque, Newsreader, Nunito, Sora, Source_Sans_3 } from "next/font/google";

const a = Bricolage_Grotesque({ subsets: ["latin"], variable: "--f-signal" });
const b = Sora({ subsets: ["latin"], variable: "--f-night" });
const c = Source_Sans_3({ subsets: ["latin"], variable: "--f-field" });
const e = Newsreader({ subsets: ["latin"], variable: "--f-serif" });
const f = Nunito({ subsets: ["latin"], variable: "--f-pop" });

// Covers the real app's shell. Theme samples only.
export default function SamplesLayout({ children }: { children: React.ReactNode }) {
  return <div className={`fixed inset-0 z-[60] overflow-y-auto bg-white ${[a, b, c, e, f].map((x) => x.variable).join(" ")}`}>{children}</div>;
}
