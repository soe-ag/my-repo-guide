'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  repoName: string
}

export function DeleteAnalysisDialog({
  open,
  onOpenChange,
  onConfirm,
  repoName,
}: DeleteAnalysisDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <p className="editorial-kicker text-muted-foreground">Delete record</p>
          <DialogTitle>Delete Analysis</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the analysis for{' '}
            <span className="font-ui font-bold text-foreground">{repoName}</span>? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
