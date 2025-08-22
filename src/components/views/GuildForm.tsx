
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Wand2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const iconNames = ["Sword", "Swords", "Shield", "Heart", "Feather", "BookOpen", "BrainCircuit", "Code", "Star", "Target", "Mountain", "TreeDeciduous"];
const colors = ["bg-red-800", "bg-blue-800", "bg-green-800", "bg-purple-800", "bg-yellow-800", "bg-gray-800", "bg-pink-800", "bg-cyan-800"];


export const GuildForm = ({ onSave, userMetas, onCancel, guildToEdit = null }) => {
    const isEditing = !!guildToEdit;
    const [nome, setNome] = useState(guildToEdit?.nome || '');
    const [tag, setTag] = useState(guildToEdit?.tag || '');
    const [descricao, setDescricao] = useState(guildToEdit?.descricao || '');
    const [emblema_icon, setEmblemaIcon] = useState(guildToEdit?.emblema_icon || 'Shield');
    const [emblema_bg, setEmblemaBg] = useState(guildToEdit?.emblema_bg || 'bg-gray-800');
    const [meta_principal_id, setMetaPrincipalId] = useState(guildToEdit?.meta_principal_id || '');

    const { toast } = useToast();

    const getIconComponent = (iconName) => {
        const Icon = LucideIcons[iconName];
        return Icon ? <Icon className="h-8 w-8 text-white" /> : null;
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!nome || !tag || !descricao || !meta_principal_id) {
            toast({
                variant: 'destructive',
                title: 'Campos em Falta',
                description: 'Por favor, preencha todos os campos para criar a guilda.',
            });
            return;
        }

        onSave({ nome, tag, descricao, emblema_icon, emblema_bg, meta_principal_id });
    };

    return (
        <div className="max-w-2xl mx-auto">
             <Button onClick={onCancel} variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
            </Button>
            <h2 className="text-2xl font-bold text-primary mb-2">{isEditing ? 'Editar Guilda' : 'Forjar Nova Guilda'}</h2>
            <p className="text-muted-foreground mb-6">{isEditing ? 'Ajuste os detalhes da sua guilda.' : 'Crie um novo clã e comece a recrutar membros.'}</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Emblema Preview */}
                <div className="flex flex-col items-center">
                    <Label className="mb-2">Emblema da Guilda</Label>
                    <div className={`w-24 h-24 rounded-lg flex items-center justify-center transition-colors ${emblema_bg}`}>
                        {getIconComponent(emblema_icon)}
                    </div>
                </div>

                {/* Emblema Customization */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="emblema-icon">Ícone</Label>
                         <Select onValueChange={setEmblemaIcon} defaultValue={emblema_icon}>
                            <SelectTrigger id="emblema-icon">
                                <SelectValue placeholder="Escolha um ícone" />
                            </SelectTrigger>
                            <SelectContent>
                                {iconNames.map(name => (
                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="emblema-bg">Cor de Fundo</Label>
                         <Select onValueChange={setEmblemaBg} defaultValue={emblema_bg}>
                            <SelectTrigger id="emblema-bg">
                                <SelectValue placeholder="Escolha uma cor" />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="grid grid-cols-4 gap-2 p-2">
                                {colors.map(color => (
                                    <SelectItem key={color} value={color} className="p-0 m-0 focus:bg-transparent">
                                       <div className={`w-full h-8 rounded-md ${color} cursor-pointer hover:opacity-80`}/>
                                    </SelectItem>
                                ))}
                                </div>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="guild-name">Nome da Guilda</Label>
                        <Input id="guild-name" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Devs Lendários" />
                    </div>
                     <div>
                        <Label htmlFor="guild-tag">Tag (3 letras)</Label>
                        <Input id="guild-tag" value={tag} onChange={e => setTag(e.target.value.toUpperCase().slice(0,3))} maxLength={3} placeholder="Ex: LND" />
                    </div>
                     <div>
                        <Label htmlFor="guild-desc">Descrição</Label>
                        <Textarea id="guild-desc" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descreva o propósito e os valores da sua guilda..." />
                    </div>
                     <div>
                        <Label htmlFor="guild-meta">Meta Principal da Guilda</Label>
                         <Select onValueChange={setMetaPrincipalId} value={meta_principal_id}>
                            <SelectTrigger id="guild-meta">
                                <SelectValue placeholder="Selecione a meta principal..." />
                            </SelectTrigger>
                            <SelectContent>
                                {userMetas.length > 0 ? userMetas.map(meta => (
                                    <SelectItem key={meta.id} value={String(meta.id)}>{meta.nome}</SelectItem>
                                )) : <SelectItem value="none" disabled>Crie uma meta primeiro</SelectItem>}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Não tem uma meta adequada? Crie uma na aba "Metas" primeiro.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit">
                        {isEditing ? 'Salvar Alterações' : 'Forjar Guilda'}
                    </Button>
                </div>
            </form>
        </div>
    );
};
