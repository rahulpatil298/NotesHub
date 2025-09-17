import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { getNotes, createNote, updateNote, deleteNote, upgradeTenant } from '@/lib/api';
import { Note } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Plus, LogOut, Zap, AlertTriangle } from 'lucide-react';
import { NoteCard } from '@/components/notes/note-card';
import { CreateNoteModal } from '@/components/notes/create-note-modal';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

export default function Dashboard() {
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Fetch notes
  const { data: notes = [], isLoading, error } = useQuery<Note[]>({
    queryKey: ['/api/notes'],
    enabled: !!user,
  });

  const isFreePlan = user?.tenant.plan === 'free';
  const isAdmin = user?.role === 'Admin';
  const noteCount = notes.length;
  const canCreateNotes = !isFreePlan || noteCount < 3;
  const showUpgradeButton = isAdmin && isFreePlan;

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: ({ title, body }: { title: string; body: string }) => createNote(title, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({
        title: 'Success',
        description: 'Note created successfully',
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('Note limit reached')) {
        setShowUpgradeModal(true);
      }
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: ({ id, title, body }: { id: string; title: string; body: string }) => 
      updateNote(id, title, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({
        title: 'Success',
        description: 'Note updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({
        title: 'Success',
        description: 'Note deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Upgrade tenant mutation
  const upgradeMutation = useMutation({
    mutationFn: () => upgradeTenant(user!.tenant.slug),
    onSuccess: () => {
      // Update user in context
      const updatedUser = {
        ...user!,
        tenant: { ...user!.tenant, plan: 'pro' as const }
      };
      updateUser(updatedUser);
      
      toast({
        title: 'Success',
        description: 'Your tenant has been upgraded to Pro plan. You can now create unlimited notes.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateNote = async (title: string, body: string) => {
    if (editingNote) {
      await updateNoteMutation.mutateAsync({ id: editingNote._id!, title, body });
    } else {
      await createNoteMutation.mutateAsync({ title, body });
    }
    setEditingNote(null);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsCreateModalOpen(true);
  };

  const handleDeleteNote = (noteId: string) => {
    setDeleteNoteId(noteId);
  };

  const confirmDelete = () => {
    if (deleteNoteId) {
      deleteNoteMutation.mutate(deleteNoteId);
      setDeleteNoteId(null);
    }
  };

  const handleUpgrade = () => {
    upgradeMutation.mutate();
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingNote(null);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border min-h-screen">
          <div className="p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-semibold text-foreground">NotesHub</h1>
            </div>
          </div>
          
          <div className="p-6 border-b border-border">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground" data-testid="text-tenant-name">
                  {user.tenant.name}
                </span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full" data-testid="text-tenant-plan">
                  {user.tenant.plan.charAt(0).toUpperCase() + user.tenant.plan.slice(1)} Plan
                </span>
              </div>
              <div className="text-xs text-muted-foreground" data-testid="text-user-email">
                {user.email}
              </div>
              <div className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full inline-block" data-testid="text-user-role">
                {user.role}
              </div>
            </div>
          </div>
          
          <nav className="p-6">
            <ul className="space-y-2">
              <li>
                <div className="flex items-center space-x-3 text-foreground bg-muted rounded-lg px-3 py-2">
                  <FileText className="w-5 h-5" />
                  <span>My Notes</span>
                </div>
              </li>
            </ul>
          </nav>
          
          <div className="absolute bottom-6 left-6 right-6">
            <Button
              variant="destructive"
              className="w-full"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-card border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">My Notes</h2>
                <p className="text-muted-foreground mt-1">Organize your thoughts and ideas</p>
              </div>
              
              <div className="flex items-center space-x-4">
                {showUpgradeButton && (
                  <Button
                    variant="secondary"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={handleUpgrade}
                    disabled={upgradeMutation.isPending}
                    data-testid="button-upgrade"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {upgradeMutation.isPending ? 'Upgrading...' : 'Upgrade to Pro'}
                  </Button>
                )}
                
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  disabled={!canCreateNotes}
                  data-testid="button-create-note"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Note
                </Button>
              </div>
            </div>
            
            {/* Plan Status */}
            {isFreePlan && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg" data-testid="status-plan-limit">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-800 text-sm font-medium">Free Plan Limit:</span>
                  <span className="text-amber-700 text-sm" data-testid="text-note-count">
                    {noteCount} of 3 notes used
                  </span>
                </div>
              </div>
            )}
          </header>
          
          {/* Notes Grid */}
          <main className="p-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded mb-1"></div>
                      <div className="h-3 bg-muted rounded mb-4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Notes</h3>
                <p className="text-muted-foreground mb-6">
                  {error instanceof Error ? error.message : 'Failed to load notes'}
                </p>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12" data-testid="empty-state">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No notes yet</h3>
                <p className="text-muted-foreground mb-6">Create your first note to get started organizing your thoughts.</p>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  disabled={!canCreateNotes}
                  data-testid="button-create-first-note"
                >
                  Create First Note
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="notes-grid">
                {notes.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    authorEmail={user.email}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Create/Edit Note Modal */}
      <CreateNoteModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateNote}
        editNote={editingNote}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteNoteId}
        onClose={() => setDeleteNoteId(null)}
        onConfirm={confirmDelete}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />

      {/* Upgrade Required Modal */}
      <ConfirmationModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onConfirm={() => {
          setShowUpgradeModal(false);
          if (isAdmin) {
            handleUpgrade();
          }
        }}
        title="Note Limit Reached"
        description="You've reached the 3-note limit for the Free plan. Upgrade to Pro for unlimited notes."
        confirmText={isAdmin ? "Upgrade Now" : "OK"}
        cancelText="Cancel"
      />
    </div>
  );
}
