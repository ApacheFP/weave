// Session-only account examples; no real invitations, devices or billing data.
export const demoMembers = [
  { id: 'marta', name: 'Marta Bianchi', email: 'marta@atelier.demo', role: 'Responsabile design', team: 'Design', status: 'Attiva', seen: 'Ora' },
  { id: 'luca', name: 'Luca Ferri', email: 'luca@atelier.demo', role: 'Responsabile produzione', team: 'Filiera', status: 'Attivo', seen: '12 ott, 09:42' },
  { id: 'elena', name: 'Elena Conti', email: 'elena@atelier.demo', role: 'Controllo qualità', team: 'Qualità', status: 'Attiva', seen: '12 ott, 09:18' },
  { id: 'giulia', name: 'Giulia Neri', email: 'giulia@atelier.demo', role: 'Modellista', team: 'Design', status: 'Attiva', seen: '11 ott, 17:36' },
  { id: 'sara', name: 'Sara Moretti', email: 'sara@atelier.demo', role: 'Materiali e sourcing', team: 'Filiera', status: 'Attiva', seen: '11 ott, 16:52' },
  { id: 'paolo', name: 'Paolo Ricci', email: 'paolo@atelier.demo', role: 'Acquisti', team: 'Filiera', status: 'Attivo', seen: '11 ott, 15:20' },
  { id: 'francesca', name: 'Francesca Riva', email: 'francesca@atelier.demo', role: 'Brand e sostenibilità', team: 'Identità', status: 'Attiva', seen: '10 ott, 18:04' },
];
export const demoTeams = [
  { name: 'Design', detail: 'Concept, modellistica e sviluppo taglie', members: ['Marta Bianchi', 'Giulia Neri', 'Alex Rossi'], color: 'violet' },
  { name: 'Filiera', detail: 'Materiali, acquisti e avanzamento produzione', members: ['Luca Ferri', 'Sara Moretti', 'Paolo Ricci'], color: 'teal' },
  { name: 'Qualità', detail: 'Campioni, controlli e non conformità', members: ['Elena Conti', 'Luca Ferri'], color: 'blue' },
  { name: 'Identità', detail: 'Tracciabilità e passaporto digitale', members: ['Francesca Riva', 'Marta Bianchi'], color: 'rose' },
];
