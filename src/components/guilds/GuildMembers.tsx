
"use client";

import { Crown, ShieldCheck, User, Shield, MoreVertical, ArrowUp, ArrowDown, X, Award, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { ChevronsUpDown } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "../ui/tooltip";


const roleHierarchy = ['Líder', 'Oficial', 'Veterano', 'Membro', 'Recruta'];

const roleInfo = {
    'Líder': { icon: Crown, color: 'text-yellow-400', badgeColor: 'bg-yellow-900/50 border-yellow-500/50' },
    'Oficial': { icon: ShieldCheck, color: 'text-cyan-400', badgeColor: 'bg-cyan-900/50 border-cyan-500/50' },
    'Veterano': { icon: Shield, color: 'text-green-400', badgeColor: 'bg-green-900/50 border-green-500/50' },
    'Membro': { icon: User, color: 'text-gray-300', badgeColor: 'bg-gray-700/50 border-gray-500/50' },
    'Recruta': { icon: User, color: 'text-gray-500', badgeColor: 'bg-gray-800/50 border-gray-600/50' },
};

export const GuildMembers = ({ members, guildMembersMeta, onMemberUpdate, currentUserProfile, allUsers }) => {
    const { toast } = useToast();
    
    const getMemberRole = (memberId) => {
        const meta = (guildMembersMeta || []).find(m => m.user_id === memberId);
        return meta ? meta.role : 'Recruta';
    };
    
    const handleRoleChange = (memberId, direction) => {
        const currentRole = getMemberRole(memberId);
        const currentIndex = roleHierarchy.indexOf(currentRole);
        let newIndex = currentIndex;

        if (direction === 'promote' && currentIndex > 0) {
            newIndex = currentIndex - 1;
        } else if (direction === 'demote' && currentIndex < roleHierarchy.length - 1) {
            newIndex = currentIndex + 1;
        } else {
            return; // Cannot promote Leader or demote Recruta
        }

        const newRole = roleHierarchy[newIndex];
        const updatedMembersMeta = (guildMembersMeta || []).map(m => 
            m.user_id === memberId ? { ...m, role: newRole } : m
        );

        const updatedUsers = allUsers.map(u => 
            u.id === memberId ? { ...u, guild_role: newRole } : u
        );

        onMemberUpdate(updatedMembersMeta, updatedUsers);
        toast({
            title: `Membro ${direction === 'promote' ? 'Promovido' : 'Rebaixado'}`,
            description: `${members.find(m => m.id === memberId)?.nome_utilizador} é agora um(a) ${newRole}.`
        })
    };
    
    const handleKickMember = (memberIdToKick, memberNameToKick) => {
        const updatedMembersMeta = (guildMembersMeta || []).filter(m => m.user_id !== memberIdToKick);

        const updatedUsers = allUsers.map(u => 
            u.id === memberIdToKick ? { ...u, guild_id: null, guild_role: null } : u
        );

        onMemberUpdate(updatedMembersMeta, updatedUsers);
        toast({
            title: "Membro Expulso",
            description: `${memberNameToKick} foi removido da guilda.`,
            variant: "destructive"
        });
    }

    const currentUserRole = getMemberRole(currentUserProfile.id);
    const currentUserIndex = roleHierarchy.indexOf(currentUserRole);

    const canManage = (targetRole) => {
        const targetUserIndex = roleHierarchy.indexOf(targetRole);
        return currentUserIndex < targetUserIndex;
    }

    const sortedMembers = [...members].sort((a, b) => {
        const roleA = getMemberRole(a.id);
        const roleB = getMemberRole(b.id);
        return roleHierarchy.indexOf(roleA) - roleHierarchy.indexOf(roleB);
    });

    const StatDisplay = ({ icon: Icon, value, label, tooltip }) => (
         <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon className="h-4 w-4"/>
                        <span>{value}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Membros ({members.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden p-0">
                <ScrollArea className="h-full">
                    <div className="space-y-1 p-6 pt-0">
                        {sortedMembers.map(member => {
                            const role = getMemberRole(member.id);
                            const RoleIcon = roleInfo[role]?.icon || User;
                            const canBeManagedByCurrentUser = canManage(role) && member.id !== currentUserProfile.id;
                            const canPromote = canBeManagedByCurrentUser && roleHierarchy.indexOf(role) > currentUserIndex + 1;
                            const canDemote = canBeManagedByCurrentUser && roleHierarchy.indexOf(role) < roleHierarchy.length - 1;


                            return (
                                 <Collapsible key={member.id} className="p-2 rounded-md hover:bg-secondary/50">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={member.avatar_url} />
                                                <AvatarFallback>{member.nome_utilizador?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{member.nome_utilizador}</p>
                                                <div className="flex items-center gap-2">
                                                    <RoleIcon className={`h-4 w-4 ${roleInfo[role]?.color}`} />
                                                    <span className="text-sm text-muted-foreground">{role}</span>
                                                </div>
                                            </div>
                                        </div>
                                         <div className="flex items-center">
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <ChevronsUpDown className="h-4 w-4" />
                                                </Button>
                                            </CollapsibleTrigger>
                                            {canBeManagedByCurrentUser && (
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem 
                                                                onClick={() => handleRoleChange(member.id, 'promote')} 
                                                                disabled={!canPromote}
                                                            >
                                                                <ArrowUp className="mr-2 h-4 w-4" />
                                                                Promover
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleRoleChange(member.id, 'demote')}
                                                                disabled={!canDemote}
                                                            >
                                                                <ArrowDown className="mr-2 h-4 w-4" />
                                                                Rebaixar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" className="w-full justify-start text-red-500 hover:bg-red-500/10 hover:text-red-400 px-2 py-1.5 h-auto text-sm font-normal relative">
                                                                    <X className="mr-2 h-4 w-4" />
                                                                    Expulsar Membro
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Expulsar {member.nome_utilizador}?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Tem a certeza de que quer remover este membro da guilda? Esta ação não pode ser desfeita.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleKickMember(member.id, member.nome_utilizador)}>Sim, expulsar</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    </div>
                                    <CollapsibleContent className="mt-3 pt-3 border-t border-border/50">
                                        <div className="flex justify-around items-center">
                                            <StatDisplay icon={BarChart3} value={1530} label="Contribuição" tooltip="Total de Contribuição na Guilda" />
                                            <StatDisplay icon={Award} value={42} label="Missões" tooltip="Missões da Guilda Concluídas"/>
                                        </div>
                                    </CollapsibleContent>
                                 </Collapsible>
                            )
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};
