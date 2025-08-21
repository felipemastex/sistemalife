
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, User, BookOpen, Target, TreeDeciduous, Settings, LogOut, Clock, LoaderCircle, BarChart3, LayoutDashboard, Menu } from 'lucide-react';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch, deleteDoc, updateDoc } from "firebase/firestore";
import * as mockData from '@/lib/data';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { DashboardView } from '@/components/views/DashboardView';
import { MetasView } from '@/components/views/MetasView';
import { MissionsView } from '@/components/views/MissionsView';
import { SkillsView } from '@/components/views/SkillsView';
import { RoutineView } from '@/components/views/RoutineView';
import { AIChatView } from '@/components/views/AIChatView';
import { SettingsView } from '@/components/views/SettingsView';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';


export default function App() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [profile, setProfile] = useState(null);
  const [metas, setMetas] = useState([]);
  const [missions, setMissions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [routine, setRoutine] = useState({});
  const [routineTemplates, setRoutineTemplates] = useState({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const setupInitialData = async (userId, userEmail) => {
      const userRef = doc(db, 'users', userId);
      const batch = writeBatch(db);

      // 1. Profile
      const emailUsername = userEmail.split('@')[0];
      const initialProfile = { 
          ...mockData.perfis[0], 
          id: userId, 
          email: userEmail,
          primeiro_nome: emailUsername,
          apelido: "Caçador",
          nome_utilizador: emailUsername,
          avatar_url: `https://placehold.co/100x100.png?text=${emailUsername.substring(0,2).toUpperCase()}`
      };
      batch.set(userRef, initialProfile);

      // 2. Metas
      const metasRef = collection(db, 'users', userId, 'metas');
      mockData.metas.forEach(meta => {
          const metaDocRef = doc(metasRef, String(meta.id));
          batch.set(metaDocRef, meta);
      });

      // 3. Missions
      const missionsRef = collection(db, 'users', userId, 'missions');
      mockData.missoes.forEach(mission => {
          const missionDocRef = doc(missionsRef, String(mission.id));
          batch.set(missionDocRef, mission);
      });

      // 4. Skills
      const skillsRef = collection(db, 'users', userId, 'skills');
      mockData.habilidades.forEach(skill => {
          const skillDocRef = doc(skillsRef, String(skill.id));
          batch.set(skillDocRef, skill);
      });

      // 5. Routine
      const routineRef = doc(db, 'users', userId, 'routine', 'main');
      batch.set(routineRef, mockData.rotina);

      // 6. Routine Templates
      const routineTemplatesRef = doc(db, 'users', userId, 'routine', 'templates');
      batch.set(routineTemplatesRef, mockData.rotinaTemplates);

      await batch.commit();

      // Manually set the state after committing the batch
      setProfile(initialProfile);
      setMetas(mockData.metas);
      setMissions(mockData.missoes);
      setSkills(mockData.habilidades);
      setRoutine(mockData.rotina);
      setRoutineTemplates(mockData.rotinaTemplates);

      toast({ title: "Bem-vindo ao Sistema!", description: "O seu perfil inicial foi configurado." });
  };

  const fetchData = useCallback(async (userId) => {
      try {
          const userDocRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
              const profileData = userDoc.data();
              if (profileData.nome_utilizador && !profileData.primeiro_nome) {
                  profileData.primeiro_nome = profileData.nome_utilizador;
                  profileData.apelido = "Caçador";
              }
              setProfile(profileData);

              const metasSnapshot = await getDocs(collection(userDocRef, 'metas'));
              setMetas(metasSnapshot.docs.map(doc => ({ ...doc.data() })));
              
              const missionsSnapshot = await getDocs(collection(userDocRef, 'missions'));
              setMissions(missionsSnapshot.docs.map(doc => ({ ...doc.data() })));

              const skillsSnapshot = await getDocs(collection(userDocRef, 'skills'));
              setSkills(skillsSnapshot.docs.map(doc => ({ ...doc.data() })));

              const routineDoc = await getDoc(doc(userDocRef, 'routine', 'main'));
              setRoutine(routineDoc.exists() ? routineDoc.data() : {});
              
              const routineTemplatesDoc = await getDoc(doc(userDocRef, 'routine', 'templates'));
              setRoutineTemplates(routineTemplatesDoc.exists() ? routineTemplatesDoc.data() : {});

          } else {
              console.log("Utilizador novo. A configurar dados iniciais...");
              await setupInitialData(user.uid, user.email);
          }
      } catch (error) {
          console.error("Erro a carregar dados do Firestore:", error);
          toast({ variant: 'destructive', title: "Erro de Sincronização", description: "Não foi possível carregar os seus dados." });
      } finally {
          setIsDataLoaded(true);
      }
  }, [user, toast]);

  useEffect(() => {
    if (user && !isDataLoaded) {
      fetchData(user.uid);
    }
  }, [user, isDataLoaded, fetchData]);
  
  const persistProfile = useCallback(async (newProfile) => {
      if (!user) return;
      
      const profileToSave = {
        ...newProfile,
        nome_utilizador: newProfile.primeiro_nome || newProfile.nome_utilizador || '',
      };

      setProfile(profileToSave);
      await setDoc(doc(db, 'users', user.uid), profileToSave, { merge: true });
  }, [user]);

  const persistMetas = useCallback(async (newMetas) => {
      if (!user) return;
      setMetas(newMetas);
      const batch = writeBatch(db);
      const metasRef = collection(db, 'users', user.uid, 'metas');
      
      const existingDocsSnapshot = await getDocs(metasRef);
      const existingIds = existingDocsSnapshot.docs.map(d => d.id);
      const newIds = newMetas.map(m => String(m.id));
      const idsToDelete = existingIds.filter(id => !newIds.includes(id));
      
      idsToDelete.forEach(id => batch.delete(doc(metasRef, id)));
      newMetas.forEach(meta => {
          const metaDocRef = doc(metasRef, String(meta.id));
          batch.set(metaDocRef, meta);
      });
      await batch.commit();
  }, [user]);

  const persistMissions = useCallback(async (newMissions) => {
      if (!user) return;
      const currentMissions = Array.isArray(newMissions) ? newMissions : missions;
      setMissions(currentMissions);
      const batch = writeBatch(db);
      const missionsRef = collection(db, 'users', user.uid, 'missions');

      const existingDocsSnapshot = await getDocs(missionsRef);
      const existingIds = existingDocsSnapshot.docs.map(d => d.id);
      const newIds = currentMissions.map(m => String(m.id));
      const idsToDelete = existingIds.filter(id => !newIds.includes(id));

      idsToDelete.forEach(id => batch.delete(doc(missionsRef, id)));
      currentMissions.forEach(mission => {
          const missionDocRef = doc(missionsRef, String(mission.id));
          batch.set(missionDocRef, mission);
      });
      await batch.commit();
  }, [user, missions]);
  
    const persistSkills = useCallback(async (newSkills) => {
      if (!user) return;
      const skillsToPersist = typeof newSkills === 'function' ? newSkills(skills) : newSkills;
      setSkills(skillsToPersist);
      const batch = writeBatch(db);
      const skillsRef = collection(db, 'users', user.uid, 'skills');

      const existingDocsSnapshot = await getDocs(skillsRef);
      const existingIds = existingDocsSnapshot.docs.map(d => d.id);
      const newIds = skillsToPersist.map(s => String(s.id));
      const idsToDelete = existingIds.filter(id => !newIds.includes(id));

      idsToDelete.forEach(id => batch.delete(doc(skillsRef, id)));
      skillsToPersist.forEach(skill => {
          const skillDocRef = doc(skillsRef, String(skill.id));
          batch.set(skillDocRef, skill);
      });
      await batch.commit();
  }, [user, skills]);

  const persistRoutine = useCallback(async (newRoutine) => {
      if (!user) return;
      setRoutine(newRoutine); // Update parent state for other components
      await setDoc(doc(db, 'users', user.uid, 'routine', 'main'), newRoutine);
  }, [user]);
  
  const persistRoutineTemplates = useCallback(async (newTemplates) => {
      if (!user) return;
      setRoutineTemplates(newTemplates);
      await setDoc(doc(db, 'users', user.uid, 'routine', 'templates'), newTemplates);
  }, [user]);

  const handleFullReset = async () => {
    if (!user) return;
    setIsDataLoaded(false);

    try {
        const userDocRef = doc(db, 'users', user.uid);

        const collectionsToDelete = ['metas', 'missions', 'skills'];
        for (const collName of collectionsToDelete) {
            const subcollectionRef = collection(userDocRef, collName);
            const snapshot = await getDocs(subcollectionRef);
            const deleteBatch = writeBatch(db);
            snapshot.docs.forEach(docToDelete => deleteBatch.delete(docToDelete.ref));
            await deleteBatch.commit();
        }
        
        await deleteDoc(doc(userDocRef, 'routine', 'main')).catch(e => console.log("Rotina principal não encontrada, a ignorar."));
        await deleteDoc(doc(userDocRef, 'routine', 'templates')).catch(e => console.log("Templates de rotina não encontrados, a ignorar."));

        await deleteDoc(userDocRef);
        
        toast({ title: "Sistema Resetado!", description: "A sua conta foi limpa. A reconfigurar para o estado inicial." });
        
        await setupInitialData(user.uid, user.email);
    } catch (error) {
        console.error("Erro ao resetar os dados:", error);
        toast({ variant: 'destructive', title: "Erro no Reset", description: `Não foi possível apagar os seus dados. Erro: ${error.message}` });
    } finally {
        setIsDataLoaded(true);
    }
  };


  const NavItem = ({ icon: Icon, label, page, inSheet = false, className = "" }) => {
    const Component = inSheet ? SheetClose : 'button';
    
    return (
        <Component
          onClick={() => setCurrentPage(page)}
          className={cn(
            'w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors duration-200',
            currentPage === page ? 'bg-primary/20 text-primary font-bold' : 'text-gray-400 hover:bg-secondary hover:text-white'
          )}
        >
          <Icon className="h-5 w-5" />
          <span className={cn("font-medium", className)}>{label}</span>
        </Component>
    );
  };
  
  const NavContent = ({inSheet = false}) => (
    <>
      <div className="font-cinzel text-3xl font-bold text-primary text-center mb-8 tracking-widest">SISTEMA</div>
      <nav className="flex-grow space-y-2">
          <NavItem icon={LayoutDashboard} label="Dashboard" page="dashboard" inSheet={inSheet}/>
          <NavItem icon={BookOpen} label="Metas" page="metas" inSheet={inSheet} />
          <NavItem icon={Target} label="Missões" page="missions" inSheet={inSheet}/>
          <NavItem icon={Clock} label="Rotina" page="routine" inSheet={inSheet}/>
          <NavItem icon={BarChart3} label="Habilidades" page="skills" inSheet={inSheet}/>
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
    </>
  );

  const renderContent = () => {
    if (!profile) {
      return null
    }
    
    const views = {
      'dashboard': <DashboardView profile={profile} />,
      'metas': <MetasView metas={metas} setMetas={persistMetas} missions={missions} setMissions={persistMissions} profile={profile} skills={skills} setSkills={persistSkills} />,
      'missions': <MissionsView missions={missions} setMissions={persistMissions} profile={profile} setProfile={persistProfile} metas={metas} skills={skills} setSkills={persistSkills} />,
      'skills': <SkillsView skills={skills} setSkills={persistSkills} metas={metas} missions={missions} />,
      'routine': <RoutineView initialRoutine={routine} persistRoutine={persistRoutine} missions={missions} initialTemplates={routineTemplates} persistTemplates={persistRoutineTemplates} />,
      'ai-chat': <AIChatView profile={profile} metas={metas} routine={routine} missions={missions} />,
      'settings': <SettingsView profile={profile} setProfile={persistProfile} onReset={handleFullReset} />,
    };

    return (
      <div key={currentPage} className="animate-in fade-in-25 duration-500">
        {views[currentPage] || <DashboardView profile={profile} />}
      </div>
    )
  };
  
  if (loading || !user || !isDataLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary">
        <LoaderCircle className="animate-spin h-10 w-10 mr-4" />
        <span className="text-xl font-cinzel tracking-wider">A VALIDAR SESSÃO...</span>
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
        
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative" style={{height: '100vh'}}>
         {isMobile && (
            <header className="sticky top-0 left-0 right-0 z-10 p-2 bg-background/80 backdrop-blur-md border-b border-border/50 flex items-center">
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 bg-card/95 border-r border-border/50 p-4 flex flex-col">
                        <SheetHeader>
                            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                            <SheetDescription className="sr-only">
                                Navegue pelas diferentes secções da aplicação.
                            </SheetDescription>
                        </SheetHeader>
                        <NavContent inSheet={true}/>
                    </SheetContent>
                </Sheet>
                 <h2 className="text-lg font-bold text-primary ml-4 capitalize font-cinzel tracking-wider">{currentPage}</h2>
            </header>
          )}
        {renderContent()}
      </main>
    </div>
  );
}

    
