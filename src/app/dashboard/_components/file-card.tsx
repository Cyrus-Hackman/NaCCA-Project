import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelative } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

import { Doc } from "../../../../convex/_generated/dataModel";
import { FileTextIcon, GanttChartIcon, ImageIcon } from "lucide-react";
import { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Image from "next/image";
import { FileCardActions } from "./file-actions";

export function FileCard({
  file,
}: {
  file: Doc<"files"> & { isFavorited: boolean; url: string | null };
}) {
  const userProfile = useQuery(api.users.getUserProfile, {
    userId: file.userId,
  });

  const typeIcons = {
    image: <ImageIcon />,
    pdf: <FileTextIcon />,
    csv: <GanttChartIcon />,
  } as Record<Doc<"files">["type"], ReactNode>;

  return (
    <Card className="group relative hover:shadow-2xl hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 ease-in-out overflow-hidden flex flex-col justify-between">
      <CardHeader className="relative">
        <CardTitle className="flex gap-2 text-base font-normal">
          <div className="flex justify-center">{typeIcons[file.type]}</div>{" "}
          {file.name}
        </CardTitle>
        <div className="absolute top-2 right-2">
          <FileCardActions isFavorited={file.isFavorited} file={file} />
        </div>
      </CardHeader>
      <CardContent className="relative h-[200px] w-full flex justify-center items-center overflow-hidden bg-gray-50 dark:bg-gray-900 border-y">
        {file.type === "image" && file.url && (
          <Image 
            alt={file.name} 
            fill 
            className="object-cover transition-transform duration-500 group-hover:scale-110" 
            src={file.url} 
          />
        )}

        {file.type === "csv" && <GanttChartIcon className="w-20 h-20 text-gray-300 group-hover:text-primary transition-all duration-300 group-hover:scale-110" />}
        {file.type === "pdf" && <FileTextIcon className="w-20 h-20 text-gray-300 group-hover:text-primary transition-all duration-300 group-hover:scale-110" />}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2 text-xs text-gray-700 w-40 items-center">
          <Avatar className="w-6 h-6">
            <AvatarImage src={userProfile?.image} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          {userProfile?.name}
        </div>
        <div className="text-xs text-gray-700">
          Uploaded on {formatRelative(new Date(file._creationTime), new Date())}
        </div>
      </CardFooter>
    </Card>
  );
}

export function FileCardSkeleton() {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="relative">
        <CardTitle className="flex gap-2 text-base font-normal">
          <Skeleton className="w-6 h-6 rounded-md" />
          <Skeleton className="w-32 h-6" />
        </CardTitle>
        <div className="absolute top-2 right-2">
          <Skeleton className="w-8 h-8 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="h-[200px] flex justify-center items-center overflow-hidden border-y">
        <Skeleton className="w-full h-full" />
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2 text-xs text-gray-700 w-40 items-center">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="w-20 h-4" />
        </div>
        <Skeleton className="w-24 h-4" />
      </CardFooter>
    </Card>
  );
}
