"use client";

import { useEffect, useState } from "react";
import type { ApiUser } from "@/lib/userTypes";

type UseCurrentUserResult = {
  user: ApiUser | null;
  loading: boolean;
};

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user");
        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = (await res.json()) as { user: ApiUser };
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
}
