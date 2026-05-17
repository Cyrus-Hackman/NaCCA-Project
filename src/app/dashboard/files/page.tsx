"use client";

import { FileBrowser } from "../_components/file-browser";
import { useUser } from "@clerk/nextjs";

export default function FilesPage() {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Please sign in to view your files.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <FileBrowser title="Your Files" />
    </div>
  );
}
    