
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const AnnouncementForm = ({ open, onOpenChange, onSave, announcementToEdit = null }: { open: boolean, onOpenChange: (isOpen: boolean) => void, onSave: (content: string) => void, announcementToEdit: any | null }) => {
    const [content, setContent] = useState(announcementToEdit?.content || '');

    const handleSave = () => {
        if (content.trim()) {
            onSave(content);
            onOpenChange(false);
            setContent('');
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) setContent(''); onOpenChange(isOpen); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{announcementToEdit ? 'Editar Anúncio' : 'Novo Anúncio'}</DialogTitle>
                    <DialogDescription>
                        Comunique informações importantes para todos os membros da guilda.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Digite o seu anúncio aqui..."
                        className="min-h-[120px]"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave}>
                        {announcementToEdit ? 'Salvar Alterações' : 'Publicar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export const GuildAnnouncements = ({ guild, onGuildUpdate, canManage, userProfile }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [announcementToEdit, setAnnouncementToEdit] = useState(null);

    const announcements = guild.announcements || [];
    const sortedAnnouncements = [...announcements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleSave = (content) => {
        let updatedAnnouncements;
        if (announcementToEdit) {
            // Editing
            updatedAnnouncements = announcements.map(ann => 
                ann.id === announcementToEdit.id ? { ...ann, content, edited_at: new Date().toISOString() } : ann
            );
        } else {
            // Creating
            const newAnnouncement = {
                id: `ann_${Date.now()}`,
                author_id: userProfile.id,
                author_name: userProfile.nome_utilizador,
                author_avatar: userProfile.avatar_url,
                content,
                date: new Date().toISOString(),
            };
            updatedAnnouncements = [newAnnouncement, ...announcements];
        }
        onGuildUpdate({...guild, announcements: updatedAnnouncements});
    };

    const handleDelete = (id) => {
        const updatedAnnouncements = announcements.filter(ann => ann.id !== id);
        onGuildUpdate({...guild, announcements: updatedAnnouncements});
    };

    const handleOpenEdit = (ann) => {
        setAnnouncementToEdit(ann);
        setIsFormOpen(true);
    };
    
    const handleOpenCreate = () => {
        setAnnouncementToEdit(null);
        setIsFormOpen(true);
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>Anúncios</CardTitle>
                    <CardDescription>Notícias da Guilda</CardDescription>
                </div>
                {canManage && (
                    <Button size="icon" variant="ghost" onClick={handleOpenCreate}>
                        <PlusCircle />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="flex-grow p-4 space-y-4 overflow-y-auto">
                {sortedAnnouncements.length > 0 ? (
                    sortedAnnouncements.map(ann => {
                         const canEditOrDelete = userProfile.id === ann.author_id || userProfile.guild_role === 'Líder';
                         return (
                            <div key={ann.id} className="p-3 bg-secondary/50 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8 mt-1">
                                        <AvatarImage src={ann.author_avatar} />
                                        <AvatarFallback>{ann.author_name?.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-sm">{ann.author_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(ann.date), { addSuffix: true, locale: ptBR })}
                                                    {ann.edited_at && ' (editado)'}
                                                </p>
                                            </div>
                                             {canEditOrDelete && (
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(ann)}><Edit className="h-4 w-4"/></Button>
                                                     <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-400"><Trash2 className="h-4 w-4"/></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Excluir Anúncio?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Esta ação não pode ser desfeita. Tem a certeza que quer excluir este anúncio?
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(ann.id)}>Sim, Excluir</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            )}
                                        </div>
                                        <p className="mt-2 text-sm whitespace-pre-wrap">{ann.content}</p>
                                    </div>
                                </div>
                            </div>
                         )
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4 border-2 border-dashed border-border rounded-lg">
                        <p className="font-semibold">Nenhum anúncio recente.</p>
                        <p className="text-sm mt-1">A liderança pode publicar um novo anúncio.</p>
                    </div>
                )}
            </CardContent>
             <AnnouncementForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSave={handleSave}
                announcementToEdit={announcementToEdit}
            />
        </Card>
    )
}
