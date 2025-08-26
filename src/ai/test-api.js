'use server';
"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Loaded' : 'Not found');
console.log('API Key length:', ((_a = process.env.GEMINI_API_KEY) === null || _a === void 0 ? void 0 : _a.length) || 0);
