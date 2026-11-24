"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NEGATIVE_RULES, type NegativeRule } from "@/config/negativeRules";
import { api } from "@/lib/api";

export function RuleToggles({ disabled }: { disabled: string[] }) {
  const router = useRouter();
  const change = async (rule: NegativeRule, enabled: boolean) => {
    try {
      await api("/api/settings", "PATCH", { rule, enabled });
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  return (
    <section className="mt-6">
      <h2 className="mb-2 font-semibold">Hide buyers when</h2>
      <ul className="divide-y rounded-xl border bg-card">
        {(Object.keys(NEGATIVE_RULES) as NegativeRule[]).map((rule) => (
          <li key={rule}>
            <label className="flex min-h-12 items-center gap-3 px-4">
              <input type="checkbox" className="size-5" checked={!disabled.includes(rule)} onChange={(e) => change(rule, e.target.checked)} />
              {NEGATIVE_RULES[rule]}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
