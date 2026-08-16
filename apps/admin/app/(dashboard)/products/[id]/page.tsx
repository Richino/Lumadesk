import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getProduct } from "@/lib/queries/products";
import { dateShort } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ProductForm } from "@/components/products/product-form";
import { ProductActions } from "@/components/products/product-actions";
import { VariantsManager } from "@/components/products/variants-manager";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getProduct(id);
  return { title: data?.product.name ?? "Product" };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProduct(id);
  if (!data) notFound();

  const { product, variants } = data;

  return (
    <div className="space-y-6">
      <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">{product.name}</h1>
            {product.active ? <Badge variant="success">Published</Badge> : <Badge variant="muted">Draft</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{product.slug}</span> · Created {dateShort(product.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProductActions productId={product.id} active={product.active} />
        </div>
      </div>

      <div className="space-y-6">
        <ProductForm
          mode="edit"
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            active: product.active,
          }}
        />
        <VariantsManager productId={product.id} variants={variants} />
      </div>
    </div>
  );
}
