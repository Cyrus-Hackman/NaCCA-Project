"use client";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { UploadButton } from "./upload-button";
import { FileCard, FileCardSkeleton } from "./file-card";
import Image from "next/image";
import { GridIcon, RowsIcon } from "lucide-react";
import { SearchBar } from "./search-bar";
import { useState } from "react";
import { DataTable } from "./file-table";
import { columns } from "./columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Doc } from "../../../../convex/_generated/dataModel";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

function Placeholder() {
  return (
    <div className="flex flex-col gap-8 w-full items-center mt-24">
      <Image
        alt="an image of a picture and directory icon"
        width="300"
        height="300"
        src="/empty.svg"
      />
      <div className="text-2xl">You have no files, upload one now</div>
      <UploadButton />
    </div>
  );
}

export function FileBrowser({
  title,
  favoritesOnly,
  deletedOnly,
}: {
  title: string;
  favoritesOnly?: boolean;
  deletedOnly?: boolean;
}) {
  const organization = useOrganization();
  const user = useUser();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<Doc<"files">["type"] | "all">("all");

  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }

  const favorites = useQuery(
    api.files.getAllFavorites,
    orgId ? { orgId } : "skip"
  );

  const files = useQuery(
    api.files.getFiles,
    orgId
      ? {
          orgId,
          type: type === "all" ? undefined : type,
          query,
          favorites: favoritesOnly,
          deletedOnly,
        }
      : "skip"
  );
  const isLoading = files === undefined;

  const modifiedFiles =
    files?.map((file) => ({
      ...file,
      isFavorited: (favorites ?? []).some(
        (favorite) => favorite.fileId === file._id
      ),
    })) ?? [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <SearchBar query={query} setQuery={setQuery} />
          <UploadButton />
        </div>
      </div>

      <Tabs defaultValue="grid">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
          <TabsList>
            <TabsTrigger value="grid" className="flex gap-2 items-center">
              <GridIcon className="w-4 h-4" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="table" className="flex gap-2 items-center">
              <RowsIcon className="w-4 h-4" /> Table
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2 items-center">
            <Label htmlFor="type-select" className="text-sm whitespace-nowrap">Type Filter</Label>
            <Select
              value={type}
              onValueChange={(newType) => {
                setType(newType as any);
              }}
            >
              <SelectTrigger id="type-select" className="w-[140px] sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading && (
              <>
                <FileCardSkeleton />
                <FileCardSkeleton />
                <FileCardSkeleton />
                <FileCardSkeleton />
                <FileCardSkeleton />
                <FileCardSkeleton />
              </>
            )}
            {!isLoading && modifiedFiles?.map((file) => {
              return <FileCard key={file._id} file={file} />;
            })}
          </div>
        </TabsContent>
        <TabsContent value="table">
          {isLoading && (
            <div className="flex flex-col gap-4 mt-8">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {!isLoading && <DataTable columns={columns} data={modifiedFiles} />}
        </TabsContent>
      </Tabs>

      {!isLoading && files?.length === 0 && <Placeholder />}
    </div>
  );
}
