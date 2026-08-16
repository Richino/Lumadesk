"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { productSchema, slugify, type ProductFormValues } from "@/lib/validation/products";
import { createProduct, updateProduct } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props =
  | { mode: "create"; product?: undefined }
  | { mode: "edit"; product: { id: string } & ProductFormValues };

export function ProductForm(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [slugEdited, setSlugEdited] = useState(props.mode === "edit");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues:
      props.mode === "edit"
        ? {
            name: props.product.name,
            slug: props.product.slug,
            description: props.product.description,
            active: props.product.active,
          }
        : { name: "", slug: "", description: "", active: false },
  });

  const active = watch("active");
  const name = watch("name");

  function onNameChange(value: string) {
    setValue("name", value, { shouldValidate: true });
    if (!slugEdited) setValue("slug", slugify(value), { shouldValidate: true });
  }

  function onSubmit(values: ProductFormValues) {
    startTransition(async () => {
      if (props.mode === "create") {
        const result = await createProduct(values);
        if (result.ok && result.data) {
          toast.success("Product created.");
          router.push(`/products/${result.data.id}`);
          router.refresh();
        } else if (!result.ok) {
          toast.error(result.error);
        }
      } else {
        const result = await updateProduct(props.product.id, values);
        if (result.ok) {
          toast.success("Product saved.");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Product details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="LumaDesk Pro" />
              {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                {...register("slug")}
                onChange={(e) => {
                  setSlugEdited(true);
                  setValue("slug", e.target.value, { shouldValidate: true });
                }}
                placeholder="lumadesk-pro"
                className="font-mono text-xs"
              />
              {errors.slug && <p className="text-xs text-rose-400">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={5} {...register("description")} placeholder="A made-to-order standing desk…" />
            {errors.description && <p className="text-xs text-rose-400">{errors.description.message}</p>}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">{active ? "Published" : "Draft"}</p>
              <p className="text-xs text-muted-foreground">
                {active ? "Visible to customers on the storefront." : "Hidden from the storefront."}
              </p>
            </div>
            <Switch checked={active} onCheckedChange={(checked) => setValue("active", checked)} />
          </div>

          <div className="flex justify-end gap-2">
            {props.mode === "create" && (
              <Button type="button" variant="ghost" onClick={() => router.push("/products")} disabled={isPending}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {props.mode === "create" ? "Create product" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
