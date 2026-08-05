const STATUSES = ['A postuler', 'Envoyee', 'Entretien', 'Refusee', 'Offre'];

const STATUS_LABELS = {
  'A postuler': 'À postuler',
  'Envoyee': 'Envoyée',
  'Entretien': 'Entretien',
  'Refusee': 'Refusée',
  'Offre': 'Offre',
};

const STATUS_COLOR_VARS = {
  'A postuler': '--status-a-postuler',
  'Envoyee': '--status-envoyee',
  'Entretien': '--status-entretien',
  'Refusee': '--status-refusee',
  'Offre': '--status-offre',
};

// Utilisée uniquement pour les segments de la barre (voir loadStats) :
// les badges, eux, gardent les couleurs pleines de STATUS_COLOR_VARS
// ci-dessus, car ils affichent du texte blanc dessus.
const STATUS_COLOR_VARS_PASTEL = {
  'A postuler': '--status-a-postuler-pastel',
  'Envoyee': '--status-envoyee-pastel',
  'Entretien': '--status-entretien-pastel',
  'Refusee': '--status-refusee-pastel',
  'Offre': '--status-offre-pastel',
};

const el = (id) => document.getElementById(id);

const form = el('application-form');
const formCard = el('form-card');
const formTitle = el('form-title');
const idField = el('application-id');
const companyField = el('company');
const positionField = el('position');
const statusField = el('status');
const dateField = el('date_applied');
const urlField = el('url');
const notesField = el('notes');
const submitBtn = el('submit-btn');
const cancelEditBtn = el('cancel-edit-btn');
const filterStatus = el('filter-status');
const statsBarTrack = el('stats-bar-track');
const statsLegend = el('stats-legend');
const listEl = el('applications-list');
const emptyMessage = el('empty-message');

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Erreur réseau');
  }
  return res.status === 204 ? null : res.json();
}

function resetForm() {
  form.reset();
  idField.value = '';
  formTitle.textContent = 'Nouvelle candidature';
  submitBtn.textContent = 'Ajouter';
  cancelEditBtn.classList.add('hidden');
}

function fillForm(app) {
  idField.value = app.id;
  companyField.value = app.company;
  positionField.value = app.position;
  statusField.value = app.status;
  dateField.value = app.date_applied || '';
  urlField.value = app.url || '';
  notesField.value = app.notes || '';
  formTitle.textContent = `Modifier : ${app.company}`;
  submitBtn.textContent = 'Enregistrer';
  cancelEditBtn.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // On retire puis remet la classe (avec un micro-délai) pour pouvoir
  // rejouer l'animation même si on clique "Modifier" deux fois de suite
  // sur des candidatures différentes — sinon la deuxième fois, la classe
  // est déjà présente et l'animation ne se déclenche pas.
  formCard.classList.remove('editing-flash');
  setTimeout(() => formCard.classList.add('editing-flash'), 10);
}

async function loadStats() {
  const stats = await fetchJSON('/api/stats');
  const total = STATUSES.reduce((sum, status) => sum + (stats[status] ?? 0), 0);

  // La barre : un segment par statut qui a au moins une candidature, dont
  // la largeur (en %) est proportionnelle à sa part du total. Un statut à
  // 0 ne produit aucun segment — inutile d'afficher une largeur de 0%.
  //
  // Astuce pour que ça s'anime vraiment : chaque segment démarre à 0
  // (règle CSS par défaut), et on ne fixe sa largeur finale qu'au frame
  // suivant (requestAnimationFrame). Si on mettait la largeur cible tout
  // de suite, le navigateur n'aurait jamais le temps de "voir" l'état à
  // 0 et afficherait direct le résultat final, sans transition visible.
  statsBarTrack.innerHTML = '';
  const pendingWidths = [];

  STATUSES.forEach((status) => {
    const count = stats[status] ?? 0;
    if (count === 0 || total === 0) return;

    const segment = document.createElement('div');
    segment.className = 'segment';
    segment.style.setProperty('--seg-color', `var(${STATUS_COLOR_VARS_PASTEL[status]})`);
    segment.title = `${STATUS_LABELS[status]} : ${count}`;
    statsBarTrack.appendChild(segment);
    pendingWidths.push([segment, (count / total) * 100]);
  });

  // Un seul requestAnimationFrame ne suffit pas toujours : au tout premier
  // chargement de la page, le navigateur peut regrouper le "width: 0" et le
  // "width: X%" dans le même rendu s'il n'a pas eu l'occasion de peindre
  // l'état de départ entre les deux. Un double rAF force à attendre une
  // frame complète avant de lancer le changement, ce qui rend la
  // transition fiable à chaque fois (pas juste "de temps en temps").
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      pendingWidths.forEach(([segment, widthPercent]) => {
        segment.style.width = `${widthPercent}%`;
      });
    });
  });

  // La légende, elle, montre toujours les 5 statuts (même à 0) pour que
  // le code couleur reste lisible sans avoir à survoler la barre.
  statsLegend.innerHTML = '';
  STATUSES.forEach((status, i) => {
    const item = document.createElement('span');
    item.className = 'legend-item';
    item.style.animationDelay = `${i * 0.1}s`; // cascade, comme pour les cartes
    item.innerHTML = `
      <span class="legend-dot" style="--dot-color: var(${STATUS_COLOR_VARS[status]})"></span>
      <strong>${stats[status] ?? 0}</strong> ${STATUS_LABELS[status]}
    `;
    statsLegend.appendChild(item);
  });
}

function renderApplication(app) {
  const card = document.createElement('div');
  card.className = 'application-card';

  const dateLabel = app.date_applied
    ? new Date(app.date_applied).toLocaleDateString('fr-FR')
    : 'Pas de date';

  card.innerHTML = `
    <div class="application-main">
      <div class="company">${app.company}</div>
      <div class="position">${app.position}</div>
      <div class="application-meta">
        <span class="status-badge" style="--badge-color: var(${STATUS_COLOR_VARS[app.status]})">
          ${STATUS_LABELS[app.status] || app.status}
        </span>
        <span class="application-date">${dateLabel}</span>
        ${app.url ? `<a class="application-link" href="${app.url}" target="_blank" rel="noopener">Voir l'offre ↗</a>` : ''}
      </div>
      ${app.notes ? `<div class="application-notes">${app.notes}</div>` : ''}
    </div>
    <div class="application-actions">
      <button class="edit-btn">Modifier</button>
      <button class="delete-btn">Supprimer</button>
    </div>
  `;

  card.querySelector('.edit-btn').addEventListener('click', () => fillForm(app));
  card.querySelector('.delete-btn').addEventListener('click', () => deleteApplication(app.id, app.company, card));

  return card;
}

async function loadApplications() {
  const status = filterStatus.value;
  const url = status ? `/api/applications?status=${encodeURIComponent(status)}` : '/api/applications';
  const applications = await fetchJSON(url);

  listEl.innerHTML = '';
  if (applications.length === 0) {
    emptyMessage.classList.remove('hidden');
  } else {
    emptyMessage.classList.add('hidden');
    applications.forEach((app, i) => {
      const card = renderApplication(app);
      // Petit décalage croissant par carte : elles apparaissent en
      // cascade plutôt que toutes d'un coup (l'animation "cardIn" est
      // définie en CSS, ici on ne fait que retarder son démarrage).
      card.style.animationDelay = `${i * 0.05}s`;
      listEl.appendChild(card);
    });
  }
}

async function refreshAll() {
  await Promise.all([loadStats(), loadApplications()]);
}

async function deleteApplication(id, company, card) {
  if (!confirm(`Supprimer la candidature "${company}" ?`)) return;

  // On joue d'abord l'animation de sortie (voir @keyframes cardOut en CSS)
  // et on attend l'événement "animationend" avant d'appeler l'API : sinon
  // refreshAll() reconstruirait la liste instantanément et on ne verrait
  // jamais l'animation.
  await new Promise((resolve) => {
    card.classList.add('removing');
    card.addEventListener('animationend', resolve, { once: true });
  });

  await fetchJSON(`/api/applications/${id}`, { method: 'DELETE' });
  refreshAll();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    company: companyField.value.trim(),
    position: positionField.value.trim(),
    status: statusField.value,
    date_applied: dateField.value || null,
    url: urlField.value.trim() || null,
    notes: notesField.value.trim() || null,
  };

  const id = idField.value;
  try {
    if (id) {
      await fetchJSON(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetchJSON('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    refreshAll();
  } catch (err) {
    alert(err.message);
  }
});

cancelEditBtn.addEventListener('click', resetForm);
filterStatus.addEventListener('change', loadApplications);

refreshAll();
