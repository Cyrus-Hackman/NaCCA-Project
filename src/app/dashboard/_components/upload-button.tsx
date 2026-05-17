"use client";

import { Button } from "@/components/ui/button";
import { useOrganization, useUser } from "@clerk/nextjs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Doc } from "../../../../convex/_generated/dataModel";

import { useDropzone } from "react-dropzone";
import { useCallback } from "react";

const formSchema = z.object({
  title: z.string().max(200).optional(),
  file: z
    .custom<FileList | File[]>((val) => val instanceof FileList || Array.isArray(val), "Required")
    .refine((files) => files.length > 0, `Required`),
});

export function UploadButton() {
  const organization = useOrganization();
  const user = useUser();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createFile = useMutation(api.files.createFile);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      file: undefined,
    },
  });

  const fileRef = form.register("file");

  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);

  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    form.setValue("file", acceptedFiles);
    form.clearErrors("file");
    
    // Auto-fill the title if it's currently empty and only 1 file is dropped
    if (!form.getValues("title") && acceptedFiles.length === 1) {
      form.setValue("title", acceptedFiles[0].name);
    }
  }, [form]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "text/csv": [".csv"],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!orgId) {
      toast.error("Error", {
        description: "Organization ID is missing. Please make sure you're logged in.",
      });
      return;
    }

    try {
      const files = Array.from(values.file);
      
      await Promise.all(
        files.map(async (file) => {
          const fileType = file.type;
          
          const types = {
            "image/png": "image",
            "image/jpeg": "image", 
            "image/jpg": "image",
            "image/gif": "image",
            "image/webp": "image",
            "image/svg+xml": "image",
            "application/pdf": "pdf",
            "text/csv": "csv",
            "application/vnd.ms-excel": "csv",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "csv",
            "text/plain": "csv",
          } as Record<string, Doc<"files">["type"]>;

          const mappedType = types[fileType];
          
          if (!mappedType) {
            throw new Error(`File type "${fileType}" is not supported.`);
          }

          const postUrl = await generateUploadUrl();

          const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": fileType },
            body: file,
          });

          if (!result.ok) {
            const errorText = await result.text();
            throw new Error(`Upload failed with status: ${result.status}. ${errorText}`);
          }

          const uploadResult = await result.json();
          const { storageId } = uploadResult;

          const titleToUse = files.length === 1 && values.title ? values.title : file.name;

          await createFile({
            name: titleToUse,
            fileId: storageId,
            orgId: orgId!,
            type: mappedType,
          });
        })
      );

      // Reset form and close dialog
      form.reset();
      setIsFileDialogOpen(false);

      toast.success("Files Uploaded Successfully", {
        description: "Now everyone can view your files",
      });

    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload Failed", {
        description: err instanceof Error ? err.message : "Your file could not be uploaded, try again later",
      });
    }
  }

  return (
    <Dialog
      open={isFileDialogOpen}
      onOpenChange={(isOpen) => {
        setIsFileDialogOpen(isOpen);
        form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>Upload File</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="mb-8">Upload your File Here</DialogTitle>
          <DialogDescription>
            This file will be accessible by anyone in your organization
          </DialogDescription>
        </DialogHeader>

        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {(!form.watch("file") || form.watch("file")!.length <= 1) && (
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="file"
                render={() => (
                  <FormItem>
                    <FormLabel>File{(form.watch("file")?.length ?? 0) > 1 ? "s" : ""}</FormLabel>
                    <FormControl>
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                          isDragActive ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary"
                        }`}
                      >
                        <input {...getInputProps()} />
                        {form.watch("file") && form.watch("file")!.length > 0 ? (
                          <div className="text-sm font-medium text-primary">
                            {form.watch("file")!.length === 1 
                              ? `Selected: ${form.watch("file")![0].name}`
                              : `Selected: ${form.watch("file")!.length} files`}
                          </div>
                        ) : isDragActive ? (
                          <p className="text-primary font-medium">Drop the files here ...</p>
                        ) : (
                          <p className="text-gray-500">Drag &apos;n&apos; drop files here, or click to select</p>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="flex gap-1"
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Submit
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}