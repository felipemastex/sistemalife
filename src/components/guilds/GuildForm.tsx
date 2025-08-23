
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const iconNames = ["Sword", "Swords", "Shield", "Heart", "Feather", "BookOpen", "BrainCircuit", "Code", "Star", "Target", "Mountain", "TreeDeciduous", "Users", "ShieldCheck"];

const colors = [
    { name: 'Vermelho', value: '220 59% 50%' },
    { name: 'Azul', value: '221 83% 53%' },
    { name: 'Verde', value: '142 76% 36%' },
    { name: 'Roxo', value: '262 84% 59%' },
    { name: 'Laranja', value: '25 95% 53%' },
    { name: 'Cinza', value: '215 28% 48%' },
    { name: 'Rosa', value: '330 81% 60%' },
    { name: 'Ciano', value: '180 83% 44%' }
];

const guildFormSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }).max(50, { message: "O nome não pode ter mais de 50 caracteres." }),
  tag: z.string().length(3, { message: "A tag deve ter exatamente 3 caracteres." }).regex(/^[A-Z0-9]+$/, { message: "A tag só pode conter letras maiúsculas e números."}),
  descricao: z.string().min(10, { message: "A descrição deve ter pelo menos 10 caracteres." }).max(200, { message: "A descrição não pode ter mais de 200 caracteres." }),
  emblema_icon: z.string(),
  emblema_bg: z.string(),
  meta_principal_id: z.string({ required_error: "Por favor, selecione uma meta principal." }),
});

export const GuildForm = ({ onSave, userMetas, onCancel, guildToEdit = null }) => {
    const isEditing = !!guildToEdit;
    const { toast } = useToast();

    const form = useForm<z.infer<typeof guildFormSchema>>({
        resolver: zodResolver(guildFormSchema),
        defaultValues: {
            nome: guildToEdit?.nome || '',
            tag: guildToEdit?.tag || '',
            descricao: guildToEdit?.descricao || '',
            emblema_icon: guildToEdit?.emblema_icon || 'Shield',
            emblema_bg: guildToEdit?.emblema_bg || '215 28% 48%',
            meta_principal_id: guildToEdit?.meta_principal_id ? String(guildToEdit.meta_principal_id) : undefined,
        },
    });

    const getIconComponent = (iconName) => {
        const Icon = LucideIcons[iconName];
        return Icon ? <Icon className="h-10 w-10 text-white" /> : null;
    };
    
    function onSubmit(data: z.infer<typeof guildFormSchema>) {
        const finalGuildData = {
            ...(guildToEdit || {}), // Keep existing data like id, members, quests etc.
            ...data,
            meta_principal_id: Number(data.meta_principal_id),
            join_requests: guildToEdit?.join_requests || [],
            quests: guildToEdit?.quests || [],
        };
        onSave(finalGuildData);
    }
    
    const watchEmblemaIcon = form.watch('emblema_icon');
    const watchEmblemaBg = form.watch('emblema_bg');

    return (
        <div className="max-w-2xl mx-auto">
             <Button onClick={onCancel} variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {isEditing ? "Voltar ao Dashboard" : "Voltar ao Portal"}
            </Button>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card className="bg-card/60">
                        <CardHeader>
                            <CardTitle className="font-cinzel text-2xl text-primary">{isEditing ? 'Editar Guilda' : 'Forjar Nova Guilda'}</CardTitle>
                            <CardDescription>{isEditing ? 'Ajuste os detalhes da sua guilda.' : 'Crie um novo clã e comece a recrutar membros.'}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="flex flex-col sm:flex-row items-center gap-8">
                                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                    <Label>Emblema</Label>
                                    <div className="w-28 h-28 rounded-lg flex items-center justify-center transition-colors shadow-lg" style={{ backgroundColor: `hsl(${watchEmblemaBg})` }}>
                                        {getIconComponent(watchEmblemaIcon)}
                                    </div>
                                </div>
                                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="emblema_icon"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ícone</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger><SelectValue placeholder="Escolha um ícone" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {iconNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="emblema_bg"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cor de Fundo</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger><SelectValue placeholder="Escolha uma cor" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <div className="grid grid-cols-4 gap-2 p-2">
                                                            {colors.map(color => (
                                                                <SelectItem key={color.value} value={color.value} className="p-0 m-0 focus:bg-transparent">
                                                                    <div className="w-full h-8 rounded-md cursor-pointer hover:opacity-80 flex items-center justify-center" style={{ backgroundColor: `hsl(${color.value})` }}>
                                                                        <span className="text-white text-xs mix-blend-difference">{color.name}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </div>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="nome"
                                        render={({ field }) => (
                                            <FormItem className="sm:col-span-2">
                                                <FormLabel>Nome da Guilda</FormLabel>
                                                <FormControl><Input placeholder="Ex: Devs Lendários" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="tag"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tag (3 letras)</FormLabel>
                                                <FormControl><Input maxLength={3} placeholder="Ex: LND" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="descricao"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descrição</FormLabel>
                                            <FormControl><Textarea placeholder="Descreva o propósito e os valores da sua guilda..." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="meta_principal_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Meta Principal da Guilda</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="Selecione a meta principal..." /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {userMetas.length > 0 ? userMetas.map(meta => (
                                                        <SelectItem key={meta.id} value={String(meta.id)}>{meta.nome}</SelectItem>
                                                    )) : <SelectItem value="none" disabled>Crie uma meta primeiro</SelectItem>}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>Esta é a missão principal que une os membros da sua guilda.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">
                                {isEditing ? 'Salvar Alterações' : 'Forjar Guilda'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
};
