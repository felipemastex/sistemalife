'use server';
import {config} from 'dotenv';
config();

import './flows/generate-personalized-advice.js';
import './flows/generate-daily-mission.js';
import './flows/generate-goal-category.js';
import './flows/generate-smart-goal-questions.js';
import './flows/generate-simple-smart-goal.js';
import './flows/generate-initial-epic-mission.js';
import './flows/generate-xp-value.js';
import './flows/generate-mission-suggestion.js';
import './flows/generate-routine-suggestion.js';
import './flows/generate-skill-experience.js';
import './flows/generate-skill-from-goal.js';
