import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Note } from '@shared/schema';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, body: string) => Promise<void>;
  editNote?: Note | null;
}

export function CreateNoteModal({ isOpen, onClose, onSubmit, editNote }: CreateNoteModalProps) {
  const [title, setTitle] = useState(editNote?.title || '');
  const [body, setBody] = useState(editNote?.body || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !body.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(title.trim(), body.trim());
      setTitle('');
      setBody('');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!editNote) {
      setTitle('');
      setBody('');
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-2xl" data-testid="modal-create-note">
        <DialogHeader>
          <DialogTitle>
            {editNote ? 'Edit Note' : 'Create New Note'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="noteTitle">Title</Label>
            <Input
              id="noteTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title"
              required
              disabled={isLoading}
              data-testid="input-note-title"
            />
          </div>
          
          <div>
            <Label htmlFor="noteBody">Content</Label>
            <Textarea
              id="noteBody"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your note content here..."
              rows={8}
              required
              disabled={isLoading}
              className="resize-vertical"
              data-testid="textarea-note-body"
            />
          </div>
          
          <div className="flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              data-testid="button-submit-note"
            >
              {isLoading ? 'Saving...' : editNote ? 'Update Note' : 'Create Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
