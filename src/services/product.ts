import { nanoid } from "nanoid";
import { logAudit } from "@/lib/audit";
import { AppError } from "@/lib/http";
import { REP } from "@/lib/rep";
import { list, remove, upsert } from "@/lib/store";
import { type Product, ProductSchema } from "@/lib/types";

export const ProductInputSchema = ProductSchema.omit({ id: true }).extend({ id: ProductSchema.shape.id.optional() });

const PLAIN: Record<string, string> = {
  name: "Tell us what your product is called.",
  description: "Tell us what you sell.",
  features: "Add at least one feature.",
  acvUsd: "The typical deal size can't be negative.",
};

/** The product the rep saved last. */
export const getCurrentProduct = (): Product | undefined => list("products").at(-1);

export function saveProduct(body: unknown): Product {
  const parsed = ProductInputSchema.safeParse(body);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0].path[0] ?? "");
    throw new AppError(400, PLAIN[field] ?? "Some answers are missing. Check them and try again.");
  }
  if (parsed.data.features.length === 0) throw new AppError(400, PLAIN.features);

  const same = list("products").find((p) => p.id === parsed.data.id || p.name === parsed.data.name);
  const product = { ...parsed.data, id: same?.id ?? parsed.data.id ?? `prod_${nanoid(8)}` };
  // Re-added so it becomes the current one.
  remove("products", product.id);
  upsert("products", product);
  logAudit({ ...REP, action: "product.saved", details: `Saved ${product.name}` });
  return product;
}
