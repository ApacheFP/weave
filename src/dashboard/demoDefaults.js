import { creativeDefaults, collectionDefaults } from './creativeData.js';
import { newDemoProducts } from './productData.js';
import { seedWorkspaceData } from './workspaceData.js';
import { normalizeWorkspaceIdentity } from './workspaceIdentity.js';

export const demoDefaults = {
  collection: 'Autunno/Inverno 2027', profile: { firstName: 'Alex', lastName: 'Rossi', email: 'demo@weave.it', avatar: '/illustrations/profile-avatar.webp' },
  references: [], creative: creativeDefaults(), conceptApproved: false, identityAssigned: false, techGenerated: false, technical: null, phaseReviews: {},
  modelVersion: '1.0', grain: true, notches: true, sampleApproved: false, optimized: false,
  margin: 55, hourlyRate: 40, logisticsCost: 1.5, priority: 'Alta', start: '2027-04-10', end: '2027-05-20', delivery: '2027-06-15',
  productionPaused: false, qualityResolved: false, retailFeedback: 4.3, aiRuns: {}, chats: {},
};

export const demoSeedVersion = 2;

export function createDemoWorkspace() {
  const now = new Date();
  const items = newDemoProducts(demoDefaults, now);
  return normalizeWorkspaceIdentity({ demoSeedVersion, activeId: items[0].styleId, hasSelectedStyle: false, selectedVariants: {}, collections: { [items[0].collection]: collectionDefaults() }, items, ...seedWorkspaceData(items, demoDefaults.profile, now) });
}

export function migrateDemoWorkspace(workspace) {
  const styleIds = ['MG-0425', 'MG-0426', 'MG-0427', 'PT-0423', 'BG-0424'];
  const currentByStyle = new Map((workspace?.items || []).map(item => [item.styleId, item]));
  const owner = currentByStyle.get(workspace?.activeId)?.profile || workspace?.items?.[0]?.profile;
  if (workspace?.demoSeedVersion >= demoSeedVersion || owner?.email?.trim().toLowerCase() !== demoDefaults.profile.email || !styleIds.every(id => currentByStyle.has(id))) return workspace;

  const fresh = createDemoWorkspace();
  const profile = owner;
  const items = fresh.items.map(seed => {
    const current = currentByStyle.get(seed.styleId);
    return {
      ...seed,
      id: current.id,
      modelId: current.modelId,
      profile,
      events: [...current.events.filter(event => !event.demo), ...seed.events],
    };
  });
  const seededInbox = workspace.inbox.filter(item => item.demo && item.id.startsWith('inbox-'));
  const seededInboxById = new Map(seededInbox.map(item => [item.id, item]));
  const freshInboxIds = new Set(fresh.inbox.map(item => item.id));
  const inbox = fresh.inbox.map(item => {
    const previous = seededInboxById.get(item.id);
    return previous ? { ...item, read: previous.read, replies: previous.replies } : item;
  });
  const repliedConversations = seededInbox.filter(item => !freshInboxIds.has(item.id) && item.replies.some(reply => !reply.id.startsWith('reply-')));
  const userItems = workspace.items.filter(item => !styleIds.includes(item.styleId));

  return normalizeWorkspaceIdentity({
    ...fresh,
    ...workspace,
    demoSeedVersion,
    items: [...items, ...userItems],
    tasks: [...workspace.tasks.filter(task => !task.demo || !task.id.startsWith('task-')), ...fresh.tasks],
    inbox: [...workspace.inbox.filter(item => !item.demo || !item.id.startsWith('inbox-')), ...repliedConversations, ...inbox],
    collections: { ...fresh.collections, ...workspace.collections },
  });
}
