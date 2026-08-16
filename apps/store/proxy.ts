import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const protectedRoutes = ["/account", "/dashboard", "/orders", "/wishlist", "/addresses", "/settings", "/profile"];

export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const isProtected = protectedRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`)
  );

  if (!userId && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
