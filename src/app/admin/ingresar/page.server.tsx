import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin/session";
import { login } from "../actions";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ingresar" };

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin/productos");
  return <LoginForm action={login} />;
}
