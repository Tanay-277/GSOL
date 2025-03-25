import { TUser } from "@/types";
import { useSession } from "next-auth/react";

export const useUser = () => {
  const { data: session } = useSession();

  return {
    user: session?.user as TUser,
  };
};
