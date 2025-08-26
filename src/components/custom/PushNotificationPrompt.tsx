'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePlayerDataContext } from '@/hooks/use-player-data';

export function PushNotificationPrompt() {
  const { permission, isSupported, requestPermission, isLoading } = usePushNotifications();
  const { profile, user, persistData } = usePlayerDataContext();
  const [isVisible, setIsVisible] = useState(false);

  // Show prompt if push notifications are supported but not yet enabled
  useEffect(() => {
    // Access the push notification enabled state from profile
    const pushNotificationEnabled = profile?.user_settings?.push_notifications_enabled || false;
    const promptShown = localStorage.getItem('pushNotificationPromptShown') === 'true';
    
    if (isSupported && !promptShown && permission !== 'granted' && !pushNotificationEnabled) {
      // Show after a short delay to not interrupt user experience
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission, profile]);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    
    if (granted) {
      // Save preference to user profile
      if (profile) {
        const updatedProfile = {
          ...profile,
          user_settings: {
            ...profile.user_settings,
            push_notifications_enabled: true
          }
        };
        await persistData('profile', updatedProfile);
      }
      
      // Hide the prompt and remember the user's choice
      setIsVisible(false);
      localStorage.setItem('pushNotificationPromptShown', 'true');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pushNotificationPromptShown', 'true');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações Importantes
          </CardTitle>
          <CardDescription>
            Ative as notificações para não perder conquistas, missões e alertas importantes, 
            mesmo quando o aplicativo estiver fechado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="h-4 w-4" />
            <span>Receba alertas sobre:</span>
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
              <span>Conquistas desbloqueadas</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
              <span>Missões diárias</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
              <span>Aumento de nível</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
              <span>Habilidades em risco</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            className="w-full" 
            onClick={handleEnableNotifications}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ativando...
              </>
            ) : (
              'Ativar Notificações'
            )}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={handleDismiss}
          >
            Lembrar-me mais tarde
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}