import icpFixture from "@/data/fixtures/icp.json";
import { list } from "@/lib/store";
import { type Company, type Competitor, type ICP, ICPSchema, type Person, type Product, type Signal } from "@/lib/types";
import { getCurrentProduct } from "./product";

/** The rep's ideal customer, or the demo's when the demo product has none yet. */
export function getWorkingIcp(): ICP | undefined {
  const icps = list("icps");
  const product = getCurrentProduct();
  const own = icps.filter((i) => i.productId === product?.id).at(-1);
  if (own) return own;
  return product?.id === icpFixture.productId ? ICPSchema.parse(icpFixture) : undefined;
}

export interface Context {
  product?: Product;
  icp?: ICP;
  companies: Map<string, Company>;
  people: Map<string, Person>;
  signals: Signal[];
  competitors: Competitor[];
}

export function getContext(): Context {
  return {
    product: getCurrentProduct(),
    icp: getWorkingIcp(),
    companies: new Map(list("companies").map((c) => [c.id, c])),
    people: new Map(list("people").map((p) => [p.id, p])),
    signals: list("signals"),
    competitors: list("competitors"),
  };
}
