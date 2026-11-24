import { Rise, Count, Daily, FunnelBars, Versus, ScoreRing, SwipeCard, AgentTrack, IntroMap } from "./parts";
import { money } from "./money";
import type { SampleData, ThemeName } from "./data";

const CHIP: Record<string, string> = { funding: "💰 Funding", exec_hire: "👋 New leader", job_posting: "📣 Hiring", tech_change: "🔧 New tech", renewal_window: "⏳ Renewal", press: "📰 News" };
type P = { d: SampleData };
/* eslint-disable @next/next/no-img-element */

export const VARS: Record<ThemeName, Record<string, string>> = {
  signal: { "--bg": "#EEF2FB", "--surface": "#FFFFFF", "--ink": "#0B1533", "--muted-ink": "#55608A", "--hair": "#DDE4F5", "--brand": "#2347F5", "--brand-ink": "#fff", "--s1": "#2347F5", "--s2": "#D9641A", "--good": "#0B7A4B", "--warn": "#FFC145", "--mark": "#FFE7A8", "--mark-ink": "#3A2A00", "--radius": "24px" },
  night: { "--bg": "#07131A", "--surface": "#0E1F28", "--ink": "#E8F4F3", "--muted-ink": "#93ADB3", "--hair": "#1F3742", "--brand": "#1FA58C", "--brand-ink": "#03110E", "--s1": "#1FA58C", "--s2": "#C9822B", "--good": "#15734F", "--warn": "#F2B24C", "--mark": "#4A3512", "--mark-ink": "#FFE2B0", "--radius": "14px" },
  field: { "--bg": "#EAF0E6", "--surface": "#FBFDF9", "--ink": "#15291D", "--muted-ink": "#52665A", "--hair": "#D3DECF", "--brand": "#0F5C3B", "--brand-ink": "#fff", "--s1": "#0F7048", "--s2": "#B0378A", "--good": "#0F7048", "--warn": "#F0B840", "--mark": "#F6E2A0", "--mark-ink": "#3B2E00", "--radius": "6px" },
  pop: { "--bg": "#F3ECFF", "--surface": "#FFFFFF", "--ink": "#22104D", "--muted-ink": "#65558C", "--hair": "#E6DBFB", "--brand": "#6C3BF5", "--brand-ink": "#fff", "--s1": "#6C3BF5", "--s2": "#E0437B", "--good": "#0D7A50", "--warn": "#FFC931", "--mark": "#FFE27A", "--mark-ink": "#3A2A00", "--radius": "32px" },
};

const Card = ({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) => (
  <Rise className={`min-w-0 rounded-[var(--radius)] bg-[var(--surface)] p-5 ${className}`}>
    {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
    {children}
  </Rise>
);

function Signal({ d }: P) {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 md:grid-cols-6 md:p-8">
      <Rise className="relative overflow-hidden rounded-[var(--radius)] bg-[var(--brand)] p-6 text-white md:col-span-4 md:p-10">
        <svg aria-hidden className="absolute -right-24 -bottom-32 w-[480px] opacity-60" viewBox="0 0 400 400">{[60, 100, 140, 180].map((r, i) => <circle key={r} cx="200" cy="200" r={r} fill="none" stroke={i === 1 ? "#FFC145" : "#8FA5FF"} strokeWidth={i === 1 ? 10 : 3} strokeDasharray={i === 1 ? "180 900" : undefined} strokeLinecap="round" />)}</svg>
        <p className="relative text-sm text-white/85">Good to see you, Alex</p>
        <h1 className="relative mt-3 max-w-lg text-3xl leading-tight font-bold md:text-5xl">{d.headline}</h1>
        <p className="relative mt-4 max-w-md text-white/90">{d.takeaway}</p>
        <button className="relative mt-6 h-12 rounded-full bg-[#FFC145] px-6 font-semibold text-[#241800]">Approve {d.kpis[3].value} messages</button>
      </Rise>
      <div className="grid grid-cols-2 gap-4 md:col-span-2">
        {d.kpis.map((k) => (
          <Card key={k.label}><p className="text-4xl font-bold"><Count value={k.value} isMoney={k.money} /></p><p className="mt-1 text-sm text-[var(--muted-ink)]">{k.label}{k.of ? `, of ${k.of} contacted` : ""}</p></Card>
        ))}
      </div>
      <Card title="Messages and replies, by day sent" className="md:col-span-4"><Daily data={d.daily} /></Card>
      <Card title="Which version works" className="md:col-span-2"><Versus data={d.versions} /></Card>
      <Card title="Today's best buyers" className="md:col-span-3">
        <ul className="space-y-4">{d.buyers.slice(0, 4).map((b) => (
          <li key={b.id} className="flex items-center gap-3"><img src={b.art} alt="" className="size-12 rounded-2xl" /><div className="min-w-0 flex-1"><p className="font-semibold">{b.name}</p><p className="truncate text-sm text-[var(--muted-ink)]">{b.title}, {b.company}</p><span className="mt-1 inline-block rounded-full bg-[var(--bg)] px-2.5 py-0.5 text-xs">{CHIP[b.signalType] ?? b.signalType}</span></div><ScoreRing {...b} /></li>
        ))}</ul>
      </Card>
      <div className="min-w-0 md:col-span-3">{d.draft && <SwipeCard draft={d.draft} />}</div>
      <Card title="From match to win" className="md:col-span-3"><FunnelBars data={d.funnel} /></Card>
      <Card title="Your AI team" className="md:col-span-3"><AgentTrack /></Card>
    </div>
  );
}

function Night({ d }: P) {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--hair)] px-4 pt-6 md:px-10">
        <svg aria-hidden className="absolute inset-0 size-full opacity-40"><defs><pattern id="g" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="var(--hair)" /></pattern></defs><rect width="100%" height="100%" fill="url(#g)" /></svg>
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-4 md:grid-cols-2">
          <div><h1 className="text-3xl leading-tight font-semibold md:text-5xl">{d.headline}</h1><p className="mt-4 text-[var(--muted-ink)]">{d.takeaway}</p>
            <ul className="mt-5 space-y-2">{d.intros.map((s) => <li key={s} className="flex gap-2 text-sm"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--s2)]" />{s}</li>)}</ul>
          </div>
          <IntroMap data={d} />
        </div>
        <dl className="relative mx-auto grid max-w-6xl grid-cols-2 border-t border-[var(--hair)] md:grid-cols-4">
          {d.kpis.map((k) => <div key={k.label} className="py-5 pr-4"><dt className="text-sm text-[var(--muted-ink)]">{k.label}</dt><dd className="font-mono text-4xl"><Count value={k.value} isMoney={k.money} /></dd></div>)}
        </dl>
      </section>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px bg-[var(--hair)] md:grid-cols-3">
        {[["Messages and replies, by day sent", <Daily key="a" data={d.daily} />], ["From match to win", <FunnelBars key="b" data={d.funnel} />], ["Which version works", <Versus key="c" data={d.versions} />]].map(([t, c]) => <Rise key={String(t)} className="min-w-0 bg-[var(--bg)] p-5"><h2 className="mb-4 font-semibold">{t}</h2>{c}</Rise>)}
      </div>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-4 md:grid-cols-2 md:p-8">
        <div className="min-w-0">
          <h2 className="mb-3 font-semibold">Best buyers right now</h2>
          <ul className="divide-y divide-[var(--hair)]">{d.buyers.map((b) => <li key={b.id} className="flex items-center gap-4 py-3"><ScoreRing {...b} size={52} /><div className="min-w-0 flex-1"><p>{b.name} <span className="text-[var(--muted-ink)]">{b.company}</span></p><p className="truncate text-sm text-[var(--muted-ink)]">{b.signal}</p></div></li>)}</ul>
        </div>
        <div className="min-w-0 space-y-6">{d.draft && <SwipeCard draft={d.draft} />}<Card title="Your AI team"><AgentTrack /></Card></div>
      </div>
    </div>
  );
}

/** The funnel drawn as hills: each peak's height is the number of leads. */
function Hills({ data }: { data: SampleData["funnel"] }) {
  const max = Math.max(1, ...data.map((f) => f.count));
  return (
    <svg viewBox="0 0 1000 340" className="w-full" role="img" aria-label={data.map((f) => `${f.label} ${f.count}`).join(", ")}>
      <rect width="1000" height="340" fill="#D6E8DD" /><circle cx="800" cy="80" r="44" fill="#F6D98A" />
      {data.map((f, i) => {
        const x = 110 + i * 195, top = 310 - (f.count / max) * 230;
        return <g key={f.label}><title>{`${f.label}: ${f.count}`}</title><path d={`M${x - 190} 310 C${x - 80} 310 ${x - 70} ${top} ${x} ${top} S${x + 80} 310 ${x + 190} 310Z`} fill={["#7FB798", "#5E9F7E", "#418765", "#266E4D", "#0F5C3B"][i]} fillOpacity="0.92" /><text x={x} y={top - 14} textAnchor="middle" fontSize="34" fontWeight="700" fill="#15291D">{f.count}</text></g>;
      })}
      <rect y="308" width="1000" height="32" fill="#0F5C3B" />
      {data.map((f, i) => <text key={f.label} x={110 + i * 195} y="331" textAnchor="middle" fontSize="20" fill="#fff">{f.label}</text>)}
    </svg>
  );
}

function Field({ d }: P) {
  return (
    <article className="mx-auto max-w-5xl px-4 py-8 md:py-14">
      <p className="text-[var(--muted-ink)]">Your field report</p>
      <h1 className="mt-2 max-w-3xl font-[family-name:var(--display)] text-4xl leading-[1.08] md:text-6xl">{d.headline}</h1>
      <Rise className="mt-8 overflow-hidden rounded-[var(--radius)]"><Hills data={d.funnel} /></Rise>
      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[1.2fr_1fr]">
        <p className="font-[family-name:var(--display)] text-2xl leading-snug md:text-3xl">You have <b>{money(d.kpis[0].value)}</b> in play. <b>{d.kpis[1].value}</b> of {d.kpis[1].of} contacted leads wrote back and <b>{d.kpis[2].value}</b> met you. {d.takeaway}</p>
        <div><h2 className="mb-3 text-lg font-semibold">Which version works</h2><Versus data={d.versions} /></div>
      </div>
      <h2 className="mt-14 mb-4 border-t border-[var(--ink)] pt-3 font-[family-name:var(--display)] text-3xl">People worth your time</h2>
      <div className="grid gap-x-8 gap-y-8 md:grid-cols-2">
        {d.buyers.slice(0, 4).map((b) => <Rise key={b.id} className="flex gap-4"><img src={b.art} alt="" className="size-20 rounded-[var(--radius)]" /><div className="min-w-0"><p className="font-[family-name:var(--display)] text-2xl">{b.name}</p><p className="text-sm text-[var(--muted-ink)]">{b.title}, {b.company}. Score {b.total}.</p><p className="mt-1">{b.signal}.</p></div></Rise>)}
      </div>
      <h2 className="mt-14 mb-6 border-t border-[var(--ink)] pt-3 font-[family-name:var(--display)] text-3xl">Waiting for your word</h2>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">{d.draft && <SwipeCard draft={d.draft} />}<div className="min-w-0 space-y-8"><div><h3 className="mb-3 font-semibold">Messages and replies, by day sent</h3><Daily data={d.daily} /></div><AgentTrack /></div></div>
    </article>
  );
}

function Pop({ d }: P) {
  const blocks = ["bg-[#6C3BF5] text-white", "bg-[#FFC931]", "bg-[#FF9CC0]", "bg-[#8CE8C4]"];
  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="flex items-end gap-4">
        {d.buyers[0] && <img src={d.buyers[0].art} alt="" className="size-24 shrink-0 -rotate-6 rounded-[32px] md:size-36" />}
        <h1 className="text-3xl leading-tight font-extrabold md:text-5xl">{d.headline}</h1>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {d.kpis.map((k, i) => <Rise key={k.label} delay={i * 0.06} className={`rounded-[var(--radius)] p-5 ${blocks[i]}`}><p className="text-5xl font-extrabold"><Count value={k.value} isMoney={k.money} /></p><p className="mt-1 font-semibold">{k.label}</p></Rise>)}
      </div>
      <h2 className="mt-8 mb-3 text-2xl font-extrabold">Your best buyers</h2>
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3">
        {d.buyers.map((b, i) => <li key={b.id} className="w-56 shrink-0 snap-start overflow-hidden rounded-[var(--radius)] bg-[var(--surface)]"><div className={`flex items-center justify-center p-5 ${blocks[(i + 1) % 4]}`}><img src={b.art} alt="" className="size-24 rounded-full" /></div><div className="p-4"><div className="flex items-center justify-between"><p className="font-extrabold">{b.name}</p><ScoreRing {...b} size={48} /></div><p className="text-sm text-[var(--muted-ink)]">{b.company}</p><p className="mt-2 text-sm">{CHIP[b.signalType] ?? b.signalType}</p></div></li>)}
      </ul>
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        {d.draft && <SwipeCard draft={d.draft} />}
        <Card title="From match to win"><FunnelBars data={d.funnel} /><p className="mt-4 font-semibold">{d.takeaway}</p></Card>
        <Card title="Which version works"><Versus data={d.versions} /></Card>
        <Card title="Messages and replies, by day sent"><Daily data={d.daily} /></Card>
        <Card title="Your AI team" className="md:col-span-2"><AgentTrack /></Card>
      </div>
    </div>
  );
}

export const LAYOUTS: Record<ThemeName, (p: P) => React.ReactNode> = { signal: Signal, night: Night, field: Field, pop: Pop };
export const ABOUT: Record<ThemeName, { name: string; text: string }> = {
  signal: { name: "Signal", text: "Bright, bold and businesslike. Cobalt hero, tiles and score rings." },
  night: { name: "Night Desk", text: "Dark command center. Your relationships are the hero." },
  field: { name: "Field Report", text: "Editorial and calm. The dashboard reads like a story, the funnel is a landscape." },
  pop: { name: "Pop", text: "Playful and energetic. Color blocks, characters and cards." },
};
