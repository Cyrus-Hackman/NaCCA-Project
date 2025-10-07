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
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Doc } from "../../../../convex/_generated/dataModel";

const formSchema = z.object({
  title: z.string().min(1).max(200),
  file: z
    .custom<FileList>((val) => val instanceof FileList, "Required")
    .refine((files) => files.length > 0, `Required`),
});

export function UploadButton() {
  const { toast } = useToast();
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!orgId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Organization ID is missing. Please make sure you're logged in.",
      });
      return;
    }

    try {
      console.log("Starting upload process...");

      // Step 1: Generate upload URL
      const postUrl = await generateUploadUrl();
      console.log("Generated upload URL:", postUrl);

      const file = values.file[0];
      const fileType = file.type;
      console.log("File details:", {
        name: file.name,
        type: fileType,
        size: file.size
      });

      // Step 2: Upload file to Convex storage
      console.log("Uploading file to storage...");
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
      console.log("File uploaded successfully, storageId:", storageId);

      // Step 3: Map file type with more comprehensive type mapping
      const types = {
        // Images
        "image/png": "image",
        "image/jpeg": "image", 
        "image/jpg": "image",
        "image/gif": "image",
        "image/webp": "image",
        "image/svg+xml": "image",
        // PDF
        "application/pdf": "pdf",
        // CSV and Excel
        "text/csv": "csv",
        "application/vnd.ms-excel": "csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "csv",
        "text/plain": "csv",
      } as Record<string, Doc<"files">["type"]>;

      const mappedType = types[fileType];
      
      if (!mappedType) {
        toast({
          variant: "destructive",
          title: "Unsupported file type",
          description: `File type "${fileType}" is not supported. Please upload PNG, JPG, PDF, or CSV files.`,
        });
        return;
      }

      console.log("Creating file record with:", {
        name: values.title,
        fileId: storageId,
        orgId,
        type: mappedType
      });

      // Step 4: Create file record in database
      await createFile({
        name: values.title,
        fileId: storageId,
        orgId,
        type: mappedType,
      });

      console.log("File record created successfully");

      // Reset form and close dialog
      form.reset();
      setIsFileDialogOpen(false);

      toast({
        variant: "success",
        title: "File Uploaded Successfully",
        description: "Now everyone can view your file",
      });

    } catch (err) {
      console.error("Upload error:", err);
      toast({
        variant: "destructive",
        title: "Upload Failed",
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

              <FormField
                control={form.control}
                name="file"
                render={() => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        {...fileRef}
                        accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.csv,.txt,.xlsx,.xls"
                      />
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