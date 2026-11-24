"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { COMPANY_COPY } from "@/lib/company/copy";

interface CompanyLimitsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoToDocuments: () => void;
}

export function CompanyLimitsModal({
  open,
  onOpenChange,
  onGoToDocuments,
}: CompanyLimitsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{COMPANY_COPY.limits.modal.title}</DialogTitle>
        <DialogDescription>
          {COMPANY_COPY.limits.modal.description}
        </DialogDescription>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onGoToDocuments();
            }}
          >
            {COMPANY_COPY.limits.modal.goToDocuments}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            {COMPANY_COPY.limits.modal.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
