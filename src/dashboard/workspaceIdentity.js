const seedActorEmails = new Set(['marta@atelier.demo', 'luca@atelier.demo', 'elena@atelier.demo', 'giulia@atelier.demo', 'sara@atelier.demo', 'paolo@atelier.demo', 'francesca@atelier.demo']);
const emailKey = email => typeof email === 'string' ? email.trim().toLowerCase() : '';

// These deterministic IDs migrate the single demo workspace; new records use random UUIDs.
function seedId(key) {
  const chunks = [0, 1, 2, 3].map(lane => {
    let hash = 2166136261;
    for (const character of `weave-demo-v1:${lane}:${key}`) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    return (hash >>> 0).toString(16).padStart(8, '0');
  }).join('');
  return `${chunks.slice(0, 8)}-${chunks.slice(8, 12)}-4${chunks.slice(13, 16)}-8${chunks.slice(17, 20)}-${chunks.slice(20)}`;
}

export function sameActor(actor, profile) {
  if (!actor || !profile) return false;
  if (actor.id && profile.id) return actor.id === profile.id;
  const email = emailKey(actor.email);
  return Boolean(email) && email === emailKey(profile.email);
}

export function normalizeWorkspaceIdentity(workspace) {
  const profile = (workspace.items.find(item => item.styleId === workspace.activeId) || workspace.items[0]).profile;
  const ownerEmail = emailKey(profile.email);
  const actors = [...workspace.items.flatMap(item => item.events.map(event => event.actor)), ...workspace.tasks.map(task => task.assignee), ...workspace.inbox.flatMap(item => [item.actor, ...item.replies.map(reply => reply.actor)])];
  const ownerEmailMatches = email => email === 'demo@weave.it' || email === ownerEmail && !seedActorEmails.has(email);
  const ownerId = profile.id || workspace.items.find(item => item.profile.id)?.profile.id || actors.find(actor => actor?.id && ownerEmailMatches(emailKey(actor.email)))?.id || seedId('user:owner');
  const actorIds = new Map(actors.filter(actor => actor?.id && emailKey(actor.email)).map(actor => [emailKey(actor.email), actor.id]));
  const modelIds = new Map();
  for (const item of workspace.items) if (item.modelId) modelIds.set(item.productId || item.styleId, item.modelId);
  const actorWithId = actor => {
    if (!actor || actor.id) return actor;
    const email = emailKey(actor.email);
    return { ...actor, id: ownerEmailMatches(email) ? ownerId : actorIds.get(email) || seedId(`user:${email}`) };
  };
  return {
    ...workspace,
    id: workspace.id || seedId('workspace:atelier'),
    items: workspace.items.map(item => ({
      ...item,
      id: item.id || seedId(`variant:${item.styleId}`),
      modelId: item.modelId || modelIds.get(item.productId || item.styleId) || seedId(`model:${item.productId || item.styleId}`),
      ...Object.fromEntries(['purchaseOrders', 'wholesaleOrders', 'shipments', 'lifecycle'].map(key => [key, item[key].map(row => ({ ...row, recordId: row.recordId || seedId(`record:${item.id || item.styleId}:${key}:${row.id}`) }))])),
      profile: { ...item.profile, id: item.profile.id || ownerId },
      events: item.events.map(event => ({ ...event, actor: actorWithId(event.actor) })),
    })),
    tasks: workspace.tasks.map(task => ({ ...task, assignee: actorWithId(task.assignee) })),
    inbox: workspace.inbox.map(item => ({ ...item, actor: actorWithId(item.actor), replies: item.replies.map(reply => ({ ...reply, actor: actorWithId(reply.actor) })) })),
  };
}
