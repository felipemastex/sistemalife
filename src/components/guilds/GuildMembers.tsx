
"use client";

import { Crown, ShieldCheck, User, Shield, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";

const roleHierarchy = ['Líder', 'Oficial', 'Veterano', 'Membro', 'Recruta'];

const roleInfo = {
    'Líder': { icon: Crown, color: 'text-yellow-400', badgeColor: 'bg-yellow-900/50 border-yellow-500/50' },
    'Oficial': { icon: ShieldCheck, color: 'text-cyan-400', badgeColor: 'bg-cyan-900/50 border-cyan-500/50' },
    'Veterano': { icon: Shield, color: 'text-green-400', badgeColor: 'bg-green-900/50 border-green-500/50' },
    'Membro': { icon: User, color: 'text-gray-300', badgeColor: 'bg-gray-700/50 border-gray-500/50' },
    'Recruta': { icon: User, color: 'text-gray-500', badgeColor: 'bg-gray-800/50 border-gray-600/50' },
};

export const GuildMembers = ({ members, guildMembersMeta, onMemberUpdate, currentUserProfile }) => {
    
    const getMemberRole = (memberId) => {
        const meta = guildMembersMeta.find(m => m.user_id === memberId);
        return meta ? meta.role : 'Recruta';
    };
    
    const handleRoleChange = (memberId, newRole) => {
        const updatedMembersMeta = guildMembersMeta.map(m => 
            m.user_id === memberId ? { ...m, role: newRole } : m
        );
        onMemberUpdate(updatedMembersMeta);
    };
    
    const handleKickMember = (memberId) => {
         // This needs to update the user's profile as well, which is complex
         console.log(`Kicking member ${memberId} - logic to be implemented`);
    }

    const currentUserRole = getMemberRole(currentUserProfile.id);
    const canManage = (targetRole) => {
        const currentUserIndex = roleHierarchy.indexOf(currentUserRole);
        const targetUserIndex = roleHierarchy.indexOf(targetRole);
        return currentUserIndex < targetUserIndex;
    }

    const sortedMembers = [...members].sort((a, b) => {
        const roleA = getMemberRole(a.id);
        const roleB = getMemberRole(b.id);
        return roleHierarchy.indexOf(roleA) - roleHierarchy.indexOf(roleB);
    });

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Membros ({members.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto pr-2">
                <div className="space-y-4">
                    {sortedMembers.map(member => {
                        const role = getMemberRole(member.id);
                        const RoleIcon = roleInfo[role]?.icon || User;
                        const canBeManaged = canManage(role) && member.id !== currentUserProfile.id;

                        return (
                            <div key={member.id} className="flex items-center justify-between gap-4 p-2 rounded-md hover:bg-secondary/50">
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
                                {canBeManaged && (
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {roleHierarchy.map((r, index) => {
                                                if (index > roleHierarchy.indexOf(currentUserRole)) {
                                                    return (
                                                         <DropdownMenuItem key={r} onClick={() => handleRoleChange(member.id, r)}>
                                                            Promover para {r}
                                                        </DropdownMenuItem>
                                                    )
                                                }
                                                return null;
                                            })}
                                            <DropdownMenuItem onSelect={() => handleKickMember(member.id)} className="text-red-500">
                                                Expulsar Membro
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
