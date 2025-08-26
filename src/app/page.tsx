
"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, BookOpen, Target, Settings, LogOut, Clock, BarChart3, LayoutDashboard, Menu, Award, Store, Backpack, Swords, UserSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { DashboardView } from '@/components/views/core/DashboardView';
import { MetasView } from '@/components/views/core/MetasView';
import { MissionsView } from '@/components/views/core/MissionsView';
import { SkillsView } from '@/components/views/core/SkillsView';
import { RoutineView } from '@/components/views/core/RoutineView';
import { AIChatView } from '@/components/views/ai/AIChatView';
import { SettingsView } from '@/components/views/player/SettingsView';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { OnboardingGuide } from '@/components/custom/OnboardingGuide';
import { AchievementsView } from '@/components/views/player/AchievementsView';
import { ShopView } from '@/components/views/player/ShopView';
import { InventoryView } from '@/components/views/player/InventoryView';
import { GuildsView } from '@/components/views/social/GuildsView';
import { ClassView } from '@/components/views/player/ClassView';
import { SystemAlert } from '@/components/custom/SystemAlert';
import { usePlayerDataContext } from '@/hooks/use-player-data.tsx';
import { useIsMobile } from '@/hooks/use-mobile';


export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const { 
      isDataLoaded,
      questNotification, systemAlert, showOnboarding,
      setQuestNotification, setSystemAlert, setShowOnboarding, persistData, profile
   } = usePlayerDataContext();

  const [currentPage, setCurrentPage] = useState('dashboard');
  const isMobile = useIsMobile();
    
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Redirecionamento para login se não autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('🔄 Usuário não autenticado, redirecionando para login...');
      window.location.href = '/login';
    }
  }, [user, authLoading]);
  
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);
  const touchEndRef = useRef<{ x: number, y: number } | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndRef.current = null;
    touchStartRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };

  const onTouchEnd = (fromSheet: boolean = false) => {
    if (!touchStartRef.current || !touchEndRef.current) return;

    const distanceX = touchStartRef.current.x - touchEndRef.current.x;
    const distanceY = touchStartRef.current.y - touchEndRef.current.y;
    
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > minSwipeDistance) {
        const isLeftSwipe = distanceX > 0;
        const isRightSwipe = distanceX < 0;

        if (isRightSwipe && !fromSheet && touchStartRef.current.x < 50 && isMobile) { 
            setIsSheetOpen(true);
        }

        if (isLeftSwipe && fromSheet && isMobile) {
            setIsSheetOpen(false);
        }
    }
    
    touchStartRef.current = null;
    touchEndRef.current = null;
  };
  

  const NavItem = ({ icon: Icon, label, page, inSheet = false, className = "" }) => {
    const handleNav = () => {
        setCurrentPage(page);
        if (inSheet) {
            setIsSheetOpen(false);
        }
    };
    
    return (
        <button
          onClick={handleNav}
          className={cn(
            'w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors duration-200',
            currentPage === page ? 'bg-primary/20 text-primary font-bold' : 'text-gray-400 hover:bg-secondary hover:text-white'
          )}
        >
          <Icon className="h-5 w-5" />
          <span className={cn("font-medium", className)}>{label}</span>
        </button>
    );
  };
  
  const NavContent = ({inSheet = false}) => {
    return (
        <div className="h-full flex flex-col">
          <div className="font-cinzel text-3xl font-bold text-primary text-center mb-8 tracking-widest">SISTEMA</div>
          <nav className="flex-grow space-y-2">
              <NavItem icon={LayoutDashboard} label="Dashboard" page="dashboard" inSheet={inSheet}/>
              <NavItem icon={BookOpen} label="Metas" page="metas" inSheet={inSheet} />
              <NavItem icon={Target} label="Missões" page="missions" inSheet={inSheet}/>
              <NavItem icon={BarChart3} label="Habilidades" page="skills" inSheet={inSheet}/>
              <NavItem icon={UserSquare} label="Classe" page="class" inSheet={inSheet}/>
              <NavItem icon={Clock} label="Rotina" page="routine" inSheet={inSheet}/>
              <NavItem icon={Award} label="Conquistas" page="achievements" inSheet={inSheet} />
              <NavItem icon={Swords} label="Guildas" page="guilds" inSheet={inSheet} />
              <NavItem icon={Store} label="Loja" page="shop" inSheet={inSheet} />
              <NavItem icon={Backpack} label="Inventário" page="inventory" inSheet={inSheet} />
              <NavItem icon={Bot} label="Arquiteto" page="ai-chat" inSheet={inSheet} className="font-cinzel font-bold tracking-wider" />
          </nav>
          <div className="mt-auto">
              <NavItem icon={Settings} label="Configurações" page="settings" inSheet={inSheet}/>
              <button 
                onClick={logout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-md text-gray-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Terminar Sessão</span>
              </button>
          </div>
        </div>
    );
  };

  const renderContent = () => {
    if (!isDataLoaded) {
      return null
    }
    
    const views = {
      'dashboard': <DashboardView />,
      'metas': <MetasView />,
      'missions': <MissionsView />,
      'skills': <SkillsView />,
      'class': <ClassView />,
      'routine': <RoutineView />,
      'achievements': <AchievementsView />,
      'guilds': <GuildsView />,
      'shop': <ShopView />,
      'inventory': <InventoryView />,
      'ai-chat': <AIChatView />,
      'settings': <SettingsView />,
    };

    return (
      <div key={currentPage} className="animate-in fade-in-50 duration-500 h-full">
        {views[currentPage] || <DashboardView />}
      </div>
    )
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin h-10 w-10" />
          <span className="text-xl font-cinzel tracking-wider">A VALIDAR SESSÃO...</span>
          <span className="text-sm text-gray-400">Conectando ao Firebase...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-pulse h-10 w-10" />
          <span className="text-xl font-cinzel tracking-wider">REDIRECIONANDO...</span>
          <span className="text-sm text-gray-400">Acesso negado. Redirecionando para login...</span>
        </div>
      </div>
    );
  }
  
  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin h-10 w-10" />
          <span className="text-xl font-cinzel tracking-wider">A CARREGAR DADOS...</span>
          <span className="text-sm text-gray-400">Sincronizando com o Firestore...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
        {!isMobile && (
          <aside className="w-64 bg-card/50 border-r border-border/50 p-4 flex flex-col">
              <NavContent />
          </aside>
        )}
        
      <main 
        className="flex-1 overflow-y-auto overflow-x-hidden relative" 
        style={{height: '100vh'}}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => onTouchEnd(false)}
      >
         {isMobile && (
            <header className="sticky top-0 left-0 right-0 z-10 p-2 bg-background/80 backdrop-blur-md border-b border-border/50 flex items-center">
                 <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Abrir menu">
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left" 
                        className="w-72 bg-card/95 border-r border-border/50 p-4 flex flex-col"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={() => onTouchEnd(true)}
                    >
                        <NavContent inSheet={true}/>
                    </SheetContent>
                </Sheet>
                 <h2 className="text-lg font-bold text-primary ml-4 capitalize font-cinzel tracking-wider">{currentPage}</h2>
            </header>
          )}
        {renderContent()}
        
        {showOnboarding && <OnboardingGuide onFinish={() => {
            setShowOnboarding(false);
            if (profile) {
              persistData('profile', {...profile, onboarding_completed: true});
            }
        }} />}
        {systemAlert && (
            <SystemAlert
              message={systemAlert.message}
              position={systemAlert.position}
              onDismiss={() => setSystemAlert(null)}
            />
        )}
      </main>
    </div>
  );
}
