const state = { pages: [], language: 'en' };
const $ = (id) => document.getElementById(id);
const api = async (url, options = {}) => {
  const res = await fetch(url, { credentials: 'include', ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};
const toast = (m) => { const t = $('toast'); t.innerText = m; t.style.display = 'block'; setTimeout(() => t.style.display = 'none', 2500); };

function selectedPageIds(containerId) {
  return [...document.querySelectorAll(`#${containerId} input[type=checkbox]:checked`)].map(c => c.value);
}

async function loadPages() {
  state.pages = await api('/api/pages');
  const html = state.pages.map(p => `<div class='row'><label><input type='checkbox' value='${p.page_id}'> ${p.page_name} (${p.token_preview})</label><button onclick='deletePage(${p.id})'>Delete</button></div>`).join('');
  $('pagesList').innerHTML = html || '<p>No pages connected.</p>';
  $('videoPages').innerHTML = html;
  $('photoPages').innerHTML = html;
}
window.deletePage = async (id) => { await api(`/api/pages/${id}`, { method: 'DELETE' }); toast('Page deleted'); loadPages(); };

async function loadHistory() {
  const q = new URLSearchParams({ status: $('filterStatus').value, type: $('filterType').value });
  const list = await api(`/api/history?${q.toString()}`);
  $('historyList').innerHTML = list.map(i => `<div class='card'><b>${i.page_name}</b> | ${i.type} | ${i.status}<br>${i.caption || ''}<br>${i.file_name || ''}<br>${i.facebook_post_id || ''}<br>${i.error_message || ''}<br>${i.created_at}<div class='row'><button onclick='retryHistory(${i.id})'>Retry</button><button onclick='deleteHistory(${i.id})'>Delete</button></div></div>`).join('');
}
window.deleteHistory = async (id) => { await api(`/api/history/${id}`, { method: 'DELETE' }); loadHistory(); };
window.retryHistory = async (id) => { const r = await api(`/api/history/${id}/retry`, { method: 'POST' }); toast(r.message); };

async function loadSettings() {
  const s = await api('/api/settings');
  $('appName').innerText = s.app_name;
  $('settingAppName').value = s.app_name;
  $('settingFooter').value = s.default_caption_footer;
  $('settingMaxUpload').value = s.max_upload_size_mb;
  $('settingTypes').value = s.allowed_file_types;
  $('settingTheme').value = s.theme;
  $('settingLang').value = s.language;
  document.body.classList.toggle('dark', s.theme === 'dark');
}

$('loginBtn').onclick = async () => {
  await api('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: $('username').value, password: $('password').value }) });
  $('loginView').classList.add('hidden'); $('dashboardView').classList.remove('hidden'); $('logoutBtn').classList.remove('hidden');
  await Promise.all([loadPages(), loadHistory(), loadSettings()]); toast('Welcome back');
};
$('logoutBtn').onclick = async () => { await api('/api/auth/logout', { method: 'POST' }); location.reload(); };
$('verifyTokenBtn').onclick = async () => { const r = await api('/api/facebook/verify-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: $('fbToken').value.trim() }) }); toast(`Token OK: ${r.token_preview}`); };
$('fetchPagesBtn').onclick = async () => { const r = await api('/api/facebook/fetch-pages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: $('fbToken').value.trim() }) }); toast(`Fetched ${r.count} pages`); loadPages(); };

$('videoFile').onchange = () => { const f = $('videoFile').files[0]; if (f) { $('videoPreview').src = URL.createObjectURL(f); $('videoPreview').classList.remove('hidden'); } };
$('photoFiles').onchange = () => { $('photoPreview').innerHTML = [...$('photoFiles').files].map(f => `<img src='${URL.createObjectURL(f)}' />`).join(''); };

$('postVideoBtn').onclick = async () => {
  const fd = new FormData();
  fd.append('caption', $('videoCaption').value);
  fd.append('videoUrl', $('videoUrl').value);
  fd.append('pageIds', JSON.stringify(selectedPageIds('videoPages')));
  if ($('videoFile').files[0]) fd.append('video', $('videoFile').files[0]);
  $('loading').classList.remove('hidden');
  const r = await api('/api/posts/video', { method: 'POST', body: fd }).finally(() => $('loading').classList.add('hidden'));
  toast(r.message);
  loadHistory();
};
$('postPhotosBtn').onclick = async () => {
  const fd = new FormData();
  fd.append('caption', $('photoCaption').value);
  fd.append('pageIds', JSON.stringify(selectedPageIds('photoPages')));
  [...$('photoFiles').files].forEach(f => fd.append('photos', f));
  $('loading').classList.remove('hidden');
  const r = await api('/api/posts/photos', { method: 'POST', body: fd }).finally(() => $('loading').classList.add('hidden'));
  toast(r.message);
  loadHistory();
};
$('loadHistoryBtn').onclick = loadHistory;

$('saveSettingsBtn').onclick = async () => {
  const payload = { app_name: $('settingAppName').value, default_caption_footer: $('settingFooter').value, max_upload_size_mb: Number($('settingMaxUpload').value || 50), allowed_file_types: $('settingTypes').value, theme: $('settingTheme').value, language: $('settingLang').value };
  const r = await api('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  document.body.classList.toggle('dark', r.settings.theme === 'dark');
  toast('Settings saved');
};
$('themeToggle').onclick = () => document.body.classList.toggle('dark');
$('langToggle').onclick = () => {
  state.language = state.language === 'en' ? 'km' : 'en';
  $('langToggle').innerText = state.language === 'en' ? 'ខ្មែរ' : 'English';
  toast(state.language === 'en' ? 'English mode' : 'ប្តូរទៅភាសាខ្មែរ');
};

(async function init() {
  try {
    await api('/api/me');
    $('loginView').classList.add('hidden'); $('dashboardView').classList.remove('hidden'); $('logoutBtn').classList.remove('hidden');
    await Promise.all([loadPages(), loadHistory(), loadSettings()]);
  } catch {}
})();

document.querySelectorAll('.feature').forEach(btn => btn.onclick = () => {
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  $(btn.dataset.view).classList.remove('hidden');
});

window.addEventListener('unhandledrejection', e => toast(e.reason.message || 'Error'));
