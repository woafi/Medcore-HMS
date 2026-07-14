import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRoleHome } from "@/lib/getRoleHome";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getRoleHome({ id: user.id, userid: user.userid, role: user.role }));
  }

  redirect("/login");
}
