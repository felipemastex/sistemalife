import { Stats } from './stats';
import { GoalTracker } from './goal-tracker';
import { Challenges } from './challenges';
import { HabitLogger } from './habit-logger';
import { SystemGuide } from '../ai/system-guide';
import { MotivationalMessage } from '../ai/motivational-message';

export function Dashboard() {
    return (
        <div className="grid auto-rows-max gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
                <Stats />
                <GoalTracker />
                <HabitLogger />
            </div>
            <div className="lg:col-span-1 space-y-6">
                <MotivationalMessage />
                <SystemGuide />
                <Challenges />
            </div>
        </div>
    );
}
