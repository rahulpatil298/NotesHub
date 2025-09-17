import { Note } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { formatDistance } from 'date-fns';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  authorEmail?: string;
}

export function NoteCard({ note, onEdit, onDelete, authorEmail }: NoteCardProps) {
  const createdAt = note.createdAt ? new Date(note.createdAt) : new Date();
  const timeAgo = formatDistance(createdAt, new Date(), { addSuffix: true });

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-note-${note._id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-foreground truncate" data-testid={`text-note-title-${note._id}`}>
            {note.title}
          </h3>
          <div className="flex items-center space-x-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(note)}
              data-testid={`button-edit-${note._id}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(note._id!)}
              data-testid={`button-delete-${note._id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-3" data-testid={`text-note-body-${note._id}`}>
          {note.body}
        </p>
        <div className="flex items-center text-xs text-muted-foreground">
          <span data-testid={`text-note-date-${note._id}`}>Created {timeAgo}</span>
          {authorEmail && (
            <>
              <span className="mx-2">•</span>
              <span data-testid={`text-note-author-${note._id}`}>{authorEmail}</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
