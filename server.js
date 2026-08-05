const express = require('express');
const path = require('node:path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const STATUSES = ['A postuler', 'Envoyee', 'Entretien', 'Refusee', 'Offre'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/applications', (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db.prepare('SELECT * FROM applications WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare('SELECT * FROM applications ORDER BY created_at DESC').all();
  res.json(rows);
});

app.get('/api/applications/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Candidature introuvable' });
  res.json(row);
});

app.post('/api/applications', (req, res) => {
  const { company, position, status, date_applied, url, notes } = req.body;
  if (!company || !position) {
    return res.status(400).json({ error: 'Entreprise et poste sont requis' });
  }
  const finalStatus = STATUSES.includes(status) ? status : 'A postuler';

  const result = db.prepare(
    'INSERT INTO applications (company, position, status, date_applied, url, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(company, position, finalStatus, date_applied || null, url || null, notes || null);

  const created = db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

app.put('/api/applications/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Candidature introuvable' });

  const { company, position, status, date_applied, url, notes } = req.body;
  const finalStatus = STATUSES.includes(status) ? status : existing.status;

  db.prepare(
    'UPDATE applications SET company = ?, position = ?, status = ?, date_applied = ?, url = ?, notes = ? WHERE id = ?'
  ).run(
    company ?? existing.company,
    position ?? existing.position,
    finalStatus,
    date_applied ?? existing.date_applied,
    url ?? existing.url,
    notes ?? existing.notes,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  res.json(updated);
});

app.delete('/api/applications/:id', (req, res) => {
  const result = db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Candidature introuvable' });
  res.status(204).send();
});

app.get('/api/stats', (req, res) => {
  const rows = db.prepare('SELECT status, COUNT(*) as count FROM applications GROUP BY status').all();
  const stats = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  rows.forEach((r) => { stats[r.status] = r.count; });
  res.json(stats);
});

app.listen(PORT, () => {
  console.log(`Job Tracker en écoute sur http://localhost:${PORT}`);
});
