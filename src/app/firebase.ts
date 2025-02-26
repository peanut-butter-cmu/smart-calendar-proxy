import { initializeApp, applicationDefault } from 'firebase-admin/app';

export function initFirebase() {
    initializeApp({
      credential: applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
}