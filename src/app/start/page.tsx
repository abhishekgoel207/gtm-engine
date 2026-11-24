import { connection } from "next/server";
import { Suspense } from "react";
import { fromProduct } from "@/components/intake/answers";
import { Intake } from "@/components/intake/Intake";
import { PageHeader } from "@/components/shell/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { SEED } from "@/data/seed";
import { getCurrentProduct } from "@/services/product";

async function Content() {
  await connection();
  const product = getCurrentProduct();
  return <Intake saved={product ? fromProduct(product) : null} example={SEED.products[0]} />;
}

export default function StartPage() {
  return (
    <>
      <PageHeader title="Describe your product" help="Five short answers, about two minutes." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Content />
      </Suspense>
    </>
  );
}
