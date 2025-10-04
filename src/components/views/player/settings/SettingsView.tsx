"use client";

import { memo } from 'react';
import { User, Bot, AlertTriangle, Bell, Database, PieChart, Gamepad2, Link } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileSettingsTab from './ProfileSettingsTab';
import AISettingsTab from './AISettingsTab';
import DangerZoneTab from './DangerZoneTab';
import NotificationsSettingsTab from './NotificationsSettingsTab';
import DataBackupTab from './DataBackupTab';
import AnalyticsTab from './AnalyticsTab';
import GamificationSettingsTab from './GamificationSettingsTab';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const SettingsViewComponent = () => {
    const isMobile = useIsMobile();
    
    return (
        <div className={cn("h-full overflow-y-auto", isMobile ? "p-2" : "p-4 md:p-8")}>
            <div className={cn("mb-4", isMobile ? "mb-4" : "mb-8")}>
                <h1 className={cn("font-bold text-primary font-cinzel tracking-wider", isMobile ? "text-2xl" : "text-3xl")}>Ficha de Caçador</h1>
                <p className={cn("text-muted-foreground max-w-3xl", isMobile ? "mt-1 text-sm" : "mt-2")}>
                    Edite os seus dados, personalize a experiência e gira a sua conta no Sistema.
                </p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className={cn("grid w-full", isMobile ? "grid-cols-7 gap-0.5 mb-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 mb-6 gap-2")}>
                    <TabsTrigger value="profile" className={isMobile ? "text-[8px] py-1 px-0.5" : ""}>
                        <User className={cn("mr-1", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        {isMobile ? "Perfil" : "Perfil"}
                    </TabsTrigger>
                    <TabsTrigger value="ai" className={isMobile ? "text-[8px] py-1 px-0.5" : ""}>
                         <Bot className={cn("mr-1", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        {isMobile ? "IA" : "IA & Interface"}
                    </TabsTrigger>
                     <TabsTrigger value="gamification" className={isMobile ? "text-[8px] py-1 px-0.5" : ""}>
                         <Gamepad2 className={cn("mr-1", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        {isMobile ? "Game" : "Gamificação"}
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className={isMobile ? "text-[8px] py-1 px-0.5" : ""}>
                         <Bell className={cn("mr-1", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        {isMobile ? "Notif" : "Notificações"}
                    </TabsTrigger>
                    <TabsTrigger value="data_backup" className={isMobile ? "text-[8px] py-1 px-0.5" : ""}>
                         <Database className={cn("mr-1", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        {isMobile ? "Dados" : "Dados & Integrações"}
                    </TabsTrigger>
                     <TabsTrigger value="analytics" className={isMobile ? "text-[8px] py-1 px-0.5" : ""}>
                         <PieChart className={cn("mr-1", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        {isMobile ? "Anal" : "Analytics"}
                    </TabsTrigger>
                    <TabsTrigger value="danger_zone" className={cn("text-red-500 data-[state=active]:text-red-500", isMobile ? "text-[8px] py-1 px-0.5" : "")}>
                         <AlertTriangle className={cn("mr-1", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        {isMobile ? "Perigo" : "Zona de Perigo"}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <ProfileSettingsTab />
                </TabsContent>

                <TabsContent value="ai">
                    <AISettingsTab />
                </TabsContent>
                
                 <TabsContent value="gamification">
                    <GamificationSettingsTab />
                </TabsContent>

                <TabsContent value="notifications">
                    <NotificationsSettingsTab />
                </TabsContent>

                <TabsContent value="data_backup">
                    <DataBackupTab />
                </TabsContent>
                
                <TabsContent value="analytics">
                    <AnalyticsTab />
                </TabsContent>
                
                <TabsContent value="danger_zone">
                    <DangerZoneTab />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export const SettingsView = memo(SettingsViewComponent);