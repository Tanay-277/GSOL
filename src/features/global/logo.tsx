"use client";

import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { Gem } from "lucide-react";
import Link from "next/link";

type Props = {
  text?: string;
  show?: boolean;
};

const Logo = ({ text, show = true }: Props) => {
  const { user } = useUser();

  return (
    <Link
      href={user ? "/dashboard" : "/"}
      className="relative flex items-center"
    >
      <div
        className={cn(
          "relative flex h-8 w-fit items-center justify-center rounded-lg",
        )}
      >
        <Gem />
        {show ? (
          <span className={cn("px-2 pt-1 text-xl font-bold", text)}>
            Progresso AI
          </span>
        ) : null}
      </div>
    </Link>
  );
};

export default Logo;
