"use client";

import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { FileIcon, StarIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SideNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-row md:flex-col gap-1 md:w-44 w-full overflow-x-auto pb-2 md:pb-0">
      <Link href="/dashboard/files">
        <Button
          variant={"ghost"}
          className={clsx("flex gap-2 w-full justify-start px-3 rounded-lg", {
            "bg-primary/10 text-primary font-semibold": pathname.includes("/dashboard/files"),
            "text-muted-foreground hover:text-foreground": !pathname.includes("/dashboard/files"),
          })}
        >
          <FileIcon className="w-4 h-4" /> All Files
        </Button>
      </Link>

      <Link href="/dashboard/favorites">
        <Button
          variant={"ghost"}
          className={clsx("flex gap-2 w-full justify-start px-3 rounded-lg", {
            "bg-primary/10 text-primary font-semibold": pathname.includes("/dashboard/favorites"),
            "text-muted-foreground hover:text-foreground": !pathname.includes("/dashboard/favorites"),
          })}
        >
          <StarIcon className="w-4 h-4" /> Favorites
        </Button>
      </Link>

      <Link href="/dashboard/trash">
        <Button
          variant={"ghost"}
          className={clsx("flex gap-2 w-full justify-start px-3 rounded-lg", {
            "bg-primary/10 text-primary font-semibold": pathname.includes("/dashboard/trash"),
            "text-muted-foreground hover:text-foreground": !pathname.includes("/dashboard/trash"),
          })}
        >
          <TrashIcon className="w-4 h-4" /> Trash
        </Button>
      </Link>
    </div>
  );
}
