import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { authOptions } from "./api/auth/[...nextauth]/auth";

export default async function middleware() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return redirect("/");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
