"use server"

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function logoutAction() {
    const cookieStore = await cookies();

    cookieStore.delete({
        name: "accessToken",
        path: "/",
    });

    revalidatePath("/");
    redirect("/");
}