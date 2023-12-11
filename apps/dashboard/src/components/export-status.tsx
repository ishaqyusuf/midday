"use client";

import { shareFileAction } from "@/actions/share-file-action";
import { useExportStore } from "@/store/export";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
import { useEventRunStatuses } from "@trigger.dev/react";
import ms from "ms";
import { useAction } from "next-safe-action/hook";
import { useEffect, useState } from "react";

const options = [
  {
    label: "Expire in 1 week",
    expireIn: ms("1 week"),
  },
  {
    label: "Expire in 1 month",
    expireIn: ms("1 month"),
  },
  {
    label: "Expire in 1 year",
    expireIn: ms("1 year"),
  },
];

export function ExportStatus() {
  const { toast, dismiss, update } = useToast();
  const [toastId, setToastId] = useState(null);
  const { exportId, setExportId } = useExportStore();
  const { error, statuses } = useEventRunStatuses(exportId);
  const status = statuses?.at(0);

  const shareFile = useAction(shareFileAction, {
    onSuccess: async (url) => {
      try {
        await navigator.clipboard.writeText(url);

        toast({
          duration: 2500,
          title: "Copied URL to clipboard.",
          variant: "success",
        });
      } catch {
        toast({
          duration: 2500,
          variant: "error",
          title: "Something went wrong pleaase try again.",
        });
      }
    },
  });

  const handleOnDownload = (id: string) => {
    console.log("download");
    dismiss(id);
  };

  const handleOnShare = ({ id, expireIn }) => {
    shareFile.execute({ expireIn, filepath: "exports/export-123.zip" });
    dismiss(id);
  };

  useEffect(() => {
    if (exportId && !toastId) {
      const { id } = toast({
        title: "Exporting transactions.",
        variant: "progress",
        description: "Please do not close browser until completed",
        duration: Infinity,
        progress: 0,
      });

      setToastId(id);
    } else {
      update(toastId, {
        progress: status?.data?.progress,
      });
    }

    if (status?.data?.progress === 100) {
      const { id } = toast({
        title: "Export completed",
        description: `Your export is ready based on ${status?.data?.totalItems} transactions.`,
        duration: Infinity,
        footer: (
          <div className="mt-4 flex space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="border space-x-2"
                >
                  <span>Get URL</span>
                  <Icons.ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-[100]">
                {options.map((option) => (
                  <DropdownMenuItem
                    key={option.expireIn}
                    onClick={() =>
                      handleOnShare({ id, expireIn: option.expireIn })
                    }
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <a href={`/api/download/file?path=katt&filename=katt.zip`} download>
              <Button size="sm" onClick={() => handleOnDownload(id)}>
                Download
              </Button>
            </a>
          </div>
        ),
      });

      setToastId(null);
      setExportId(undefined);
    }
  }, [exportId, toastId, status]);

  useEffect(() => {
    if (error) {
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });

      setToastId(null);
      setExportId(undefined);
    }
  }, [error]);

  return null;
}