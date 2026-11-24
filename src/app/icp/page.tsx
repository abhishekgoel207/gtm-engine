import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Expansions } from "@/components/icp/Expansions";
import { IcpEditor } from "@/components/icp/IcpEditor";
import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { getExpansions } from "@/services/expansion";
import { getIcpForProduct } from "@/services/icp";
import { getCurrentProduct } from "@/services/product";

async function Content({ searchParams }: { searchParams: Promise<{ productId?: string | string[] }> }) {
  await connection();
  const asked = (await searchParams).productId;
  const productId = typeof asked === "string" ? asked : getCurrentProduct()?.id;
  const icp = productId ? getIcpForProduct(productId) : undefined;
  if (!icp) {
    if (productId) {
      return (
        <Link href="/start" className="flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-base text-primary-foreground md:w-72">
          Describe your product
        </Link>
      );
    }
    return <EmptyState message="No ideal customer yet. Describe your product first." />;
  }
  // The key resets the cards when a decision below adds an industry.
  return (
    <>
      <IcpEditor key={JSON.stringify(icp)} icp={icp} />
      <Expansions icpId={icp.id} expansions={getExpansions(icp.id)} />
    </>
  );
}

export default function IcpPage({ searchParams }: { searchParams: Promise<{ productId?: string | string[] }> }) {
  return (
    <>
      <PageHeader title="Ideal customer" help="This is who we think buys from you. Fix anything that looks wrong." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
