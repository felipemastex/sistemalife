
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, User, BookOpen, Target, TreeDeciduous, Settings, LogOut, Clock, LoaderCircle } from 'lucide-react';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from "firebase/firestore";
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


export default function App() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { toast } = useToast();
  
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

  useEffect(() => {
    const setupInitialData = async (userId, userEmail) => {
        const batch = writeBatch(db);

        // 1. Profile
        const initialProfile = { 
            ...mockData.perfis[0], 
            id: userId, 
            email: userEmail,
            nome_utilizador: userEmail.split('@')[0]
        };
        const profileRef = doc(db, 'users', userId);
        batch.set(profileRef, { profile: initialProfile });
        setProfile(initialProfile);

        // 2. Metas
        const metasRef = collection(db, 'users', userId, 'metas');
        mockData.metas.forEach(meta => {
            const metaDocRef = doc(metasRef, String(meta.id));
            batch.set(metaDocRef, meta);
        });
        setMetas(mockData.metas);

        // 3. Missions
        const missionsRef = collection(db, 'users', userId, 'missions');
        mockData.missoes.forEach(mission => {
            const missionDocRef = doc(missionsRef, String(mission.id));
            batch.set(missionDocRef, mission);
        });
        setMissions(mockData.missoes);

        // 4. Skills
        const skillsRef = collection(db, 'users', userId, 'skills');
        mockData.habilidades.forEach(skill => {
            const skillDocRef = doc(skillsRef, String(skill.id));
            batch.set(skillDocRef, skill);
        });
        setSkills(mockData.habilidades);

        // 5. Routine
        const routineRef = doc(db, 'users', userId, 'routine', 'main');
        batch.set(routineRef, mockData.rotina);
        setRoutine(mockData.rotina);

        // 6. Routine Templates
        const routineTemplatesRef = doc(db, 'users', userId, 'routine', 'templates');
        batch.set(routineTemplatesRef, mockData.rotinaTemplates);
        setRoutineTemplates(mockData.rotinaTemplates);

        await batch.commit();
        toast({ title: "Bem-vindo ao Sistema!", description: "O seu perfil inicial foi configurado." });
    };

    const fetchData = async (userId) => {
        try {
            // Profile
            const profileDoc = await getDoc(doc(db, 'users', userId));
            if (profileDoc.exists() && profileDoc.data().profile) {
                setProfile(profileDoc.data().profile);

                // Metas
                const metasSnapshot = await getDocs(collection(db, 'users', userId, 'metas'));
                setMetas(metasSnapshot.docs.map(doc => ({ ...doc.data() })));
                
                // Missions
                const missionsSnapshot = await getDocs(collection(db, 'users', userId, 'missions'));
                setMissions(missionsSnapshot.docs.map(doc => ({ ...doc.data() })));

                // Skills
                const skillsSnapshot = await getDocs(collection(db, 'users', userId, 'skills'));
                setSkills(skillsSnapshot.docs.map(doc => ({ ...doc.data() })));

                // Routine
                const routineDoc = await getDoc(doc(db, 'users', userId, 'routine', 'main'));
                setRoutine(routineDoc.exists() ? routineDoc.data() : {});
                
                // Routine Templates
                const routineTemplatesDoc = await getDoc(doc(db, 'users', userId, 'routine', 'templates'));
                setRoutineTemplates(routineTemplatesDoc.exists() ? routineTemplatesDoc.data() : {});

            } else {
                console.log("Utilizador novo. A configurar dados iniciais...");
                await setupInitialData(userId, user.email);
            }
        } catch (error) {
            console.error("Erro a carregar dados do Firestore:", error);
            toast({ variant: 'destructive', title: "Erro de Sincronização", description: "Não foi possível carregar os seus dados." });
        } finally {
            setIsDataLoaded(true);
        }
    };
    
    if (user && !isDataLoaded) {
      fetchData(user.uid);
    }
  }, [user, isDataLoaded, toast]);
  
  // --- Data Persistence Functions ---
  const persistProfile = async (newProfile) => {
      if (!user) return;
      setProfile(newProfile);
      await setDoc(doc(db, 'users', user.uid), { profile: newProfile }, { merge: true });
  }

  const persistMetas = async (newMetas) => {
      if (!user) return;
      setMetas(newMetas);
      const batch = writeBatch(db);
      const metasRef = collection(db, 'users', user.uid, 'metas');
      
      // First, get all existing docs to find deletions
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
  }

  const persistMissions = async (newMissions) => {
      if (!user) return;
      setMissions(newMissions);
      const batch = writeBatch(db);
      const missionsRef = collection(db, 'users', user.uid, 'missions');

      const existingDocsSnapshot = await getDocs(missionsRef);
      const existingIds = existingDocsSnapshot.docs.map(d => d.id);
      const newIds = newMissions.map(m => String(m.id));
      const idsToDelete = existingIds.filter(id => !newIds.includes(id));

      idsToDelete.forEach(id => batch.delete(doc(missionsRef, id)));
      newMissions.forEach(mission => {
          const missionDocRef = doc(missionsRef, String(mission.id));
          batch.set(missionDocRef, mission);
      });
      await batch.commit();
  }
  
    const persistSkills = async (newSkills) => {
      if (!user) return;
      setSkills(newSkills);
      const batch = writeBatch(db);
      const skillsRef = collection(db, 'users', user.uid, 'skills');

      const existingDocsSnapshot = await getDocs(skillsRef);
      const existingIds = existingDocsSnapshot.docs.map(d => d.id);
      const newIds = newSkills.map(s => String(s.id));
      const idsToDelete = existingIds.filter(id => !newIds.includes(id));

      idsToDelete.forEach(id => batch.delete(doc(skillsRef, id)));
      newSkills.forEach(skill => {
          const skillDocRef = doc(skillsRef, String(skill.id));
          batch.set(skillDocRef, skill);
      });
      await batch.commit();
  }

  const persistRoutine = async (newRoutine) => {
      if (!user) return;
      setRoutine(newRoutine);
      await setDoc(doc(db, 'users', user.uid, 'routine', 'main'), newRoutine);
  }
  
  const persistRoutineTemplates = async (newTemplates) => {
      if (!user) return;
      setRoutineTemplates(newTemplates);
      await setDoc(doc(db, 'users', user.uid, 'routine', 'templates'), newTemplates);
  }

  const NavItem = ({ icon: Icon, label, page }) => (
    <button 
      onClick={() => setCurrentPage(page)}
      className={cn(
        'w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors',
        currentPage === page ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  const renderContent = () => {
    if (!profile) {
      return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-cyan-400 text-xl">A carregar sistema...</div>
    }
    
    switch (currentPage) {
      case 'dashboard':
        return <DashboardView profile={profile} />;
      case 'metas':
        return <MetasView metas={metas} setMetas={persistMetas} missions={missions} setMissions={persistMissions} profile={profile} skills={skills} setSkills={persistSkills} />;
      case 'missions':
        return <MissionsView missions={missions} setMissions={persistMissions} profile={profile} setProfile={persistProfile} metas={metas} skills={skills} setSkills={persistSkills} />;
      case 'skills':
        return <SkillsView skills={skills} setSkills={persistSkills} />;
      case 'routine':
        return <RoutineView routine={routine} setRoutine={persistRoutine} missions={missions} routineTemplates={routineTemplates} setRoutineTemplates={persistRoutineTemplates} />;
      case 'ai-chat':
        return <AIChatView profile={profile} metas={metas} routine={routine} missions={missions} />;
      case 'settings':
        return <SettingsView profile={profile} setProfile={persistProfile} />;
      default:
        return <DashboardView profile={profile} />;
    }
  };
  
  if (loading || !user || !isDataLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-cyan-400">
        <LoaderCircle className="animate-spin h-10 w-10 mr-4" />
        <span className="text-xl">A validar sessão...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-mono flex">
      <aside className="w-64 bg-gray-800/80 border-r border-gray-700/50 p-4 flex-col hidden md:flex">
        <div className="text-2xl font-bold text-cyan-400 text-center mb-8">SISTEMA</div>
        <nav className="flex-grow space-y-2">
            <NavItem icon={User} label="Dashboard" page="dashboard" />
            <NavItem icon={BookOpen} label="Metas" page="metas" />
            <NavItem icon={Target} label="Missões" page="missions" />
            <NavItem icon={Clock} label="Rotina" page="routine" />
            <NavItem icon={TreeDeciduous} label="Habilidades" page="skills" />
            <NavItem icon={Bot} label="Interagir com IA" page="ai-chat" />
        </nav>
        <div className="mt-auto">
            <NavItem icon={Settings} label="Configurações" page="settings" />
            <button 
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-md text-gray-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Terminar Sessão</span>
            </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto" style={{height: '100vh'}}>
        {renderContent()}
      </main>
    </div>
  );
}

    