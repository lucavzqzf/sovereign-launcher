// Forum Sovereign : lit/écrit dans Supabase via 4 fonctions publiques (voir forum.sql).
const SUPABASE_URL = 'https://nmsfergmsogzmwqevsus.supabase.co';
const ANON_KEY = 'sb_publishable_tpiuv6BZnBlNVsEgqocUaQ_sSUcuWe2';
const $ = (id) => document.getElementById(id);
const LABEL = { bug: 'BUG', suggestion: 'IDÉE', autre: 'AUTRE' };
const ERRORS = {
  bad_author: 'Pseudo invalide (2 à 20 caractères).',
  bad_category: 'Type invalide.',
  bad_title: 'Titre trop court ou trop long (4 à 100 caractères).',
  bad_body: 'Message trop court ou trop long.',
  rate_limit: 'Doucement ! Trop de messages en peu de temps, réessayez dans quelques minutes.',
  not_found: 'Sujet introuvable.',
};
let posts = [], filter = 'all', currentId = null;

async function rpc(name, args) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(args || {}),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text; // textContent : jamais de HTML injecté
  return e;
}
const when = (iso) => new Date(iso).toLocaleString('fr-CH', { dateStyle: 'medium', timeStyle: 'short' });
const tag = (cat) => el('span', 'tag ' + cat, LABEL[cat] || cat);
const remember = (n) => { try { localStorage.setItem('forum_pseudo', n); } catch (e) {} };
const recall = () => { try { return localStorage.getItem('forum_pseudo') || ''; } catch (e) { return ''; } };

function renderList() {
  const box = $('list');
  box.replaceChildren();
  const shown = posts.filter((p) => filter === 'all' || p.category === filter);
  if (!shown.length) { box.append(el('p', 'empty-state', 'Aucun sujet pour le moment. Soyez le premier à écrire !')); return; }
  for (const p of shown) {
    const b = el('button', 'suggestion-item');
    b.type = 'button';
    const head = el('header');
    head.append(tag(p.category), el('span', null, p.author));
    b.append(head, el('h4', null, p.title),
      el('div', 'meta', when(p.created_at) + ' · ' + p.replies + ' réponse' + (p.replies > 1 ? 's' : '')));
    b.addEventListener('click', () => openPost(p.id));
    box.append(b);
  }
}
async function loadList() {
  try { posts = await rpc('forum_list'); renderList(); }
  catch (e) { $('list').replaceChildren(el('p', 'empty-state', 'Impossible de charger le forum pour le moment. Réessayez plus tard.')); }
}
async function openPost(id) {
  currentId = id;
  location.hash = 'sujet-' + id;
  $('listView').hidden = true; $('postView').hidden = false;
  if (!$('rAuthor').value) $('rAuthor').value = recall();
  $('postBox').replaceChildren(el('p', 'empty-state', 'Chargement…'));
  $('replies').replaceChildren();
  try {
    const r = await rpc('forum_get', { p_id: id });
    if (!r.ok) { $('postBox').replaceChildren(el('p', 'empty-state', ERRORS[r.error] || 'Erreur.')); return; }
    const p = r.post;
    $('postBox').replaceChildren(tag(p.category), el('h2', null, p.title),
      el('div', 'meta', p.author + ' · ' + when(p.created_at)), el('p', null, p.body));
    if (!r.replies.length) $('replies').append(el('p', 'empty-state', 'Pas encore de réponse.'));
    for (const x of r.replies) {
      const d = el('article', 'suggestion-item reply');
      d.append(el('div', 'meta', x.author + ' · ' + when(x.created_at)), el('p', null, x.body));
      $('replies').append(d);
    }
  } catch (e) { $('postBox').replaceChildren(el('p', 'empty-state', 'Impossible de charger ce sujet.')); }
}
function showList() {
  currentId = null;
  history.replaceState(null, '', location.pathname);
  $('postView').hidden = true; $('listView').hidden = false;
  loadList();
}
$('newBtn').addEventListener('click', () => {
  $('newForm').hidden = false;
  $('fAuthor').value = $('fAuthor').value || recall();
  $('fTitle').focus();
});
$('cancelBtn').addEventListener('click', () => { $('newForm').hidden = true; $('newMsg').textContent = ''; });
$('backBtn').addEventListener('click', showList);
$('filters').addEventListener('click', (ev) => {
  const b = ev.target.closest('button'); if (!b) return;
  filter = b.dataset.f;
  for (const x of $('filters').children) x.classList.toggle('on', x === b);
  renderList();
});
$('newForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const btn = ev.submitter; btn.disabled = true;
  const msg = $('newMsg'); msg.textContent = '';
  try {
    const r = await rpc('forum_post', { p_author: $('fAuthor').value, p_category: $('fCategory').value,
      p_title: $('fTitle').value, p_body: $('fBody').value });
    if (!r.ok) { msg.textContent = ERRORS[r.error] || 'Erreur.'; return; }
    remember($('fAuthor').value.trim());
    $('fTitle').value = ''; $('fBody').value = '';
    $('newForm').hidden = true;
    openPost(r.id);
  } catch (e) { msg.textContent = 'Envoi impossible, réessayez dans un instant.'; }
  finally { btn.disabled = false; }
});
$('replyForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const btn = ev.submitter; btn.disabled = true;
  const msg = $('replyMsg'); msg.textContent = '';
  try {
    const r = await rpc('forum_reply', { p_post: currentId, p_author: $('rAuthor').value, p_body: $('rBody').value });
    if (!r.ok) { msg.textContent = ERRORS[r.error] || 'Erreur.'; return; }
    remember($('rAuthor').value.trim());
    $('rBody').value = '';
    openPost(currentId);
  } catch (e) { msg.textContent = 'Envoi impossible, réessayez dans un instant.'; }
  finally { btn.disabled = false; }
});
$('rAuthor').value = recall();
const m = location.hash.match(/^#sujet-(\d+)$/);
if (m) openPost(Number(m[1])); else loadList();
