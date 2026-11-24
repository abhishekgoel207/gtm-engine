import { connection } from "next/server";
import { Suspense } from "react";
import { BuyersView } from "@/components/buyers/BuyersView";
import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { getBilling } from "@/providers/registry";
import { getBuyerRows } from "@/services/buyers";
import { getIcpForProduct } from "@/services/icp";
import { getCurrentProduct } from "@/services/product";

async function Content() {
  await connection();
  const rows = getBuyerRows();
  const product = getCurrentProduct();
  const icp = product && getIcpForProduct(product.id);
  if (rows.length === 0 && !icp) return <EmptyState message="No buyers yet." />;
  const canEnrich = await getBilling().canSpend("leads_enriched", 1);
  return <BuyersView rows={rows} icpId={icp?.id} icpApproved={icp?.status === "approved"} canEnrich={canEnrich} />;
}

export default function BuyersPage() {
  return (
    <>
      <PageHeader title="Buyers" help="People who look like a good fit. Every fact links to its source." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Content />
      </Suspense>
    </>
  );
}
