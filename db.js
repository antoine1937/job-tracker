const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const db = new DatabaseSync(path.join(__dirname, 'job-tracker.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'A postuler',
    date_applied TEXT,
    url TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Sur un hebergeur gratuit (Render...), le disque repart souvent a zero a
// chaque redeploiement : la base de donnees est recreee vide. Pour que la
// demo en ligne ne soit jamais vide (et que le projet soit aussi agreable
// a tester en local juste apres un `git clone`), on insere quelques
// candidatures d'exemple si la table est vide au demarrage. Le "(demo)"
// dans le nom de l'entreprise evite toute confusion avec de vraies
// candidatures si quelqu'un utilise l'app pour de vrai.
const { count } = db.prepare('SELECT COUNT(*) AS count FROM applications').get();

if (count === 0) {
  const seed = db.prepare(
    'INSERT INTO applications (company, position, status, date_applied, url, notes) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const demoApplications = [
    ['Doctolib (demo)', 'Developpeur Full Stack Junior', 'Envoyee', '2026-07-20', null, 'Postule via LinkedIn'],
    ['Blablacar (demo)', 'Developpeur Frontend', 'A postuler', null, null, null],
    ['OVHcloud (demo)', 'Developpeur Backend Node.js', 'Entretien', '2026-07-15', null, 'Entretien technique le 6 aout'],
    ['Shine (demo)', 'Developpeur Full Stack', 'Refusee', '2026-07-10', null, "Pas assez d'experience React"],
    ['Alan (demo)', 'Developpeur Junior', 'Offre', '2026-07-05', null, 'Offre recue, a negocier'],
    ['PayFit (demo)', 'Developpeur Full Stack Junior', 'Envoyee', '2026-07-22', null, null],
    ['Swile (demo)', 'Developpeur Frontend Junior', 'A postuler', null, null, 'A envoyer avant vendredi'],
  ];

  for (const app of demoApplications) {
    seed.run(...app);
  }
}

module.exports = db;
