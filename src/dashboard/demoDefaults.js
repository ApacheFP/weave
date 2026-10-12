import { creativeDefaults } from './creativeData.js';

export const demoDefaults = {
  collection: 'Autunno/Inverno 2027', profile: { firstName: 'Alex', lastName: 'Rossi', email: 'demo@weave.it', avatar: '/illustrations/profile-avatar.webp' },
  references: [], creative: creativeDefaults(), conceptApproved: false, identityAssigned: false, techGenerated: false, technical: null, phaseReviews: {},
  modelVersion: '1.0', grain: true, notches: true, sampleApproved: false, optimized: false,
  margin: 55, hourlyRate: 40, logisticsCost: 1.5, priority: 'Alta', start: '2027-04-10', end: '2027-05-20', delivery: '2027-06-15',
  productionPaused: false, qualityResolved: false, retailFeedback: 4.3, aiRuns: {}, chats: {},
};
