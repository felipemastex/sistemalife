
"use client";

import { memo } from 'react';
import { User, Bot, AlertTriangle, Bell, Database } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileSettingsTab from './settings/ProfileSettingsTab';
import AISettingsTab from './settings/AISettingsTab';
import DangerZoneTab from './settings/DangerZoneTab';
import NotificationsSettingsTab from './settings/NotificationsSettingsTab';
import DataBackupTab from './settings/DataBackupTab';

const SettingsViewComponent = () => {
    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Ficha de Caçador</h1>
                <p className="text-muted-foreground mt-2 max-w-3xl">
                    Edite os seus dados, personalize a experiência e gira a sua conta no Sistema.
                </p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-6">
                    <TabsTrigger value="profile">
                        <User className="mr-2 h-4 w-4" />
                        Perfil
                    </TabsTrigger>
                    <TabsTrigger value="ai">
                         <Bot className="mr-2 h-4 w-4" />
                        IA & Interface
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                         <Bell className="mr-2 h-4 w-4" />
                        Notificações
                    </TabsTrigger>
                     <TabsTrigger value="data_backup">
                         <Database className="mr-2 h-4 w-4" />
                        Dados
                    </TabsTrigger>
                    <TabsTrigger value="danger_zone" className="text-red-500 data-[state=active]:text-red-500">
                         <AlertTriangle className="mr-2 h-4 w-4" />
                        Zona de Perigo
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <ProfileSettingsTab />
                </TabsContent>

                <TabsContent value="ai">
                    <AISettingsTab />
                </TabsContent>

                <TabsContent value="notifications">
                    <NotificationsSettingsTab />
                </TabsContent>

                <TabsContent value="data_backup">
                    <DataBackupTab />
                </TabsContent>

                <TabsContent value="danger_zone">
                    <DangerZoneTab />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export const SettingsView = memo(SettingsViewComponent);
