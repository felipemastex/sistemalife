
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';

const iconNames = ["Sword", "Swords", "Shield", "Heart", "Feather", "BookOpen", "BrainCircuit", "Code", "Star", "Target", "Mountain", "TreeDeciduous", "Users", "ShieldCheck"];

const colors = [
    { name: 'Vermelho', value: '185 28 28' },
    { name: 'Azul', value: '30 64 175' },
    { name: 'Verde', value: '22 101 52' },
    { name: 'Roxo', value: '107 33 168' },
    { name: 'Amarelo', value: '180 83 9' },
    { name: 'Cinza', value: '55 65 81' },
    { name: 'Rosa', value: '157 23 77' },
    { name: 'Ciano', value: '20 138 164' }
];

export const GuildForm = ({ onSave, userMetas, onCancel, guildToEdit = null }) => {
    const isEditing = !!guildToEdit;
    const [nome, setNome] = useState(guildToEdit?.nome || '');
    const [tag, setTag] = useState(guildToEdit?.tag || '');
    const [descricao, setDescricao] = useState(guildToEdit?.descricao || '');
    const [emblema_icon, setEmblemaIcon] = useState(guildToEdit?.emblema_icon || 'Shield');
    const [emblema_bg, setEmblemaBg] = useState(guildToEdit?.emblema_bg || '55 65 81');
    const [meta_principal_id, setMetaPrincipalId] = useState(guildToEdit?.meta_principal_id || '');

    const { toast } = useToast();

    const getIconComponent = (iconName) => {
        const Icon = LucideIcons[iconName];
        return Icon ? <Icon className="h-10 w-10 text-white" /> : null;
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

        const finalGuildData = {
            ...(guildToEdit || {}), // Keep existing data like id, members, quests etc.
            nome, 
            tag, 
            descricao, 
            emblema_icon, 
            emblema_bg, 
            meta_principal_id,
            join_requests: guildToEdit?.join_requests || [],
            quests: guildToEdit?.quests || [],
        };

        onSave(finalGuildData);
    };

    return (
        <div className="max-w-2xl mx-auto">
             <Button onClick={onCancel} variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {isEditing ? "Voltar ao Dashboard" : "Voltar ao Portal"}
            </Button>
            
            <Card className="bg-card/60">
                 <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle className="font-cinzel text-2xl text-primary">{isEditing ? 'Editar Guilda' : 'Forjar Nova Guilda'}</CardTitle>
                        <CardDescription>{isEditing ? 'Ajuste os detalhes da sua guilda.' : 'Crie um novo clã e comece a recrutar membros.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* Emblema Preview & Customization */}
                        <div className="flex flex-col sm:flex-row items-center gap-8">
                            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                <Label>Emblema</Label>
                                <div className="w-28 h-28 rounded-lg flex items-center justify-center transition-colors shadow-lg" style={{ backgroundColor: `rgb(${emblema_bg})` }}>
                                    {getIconComponent(emblema_icon)}
                                </div>
                            </div>
                            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="emblema-icon">Ícone</Label>
                                    <Select onValueChange={setEmblemaIcon} value={emblema_icon}>
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
                                    <Select onValueChange={setEmblemaBg} value={emblema_bg}>
                                        <SelectTrigger id="emblema-bg">
                                            <SelectValue placeholder="Escolha uma cor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <div className="grid grid-cols-4 gap-2 p-2">
                                            {colors.map(color => (
                                                <SelectItem key={color.value} value={color.value} className="p-0 m-0 focus:bg-transparent">
                                                <div className="w-full h-8 rounded-md cursor-pointer hover:opacity-80 flex items-center justify-center" style={{ backgroundColor: `rgb(${color.value})` }}>
                                                    <span className="text-white text-xs mix-blend-difference">{color.name}</span>
                                                </div>
                                                </SelectItem>
                                            ))}
                                            </div>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2">
                                    <Label htmlFor="guild-name">Nome da Guilda</Label>
                                    <Input id="guild-name" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Devs Lendários" />
                                </div>
                                <div>
                                    <Label htmlFor="guild-tag">Tag (3 letras)</Label>
                                    <Input id="guild-tag" value={tag} onChange={e => setTag(e.target.value.toUpperCase().slice(0,3))} maxLength={3} placeholder="Ex: LND" />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="guild-desc">Descrição</Label>
                                <Textarea id="guild-desc" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descreva o propósito e os valores da sua guilda..." />
                            </div>
                            <div>
                                <Label htmlFor="guild-meta">Meta Principal da Guilda</Label>
                                <Select onValueChange={setMetaPrincipalId} value={String(meta_principal_id)}>
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
                                    Esta é a missão principal que une os membros da sua guilda.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">
                            {isEditing ? 'Salvar Alterações' : 'Forjar Guilda'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};
