// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth/auth";

export async function GET(request: Request) {
  return auth.handler(request);
}

export async function POST(request: Request) {
  return auth.handler(request);
}
