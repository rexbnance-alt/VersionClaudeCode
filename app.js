// Greeting
var h = new Date().getHours();
var greeting = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
document.getElementById('greetingText').textContent = 'Good ' + greeting + ' 👋';

// Sidebar toggle
var expanded = false;
function toggleSidebar() {
  expanded = !expanded;
  var s = document.getElementById('sidebar');
  var b = document.getElementById('collapseBtn');
  s.classList.toggle('expanded', expanded);
  b.textContent = expanded ? '◀' : '▶';
  document.getElementById('mainContent').style.marginLeft = expanded ? 'var(--sidebar-expanded)' : 'var(--sidebar-w)';
  b.style.left = expanded ? 'calc(var(--sidebar-expanded) - 12px)' : 'calc(var(--sidebar-w) - 12px)';
}

// Nav active
function setActive(el) {
  var items = document.querySelectorAll('.nav-item');
  for (var i = 0; i < items.length; i++) items[i].classList.remove('active');
  el.classList.add('active');
}
function setSubActive(el) {
  var items = document.querySelectorAll('.sub-item');
  for (var i = 0; i < items.length; i++) items[i].classList.remove('active');
  el.classList.add('active');
}
function setSubSubActive(el) {
  var items = document.querySelectorAll('.sub-sub-item');
  for (var i = 0; i < items.length; i++) items[i].classList.remove('active');
  el.classList.add('active');
}

// Sub menu toggle
function toggleSub(navEl, subId) {
  var sub = document.getElementById(subId);
  var wasOpen = sub.classList.contains('open');
  var subs = document.querySelectorAll('.sub-menu');
  for (var i = 0; i < subs.length; i++) subs[i].classList.remove('open');
  if (!wasOpen) {
    sub.classList.add('open');
    if (!expanded) toggleSidebar();
  }
}

function toggleSubSub(el, subId) {
  var sub = document.getElementById(subId);
  var wasOpen = sub.classList.contains('open');
  var subs = document.querySelectorAll('.sub-sub-menu');
  for (var i = 0; i < subs.length; i++) subs[i].classList.remove('open');
  if (!wasOpen) sub.classList.add('open');
  el.classList.toggle('active', !wasOpen);
}

// Page switch
function showPage(page) {
  var pages = document.querySelectorAll('[id^="page-"]');
  for (var i = 0; i < pages.length; i++) pages[i].style.display = 'none';
  var p = document.getElementById('page-' + page);
  if (p) p.style.display = 'flex';
  if (page === 'script') { currentScriptApp = null; if (typeof renderScriptPage === 'function') renderScriptPage(); }
  else if (page === 'kb') { currentKbApp = null; if (typeof renderKbPage === 'function') renderKbPage(); }
}

// Toast
var toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  var t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  toastTimer = setTimeout(function() { t.classList.remove('show'); }, 2400);
}

// Theme toggle
var isDark = false;
function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle('dark', isDark);
  var icon = document.getElementById('themeIcon');
  if (isDark) {
    icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  } else {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
  }
  showToast(isDark ? '🌙 Dark mode on' : '☀️ Light mode on');
}

// Search shortcut
document.addEventListener('keydown', function(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    var input = document.querySelector('.search-bar input');
    if (input) input.focus();
  }
});

// ============ NOTIFICATION PANEL ============
var notifOpen = false;

function toggleNotif() {
  notifOpen = !notifOpen;
  document.getElementById('notifPanel').classList.toggle('open', notifOpen);
  document.getElementById('notifOverlay').classList.toggle('open', notifOpen);
}

function closeNotif() {
  notifOpen = false;
  document.getElementById('notifPanel').classList.remove('open');
  document.getElementById('notifOverlay').classList.remove('open');
}

// ============ MERGE REQUEST TRACKER ============
var merges = JSON.parse(localStorage.getItem('hd_merges') || '[]');
var glConfig = JSON.parse(localStorage.getItem('hd_gitlab') || '{}');
var currentFilter = 'all';

function saveMerges() {
  localStorage.setItem('hd_merges', JSON.stringify(merges));
}

function filterMerges(type) {
  currentFilter = type;
  var chips = document.querySelectorAll('.merge-chip');
  for (var i = 0; i < chips.length; i++) {
    chips[i].classList.toggle('active', chips[i].dataset.filter === type);
  }
  renderMerges();
}

function renderMerges() {
  var tbody = document.getElementById('mergeTbody');
  var emptyEl = document.getElementById('mergeEmpty');
  var table = document.getElementById('mergeTable');
  var subEl = document.getElementById('mergeListSub');
  var searchVal = (document.getElementById('mergeSearch') || {}).value || '';
  searchVal = searchVal.toLowerCase().trim();

  // Filter
  var filtered = merges.filter(function(m) {
    if (currentFilter === 'uat' && !m.uat) return false;
    if (currentFilter === 'prod' && !m.prod) return false;
    if (currentFilter === 'pending' && (!m.uat || m.prod)) return false;
    if (searchVal) {
      var hay = (m.title + ' ' + (m.author || '') + ' ' + (m.branch || '') + ' ' + (m.id || '')).toLowerCase();
      if (hay.indexOf(searchVal) === -1) return false;
    }
    return true;
  });

  // Sort newest first
  filtered.sort(function(a, b) {
    var ad = new Date(a.prodDate || a.uatDate || a.created || 0).getTime();
    var bd = new Date(b.prodDate || b.uatDate || b.created || 0).getTime();
    return bd - ad;
  });

  // Update stats
  var now = new Date();
  var thisMonth = merges.filter(function(m) {
    var d = new Date(m.prodDate || m.uatDate || m.created || 0);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  document.getElementById('statTotal').textContent = thisMonth.length;
  document.getElementById('statUat').textContent = merges.filter(function(m){return m.uat}).length;
  document.getElementById('statProd').textContent = merges.filter(function(m){return m.prod}).length;
  document.getElementById('statPending').textContent = merges.filter(function(m){return m.uat && !m.prod}).length;

  if (filtered.length === 0) {
    table.style.display = 'none';
    emptyEl.style.display = 'block';
    subEl.textContent = 'No merges to display';
    return;
  }

  table.style.display = '';
  emptyEl.style.display = 'none';
  subEl.textContent = 'Showing ' + filtered.length + ' of ' + merges.length + ' merges';

  tbody.innerHTML = '';
  for (var i = 0; i < filtered.length; i++) {
    var m = filtered[i];
    var tr = document.createElement('tr');

    var idCell = m.url
      ? '<a class="mr-link" href="' + escapeHtml(m.url) + '" target="_blank">' + escapeHtml(m.id || '—') + '</a>'
      : '<span class="ticket-id">' + escapeHtml(m.id || '—') + '</span>';

    var displayDate = m.prodDate || m.uatDate || m.created || '';
    var dateText = displayDate ? formatDate(displayDate) : '—';

    var uatCell = m.uat
      ? '<span class="env-badge env-uat">UAT ' + (m.uatDate ? formatDate(m.uatDate, true) : '✓') + '</span>'
      : '<span class="env-badge env-none">—</span>';

    var prodCell = m.prod
      ? '<span class="env-badge env-prod">PROD ' + (m.prodDate ? formatDate(m.prodDate, true) : '✓') + '</span>'
      : (m.uat ? '<span class="env-badge env-pending">Pending</span>' : '<span class="env-badge env-none">—</span>');

    tr.innerHTML =
      '<td>' + idCell + '</td>' +
      '<td>' + escapeHtml(m.title || '') + (m.project ? '<div style="font-size:11px;color:var(--faint);margin-top:2px">' + escapeHtml(m.project) + '</div>' : '') + '</td>' +
      '<td><span style="font-family:Courier New,monospace;font-size:11.5px;color:var(--muted)">' + escapeHtml(m.branch || '—') + '</span></td>' +
      '<td style="font-size:12.5px">' + escapeHtml(m.author || '—') + '</td>' +
      '<td>' + uatCell + '</td>' +
      '<td>' + prodCell + '</td>' +
      '<td style="font-size:12px;color:var(--muted)">' + dateText +
        '<div class="mr-actions" style="margin-top:4px">' +
          '<button class="mr-action-btn" onclick="editMerge(' + i + ')" title="Edit">✎</button>' +
          '<button class="mr-action-btn danger" onclick="deleteMerge(' + i + ')" title="Delete">🗑</button>' +
        '</div>' +
      '</td>';
    tbody.appendChild(tr);
  }
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, function(c) {
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
  });
}

function formatDate(d, short) {
  var dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  if (short) {
    return (dt.getMonth() + 1) + '/' + dt.getDate();
  }
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Modal: Log merge
function openLogMergeModal(idx) {
  document.getElementById('logMergeOverlay').classList.add('open');
  if (typeof idx === 'number') {
    var m = merges[idx];
    document.getElementById('mrId').value = m.id || '';
    document.getElementById('mrTitle').value = m.title || '';
    document.getElementById('mrBranch').value = m.branch || '';
    document.getElementById('mrAuthor').value = m.author || '';
    document.getElementById('mrProject').value = m.project || '';
    document.getElementById('mrUat').checked = !!m.uat;
    document.getElementById('mrProd').checked = !!m.prod;
    document.getElementById('mrUatDate').value = m.uatDate || '';
    document.getElementById('mrProdDate').value = m.prodDate || '';
    document.getElementById('mrNotes').value = m.notes || '';
    document.getElementById('mrUrl').value = m.url || '';
    window._editingMerge = idx;
  } else {
    var fields = ['mrId', 'mrTitle', 'mrBranch', 'mrProject', 'mrUatDate', 'mrProdDate', 'mrNotes', 'mrUrl'];
    for (var i = 0; i < fields.length; i++) document.getElementById(fields[i]).value = '';
    document.getElementById('mrAuthor').value = 'Rex S.';
    document.getElementById('mrUat').checked = false;
    document.getElementById('mrProd').checked = false;
    window._editingMerge = null;
  }
}

function closeLogMergeModal() {
  document.getElementById('logMergeOverlay').classList.remove('open');
}

function saveMerge() {
  var id = document.getElementById('mrId').value.trim();
  var title = document.getElementById('mrTitle').value.trim();
  if (!id || !title) {
    showToast('⚠️ MR ID and Title are required');
    return;
  }
  var entry = {
    id: id,
    title: title,
    branch: document.getElementById('mrBranch').value.trim(),
    author: document.getElementById('mrAuthor').value.trim(),
    project: document.getElementById('mrProject').value.trim(),
    uat: document.getElementById('mrUat').checked,
    prod: document.getElementById('mrProd').checked,
    uatDate: document.getElementById('mrUatDate').value,
    prodDate: document.getElementById('mrProdDate').value,
    notes: document.getElementById('mrNotes').value.trim(),
    url: document.getElementById('mrUrl').value.trim(),
    created: new Date().toISOString()
  };
  if (window._editingMerge != null) {
    merges[window._editingMerge] = entry;
    showToast('✅ Merge updated');
  } else {
    merges.push(entry);
    showToast('✅ Merge logged');
  }
  saveMerges();
  closeLogMergeModal();
  renderMerges();
}

function editMerge(idx) {
  openLogMergeModal(idx);
}

function deleteMerge(idx) {
  if (!confirm('Delete this merge record? This cannot be undone.')) return;
  merges.splice(idx, 1);
  saveMerges();
  renderMerges();
  showToast('🗑 Merge deleted');
}

// GitLab Config Modal
function openGitLabConfig() {
  document.getElementById('glHost').value = glConfig.host || 'https://gitlab.com';
  document.getElementById('glToken').value = glConfig.token || '';
  document.getElementById('glUser').value = glConfig.user || '';
  document.getElementById('glProjects').value = glConfig.projects || '';
  document.getElementById('gitlabOverlay').classList.add('open');
}

function closeGitLabConfig() {
  document.getElementById('gitlabOverlay').classList.remove('open');
}

function saveGitLabConfig() {
  glConfig = {
    host: document.getElementById('glHost').value.trim().replace(/\/$/, ''),
    token: document.getElementById('glToken').value.trim(),
    user: document.getElementById('glUser').value.trim(),
    projects: document.getElementById('glProjects').value.trim()
  };
  if (!glConfig.token) {
    showToast('⚠️ Personal Access Token is required');
    return;
  }
  localStorage.setItem('hd_gitlab', JSON.stringify(glConfig));
  closeGitLabConfig();
  showToast('✅ GitLab connected — syncing...');
  syncFromGitLab();
}

function testGitLabConnection() {
  var host = document.getElementById('glHost').value.trim().replace(/\/$/, '');
  var token = document.getElementById('glToken').value.trim();
  if (!host || !token) {
    showToast('⚠️ Fill host and token first');
    return;
  }
  showToast('🔄 Testing connection...');
  fetch(host + '/api/v4/user', { headers: { 'PRIVATE-TOKEN': token } })
    .then(function(r) { return r.json().then(function(d){ return { status: r.status, data: d }; }); })
    .then(function(res) {
      if (res.status === 200) {
        showToast('✅ Connected as ' + (res.data.name || res.data.username));
      } else {
        showToast('⚠️ ' + (res.data.message || 'Connection failed'));
      }
    })
    .catch(function(err) {
      showToast('⚠️ ' + (err.message || 'Network error'));
    });
}

function syncFromGitLab() {
  if (!glConfig.token) {
    showToast('⚠️ Connect GitLab first');
    openGitLabConfig();
    return;
  }
  showToast('🔄 Syncing from GitLab...');

  var host = glConfig.host || 'https://gitlab.com';
  var url = host + '/api/v4/merge_requests?state=merged&scope=all&per_page=50&order_by=updated_at';
  if (glConfig.user) {
    // Filter by author username if provided (strip @ if present)
    var u = glConfig.user.replace(/^@/, '');
    if (u.indexOf('@') === -1) {
      // looks like a username
      url = host + '/api/v4/merge_requests?state=merged&scope=all&author_username=' + encodeURIComponent(u) + '&per_page=50';
    }
  }

  fetch(url, { headers: { 'PRIVATE-TOKEN': glConfig.token } })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!Array.isArray(data)) throw new Error(data.message || 'Failed to fetch');

      var added = 0, updated = 0;
      for (var i = 0; i < data.length; i++) {
        var mr = data[i];
        var mrId = '!' + mr.iid;
        var existing = -1;
        for (var j = 0; j < merges.length; j++) {
          if (merges[j].id === mrId && merges[j].project === (mr.references ? mr.references.full : '').replace('!' + mr.iid, '')) {
            existing = j; break;
          }
        }

        // Detect environment from target branch
        var target = (mr.target_branch || '').toLowerCase();
        var isUat = target.indexOf('uat') !== -1 || target.indexOf('staging') !== -1 || target.indexOf('test') !== -1;
        var isProd = target === 'main' || target === 'master' || target === 'production' || target === 'prod' || target.indexOf('release') !== -1;

        var entry = {
          id: mrId,
          title: mr.title,
          branch: mr.source_branch,
          author: mr.author ? (mr.author.name || mr.author.username) : '',
          project: mr.references ? (mr.references.full || '').replace('!' + mr.iid, '') : '',
          uat: isUat || (existing >= 0 ? merges[existing].uat : false),
          prod: isProd || (existing >= 0 ? merges[existing].prod : false),
          uatDate: isUat ? (mr.merged_at || '').slice(0, 10) : (existing >= 0 ? merges[existing].uatDate : ''),
          prodDate: isProd ? (mr.merged_at || '').slice(0, 10) : (existing >= 0 ? merges[existing].prodDate : ''),
          notes: existing >= 0 ? merges[existing].notes : '',
          url: mr.web_url,
          created: mr.created_at
        };

        if (existing >= 0) {
          merges[existing] = entry;
          updated++;
        } else {
          merges.push(entry);
          added++;
        }
      }
      saveMerges();
      renderMerges();
      showToast('✅ Synced: ' + added + ' new, ' + updated + ' updated');
    })
    .catch(function(err) {
      console.error(err);
      showToast('⚠️ Sync failed: ' + (err.message || 'Network error').slice(0, 60));
    });
}

// Initial render when page loads (in case user lands on merge page)
setTimeout(renderMerges, 100);

// ============ TURNOVER MANAGEMENT ============
var turnovers = JSON.parse(localStorage.getItem('hd_turnovers') || '[]');
var expandedTurnoverId = null;
var editingTurnoverId = null;

function saveTurnovers() {
  localStorage.setItem('hd_turnovers', JSON.stringify(turnovers));
  if (typeof renderHeroPendingCard === 'function') renderHeroPendingCard();
}

function genTurnoverId() {
  return 't_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function formatTurnoverDateTime(iso) {
  if (!iso) return '—';
  var d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var hh = d.getHours();
  var mm = d.getMinutes();
  var ampm = hh >= 12 ? 'PM' : 'AM';
  var h12 = hh % 12; if (h12 === 0) h12 = 12;
  var mmStr = mm < 10 ? '0' + mm : '' + mm;
  return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() + ' - ' + h12 + ':' + mmStr + ' ' + ampm;
}

function isTodayIso(iso) {
  if (!iso) return false;
  var d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  var now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isWithin24h(iso) {
  if (!iso) return false;
  var d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  return (Date.now() - d.getTime()) < 24 * 60 * 60 * 1000;
}

function navigateToTurnoverPending() {
  setSidebarToTurnover('Pending');
  navigateToSimplePage('turnover-pending');
  expandedTurnoverId = null;
  if (typeof renderPendingTurnovers === 'function') renderPendingTurnovers();
}

function navigateToTurnoverResolved() {
  setSidebarToTurnover('Closed');
  navigateToSimplePage('turnover-resolved');
  expandedTurnoverId = null;
  renderResolvedTurnovers();
}

function setSidebarToTurnover(which) {
  var navItems = document.querySelectorAll('.nav-item');
  for (var i = 0; i < navItems.length; i++) {
    navItems[i].classList.remove('active');
    if (navItems[i].getAttribute('data-tip') === 'Turnover') navItems[i].classList.add('active');
  }
  var subMenus = document.querySelectorAll('.sub-menu');
  for (var j = 0; j < subMenus.length; j++) subMenus[j].classList.remove('open');
  var sub = document.getElementById('sub-turnover');
  if (sub) sub.classList.add('open');
  var subItems = document.querySelectorAll('.sub-item');
  for (var k = 0; k < subItems.length; k++) {
    subItems[k].classList.remove('active');
    var lbl = subItems[k].querySelector('.nav-label');
    if (lbl && lbl.textContent === which) subItems[k].classList.add('active');
  }
}

function renderPendingTurnovers() {
  var listWrap = document.getElementById('pendingListWrap');
  var detailWrap = document.getElementById('pendingDetailWrap');
  var empty = document.getElementById('pendingEmpty');
  var backBtn = document.getElementById('pendingBackBtn');
  var addBtn = document.getElementById('pendingAddBtn');
  var headerTitle = document.getElementById('pendingHeaderTitle');
  var headerSub = document.getElementById('pendingHeaderSub');

  if (backBtn) backBtn.style.display = 'none';
  if (addBtn) addBtn.style.display = '';
  if (detailWrap) detailWrap.style.display = 'none';
  if (headerTitle) headerTitle.textContent = 'Pending Turnover';

  var pending = turnovers.filter(function(t){ return t.status !== 'done'; });
  if (headerSub) headerSub.textContent = pending.length + ' active concern' + (pending.length === 1 ? '' : 's');

  if (pending.length === 0) {
    if (listWrap) listWrap.innerHTML = '';
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';

  pending.sort(function(a,b){ return new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime(); });
  if (listWrap) listWrap.innerHTML = buildTurnoverCardList(pending, 'pending');
  bindRenderedImages(listWrap);
}

function populateInstitutionFilter() { /* deprecated - institution field removed */ }

function clearResolvedFilters() {
  var s = document.getElementById('resolvedSearch'); if (s) s.value = '';
  renderResolvedTurnovers();
}

function renderResolvedTurnovers() {
  var listWrap = document.getElementById('resolvedListWrap');
  var detailWrap = document.getElementById('resolvedDetailWrap');
  var filters = document.getElementById('resolvedFilters');
  var empty = document.getElementById('resolvedEmpty');
  var backBtn = document.getElementById('resolvedBackBtn');
  var headerTitle = document.getElementById('resolvedHeaderTitle');
  var headerSub = document.getElementById('resolvedHeaderSub');

  if (backBtn) backBtn.style.display = 'none';
  if (detailWrap) detailWrap.style.display = 'none';
  if (filters) filters.style.display = '';
  if (headerTitle) headerTitle.textContent = 'Closed Turnover';

  var done = turnovers.filter(function(t){ return t.status === 'done'; });
  var search = ((document.getElementById('resolvedSearch') || {}).value || '').toLowerCase().trim();

  var filtered = done.filter(function(t){
    if (search) {
      var bodyText = (t.body || '').replace(/<[^>]*>/g, ' ');
      var hay = ((t.summary || '') + ' ' + bodyText).toLowerCase();
      if (hay.indexOf(search) === -1) return false;
    }
    return true;
  });

  if (headerSub) headerSub.textContent = filtered.length + ' closed' + (done.length !== filtered.length ? ' (of ' + done.length + ' total)' : '');

  if (done.length === 0) {
    if (listWrap) listWrap.innerHTML = '';
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';

  if (filtered.length === 0) {
    if (listWrap) listWrap.innerHTML = '<div class="card" style="padding:30px;text-align:center;color:var(--muted);font-size:13px;margin-top:8px">No closed turnovers match your filters.</div>';
    return;
  }

  filtered.sort(function(a,b){ return new Date(b.resolvedDate || 0).getTime() - new Date(a.resolvedDate || 0).getTime(); });
  if (listWrap) listWrap.innerHTML = buildTurnoverCardList(filtered, 'resolved');
  bindRenderedImages(listWrap);
}

function getTurnoverById(id) {
  for (var i = 0; i < turnovers.length; i++) if (turnovers[i].id === id) return turnovers[i];
  return null;
}

function getTurnoverIdx(id) {
  for (var i = 0; i < turnovers.length; i++) if (turnovers[i].id === id) return i;
  return -1;
}

function openTurnoverDetail(id) {
  var t = getTurnoverById(id);
  if (!t) { showToast('⚠️ Turnover not found'); return; }
  expandedTurnoverId = id;
  if (t.status === 'done') {
    setSidebarToTurnover('Closed');
    navigateToSimplePage('turnover-resolved');
    renderResolvedTurnovers();
  } else {
    setSidebarToTurnover('Pending');
    navigateToSimplePage('turnover-pending');
    renderPendingTurnovers();
  }
}

function toggleTurnoverRow(id, e) {
  if (e && e.target && e.target.closest && e.target.closest('button, textarea, input')) return;
  expandedTurnoverId = expandedTurnoverId === id ? null : id;
  var t = getTurnoverById(id);
  if (!t) return;
  if (t.status === 'done') renderResolvedTurnovers();
  else renderPendingTurnovers();
}

function buildTurnoverCardList(items, scope) {
  if (!items.length) return '';
  var html = '<div style="display:flex;flex-direction:column;gap:12px;margin-top:8px">';
  for (var i = 0; i < items.length; i++) {
    var t = items[i];
    var isExpanded = expandedTurnoverId === t.id;
    var bodyText = (t.summary || deriveSummaryText(t.body || ''));
    var commentCount = (t.remarks || []).length;
    var dateLabel = scope === 'resolved' ? relTime(t.resolvedDate) : relTime(t.created);
    var titleText = t.title || t.summary || '(untitled)';

    var menuId = 'turnoverMenu-' + t.id;
    var primaryAction = t.status === 'done'
      ? '<div class="turnover-menu-item" onclick="closeAllTurnoverMenus();reopenTurnover(\'' + escapeJs(t.id) + '\')">↩ Reopen</div>'
      : '<div class="turnover-menu-item" onclick="closeAllTurnoverMenus();markTurnoverDone(\'' + escapeJs(t.id) + '\')">✓ Mark as Closed</div>';
    var menuHtml =
      '<div class="turnover-menu-wrap" style="position:relative" onclick="event.stopPropagation()">' +
        '<button class="db-icon-btn" onclick="event.stopPropagation();toggleTurnoverMenu(\'' + escapeJs(t.id) + '\')" title="More options" style="font-size:18px;font-weight:700;width:28px;height:28px">⋮</button>' +
        '<div id="' + menuId + '" class="turnover-menu" style="display:none">' +
          primaryAction +
          '<div class="turnover-menu-item" onclick="closeAllTurnoverMenus();editTurnover(\'' + escapeJs(t.id) + '\')">✎ Edit</div>' +
          '<div class="turnover-menu-item danger" onclick="closeAllTurnoverMenus();deleteTurnover(\'' + escapeJs(t.id) + '\')">🗑 Delete</div>' +
        '</div>' +
      '</div>';

    var commentSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
    var calendarSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

    var newBadge = (scope === 'pending' && isWithin24h(t.created)) ? '<span class="turnover-new-badge">NEW</span> ' : '';
    html += '<div class="turnover-card' + (isExpanded ? ' expanded' : '') + '" onclick="toggleTurnoverRow(\'' + escapeJs(t.id) + '\',event)">' +
      '<div class="turnover-card-header">' +
        '<div class="turnover-card-title">' + newBadge + escapeHtml(titleText) + '</div>' +
        '<div class="turnover-card-top-meta">' +
          '<span class="turnover-card-date">' + calendarSvg + '<span>' + escapeHtml(dateLabel) + '</span></span>' +
          menuHtml +
        '</div>' +
      '</div>' +
      (isExpanded
        ? '<div class="rich-rendered turnover-card-body-full">' + (t.body || '<span style="color:var(--faint);font-style:italic">' + escapeHtml(t.summary || '(no content)') + '</span>') + '</div>'
        : '<div class="turnover-card-body">' + escapeHtml(bodyText) + '</div>') +
      '<div class="turnover-card-meta">' +
        '<span class="turnover-card-comments">' + commentSvg + '<span>' + commentCount + '</span></span>' +
      '</div>' +
      (isExpanded ? buildTurnoverInlineExtras(t) : '') +
    '</div>';
  }
  html += '</div>';
  return html;
}

function buildTurnoverInlineExtras(t) {
  var remarks = (t.remarks || []).slice().sort(function(a,b){ return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime(); });
  var remarksHtml = '';
  for (var c = 0; c < remarks.length; c++) {
    var rm = remarks[c];
    remarksHtml +=
      '<div class="turnover-remark">' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:11px;color:var(--faint)">' + escapeHtml(formatTurnoverDateTime(rm.date)) + '</div>' +
          '<div style="font-size:12.5px;color:var(--text);margin-top:2px;line-height:1.5;white-space:pre-wrap">' + escapeHtml(rm.text) + '</div>' +
        '</div>' +
        '<button class="db-icon-btn" onclick="event.stopPropagation();deleteTurnoverRemark(\'' + escapeJs(t.id) + '\',' + c + ')" title="Delete remark" style="color:var(--red);width:22px;height:22px;font-size:11px;flex-shrink:0">🗑</button>' +
      '</div>';
  }

  return '<div class="turnover-card-extra" onclick="event.stopPropagation()">' +
    (remarks.length > 0 ? '<div class="turnover-remarks-list">' + remarksHtml + '</div>' : '') +
    '<div class="turnover-add-remark">' +
      '<textarea id="newRemarkInput" class="form-input" placeholder="Add a comment..." onclick="event.stopPropagation()" style="width:100%;min-height:52px;font-family:inherit;font-size:12.5px;box-sizing:border-box"></textarea>' +
      '<div style="display:flex;justify-content:flex-end;margin-top:8px">' +
        '<button class="new-btn" onclick="event.stopPropagation();addTurnoverRemark(\'' + escapeJs(t.id) + '\')" style="padding:8px 14px;font-size:12px">+ Add Remark</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function toggleTurnoverMenu(id) {
  var menuId = 'turnoverMenu-' + id;
  var allMenus = document.querySelectorAll('.turnover-menu');
  for (var i = 0; i < allMenus.length; i++) {
    if (allMenus[i].id !== menuId) allMenus[i].style.display = 'none';
  }
  var menu = document.getElementById(menuId);
  if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function closeAllTurnoverMenus() {
  var allMenus = document.querySelectorAll('.turnover-menu');
  for (var i = 0; i < allMenus.length; i++) allMenus[i].style.display = 'none';
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.turnover-menu-wrap')) closeAllTurnoverMenus();
});

function backToPendingList() {
  expandedTurnoverId = null;
  renderPendingTurnovers();
}

function backToResolvedList() {
  expandedTurnoverId = null;
  renderResolvedTurnovers();
}

function openTurnoverModal(id) {
  editingTurnoverId = id || null;
  var titleEl = document.getElementById('turnoverModalTitle');
  var titleInput = document.getElementById('turnoverTitleInput');
  var bodyEl = document.getElementById('turnoverBodyEditor');

  if (id) {
    var t = getTurnoverById(id);
    if (!t) return;
    titleEl.textContent = 'Edit Turnover';
    titleInput.value = t.title || t.summary || '';
    var rich = (t.body && t.body.trim()) ? t.body : escapeHtml(t.summary || '');
    bodyEl.innerHTML = rich;
  } else {
    titleEl.textContent = 'New Pending Turnover';
    titleInput.value = '';
    bodyEl.innerHTML = '';
  }
  document.getElementById('turnoverModalOverlay').classList.add('open');
  setTimeout(function(){ titleInput.focus(); }, 50);
}

function closeTurnoverModal() {
  document.getElementById('turnoverModalOverlay').classList.remove('open');
}

function deriveSummaryText(html) {
  var div = document.createElement('div');
  div.innerHTML = html || '';
  var text = (div.textContent || '').replace(/\s+/g, ' ').trim();
  if (text) return text.slice(0, 140);
  if ((html || '').indexOf('<img') !== -1) return '(image)';
  return '';
}

function saveTurnover() {
  var title = (document.getElementById('turnoverTitleInput').value || '').trim();
  var bodyEl = document.getElementById('turnoverBodyEditor');
  var html = bodyEl.innerHTML;
  var summaryText = deriveSummaryText(html);
  if (!title) { showToast('⚠️ Title required'); return; }
  if (!summaryText) { showToast('⚠️ Summary required'); return; }

  if (editingTurnoverId) {
    var idx = getTurnoverIdx(editingTurnoverId);
    if (idx === -1) { closeTurnoverModal(); return; }
    turnovers[idx].title = title;
    turnovers[idx].summary = summaryText;
    turnovers[idx].body = html;
    turnovers[idx].updated = new Date().toISOString();
    showToast('✅ Turnover updated');
  } else {
    var entry = {
      id: genTurnoverId(),
      title: title,
      summary: summaryText,
      body: html,
      status: 'pending',
      created: new Date().toISOString(),
      resolvedDate: null,
      remarks: []
    };
    turnovers.push(entry);
    expandedTurnoverId = null;
    showToast('✅ Turnover logged');
  }
  saveTurnovers();
  closeTurnoverModal();
  expandedTurnoverId = null;
  if (editingTurnoverId) {
    var t = getTurnoverById(editingTurnoverId);
    if (t && t.status === 'done') renderResolvedTurnovers();
    else renderPendingTurnovers();
  } else {
    setSidebarToTurnover('Pending');
    navigateToSimplePage('turnover-pending');
    renderPendingTurnovers();
  }
  editingTurnoverId = null;
}

function editTurnover(id) {
  openTurnoverModal(id);
}

function deleteTurnover(id) {
  var t = getTurnoverById(id);
  if (!t) return;
  if (!confirm('Delete turnover "' + (t.summary || '(no summary)') + '"?\n\nThis cannot be undone.')) return;
  var idx = getTurnoverIdx(id);
  if (idx >= 0) turnovers.splice(idx, 1);
  expandedTurnoverId = null;
  saveTurnovers();
  showToast('🗑 Turnover removed');
  var pendingPage = document.getElementById('page-turnover-pending');
  var resolvedPage = document.getElementById('page-turnover-resolved');
  if (pendingPage && pendingPage.style.display !== 'none') renderPendingTurnovers();
  else if (resolvedPage && resolvedPage.style.display !== 'none') renderResolvedTurnovers();
}

function markTurnoverDone(id) {
  var t = getTurnoverById(id);
  if (!t) return;
  if (!confirm('Mark "' + (t.summary || 'this turnover') + '" as Closed?\n\nIt will move to the Closed Turnover page.')) return;
  t.status = 'done';
  t.resolvedDate = new Date().toISOString();
  if (!t.remarks) t.remarks = [];
  t.remarks.push({ text: 'Status changed to Closed.', date: new Date().toISOString() });
  saveTurnovers();
  showToast('✅ Turnover closed');
  expandedTurnoverId = null;
  setSidebarToTurnover('Closed');
  navigateToSimplePage('turnover-resolved');
  renderResolvedTurnovers();
}

function reopenTurnover(id) {
  var t = getTurnoverById(id);
  if (!t) return;
  if (!confirm('Reopen "' + (t.summary || 'this turnover') + '"?\n\nIt will move back to Pending Turnover.')) return;
  t.status = 'pending';
  t.resolvedDate = null;
  if (!t.remarks) t.remarks = [];
  t.remarks.push({ text: 'Status reopened to Pending.', date: new Date().toISOString() });
  saveTurnovers();
  showToast('↩ Turnover reopened');
  expandedTurnoverId = null;
  setSidebarToTurnover('Pending');
  navigateToSimplePage('turnover-pending');
  renderPendingTurnovers();
}

function addTurnoverRemark(id) {
  var t = getTurnoverById(id);
  if (!t) return;
  var input = document.getElementById('newRemarkInput');
  var text = (input ? input.value : '').trim();
  if (!text) { showToast('⚠️ Remark cannot be empty'); return; }
  if (!t.remarks) t.remarks = [];
  t.remarks.push({ text: text, date: new Date().toISOString() });
  saveTurnovers();
  showToast('✅ Remark added');
  if (t.status === 'done') renderResolvedTurnovers();
  else renderPendingTurnovers();
}

function deleteTurnoverRemark(id, remarkIdx) {
  var t = getTurnoverById(id);
  if (!t || !t.remarks) return;
  if (!confirm('Delete this remark?')) return;
  var sorted = (t.remarks || []).slice().map(function(r, i){ return { r: r, i: i }; }).sort(function(a,b){ return new Date(a.r.date || 0).getTime() - new Date(b.r.date || 0).getTime(); });
  if (remarkIdx < 0 || remarkIdx >= sorted.length) return;
  var realIdx = sorted[remarkIdx].i;
  t.remarks.splice(realIdx, 1);
  saveTurnovers();
  if (t.status === 'done') renderResolvedTurnovers();
  else renderPendingTurnovers();
}

function renderHeroPendingCard() {
  var totalEl = document.getElementById('heroPendingTotal');
  var resolvedEl = document.getElementById('heroPendingResolved');
  var pending = 0, resolvedToday = 0;
  for (var i = 0; i < turnovers.length; i++) {
    var t = turnovers[i];
    if (t.status === 'done') {
      if (isTodayIso(t.resolvedDate)) resolvedToday++;
    } else {
      pending++;
    }
  }
  if (totalEl) totalEl.textContent = pending;
  if (resolvedEl) resolvedEl.textContent = '+' + resolvedToday + ' closed today';
}

setTimeout(function(){
  renderHeroPendingCard();
}, 100);

// ============ KNOWLEDGE HUB (SCRIPT + KB) ============
var scriptApps = JSON.parse(localStorage.getItem('hd_script_apps') || '[]');
var kbApps = JSON.parse(localStorage.getItem('hd_kb_apps') || '[]');
var currentScriptApp = null;
var currentKbApp = null;
var editingAppType = null;
var editingAppIdx = null;
var editingScriptIdx = null;
var editingArticleIdx = null;
var currentScriptItem = null;
var currentKbItem = null;
var pendingAppIcon = '📁';
var lastEditorFocused = null;

var APP_COLORS = {
  purple: { bg: '#EDE9FF', fg: '#6B4EFF' }
};

var ICON_GROUPS = [
  { label: 'Folders', icons: [
    '📁','📂','🗂️','🗃️','🗄️','📋','📑','📃','📄','📰','🗞️',
    '📊','📈','📉','📓','📔','📕','📗','📘','📙','📒','📚',
    '📝','📜','🏷️','🎫','💼','📦','🗒️','📅','📆','🔖'
  ] }
];

function saveScriptApps() {
  localStorage.setItem('hd_script_apps', JSON.stringify(scriptApps));
  if (typeof renderHeroStats === 'function') renderHeroStats();
}
function saveKbApps() {
  localStorage.setItem('hd_kb_apps', JSON.stringify(kbApps));
  if (typeof renderDashboardKb === 'function') renderDashboardKb();
  if (typeof renderHeroStats === 'function') renderHeroStats();
}

function relTime(iso) {
  if (!iso) return '—';
  var d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  var diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + ' mins ago';
  if (diff < 86400) return Math.floor(diff / 3600) + ' hrs ago';
  if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
  return formatDate(iso);
}

// ── Apps table builder (shared) ──
function buildAppsTable(apps, type) {
  var headerLabel = type === 'script' ? 'Scripts' : 'Articles';
  var color = APP_COLORS.purple;
  var html = '<div class="card" style="overflow:hidden">' +
    '<table class="ticket-table">' +
      '<thead><tr>' +
        '<th>Name</th>' +
        '<th>' + headerLabel + '</th>' +
        '<th>Updated</th>' +
        '<th style="text-align:right">Actions</th>' +
      '</tr></thead>' +
      '<tbody>';
  for (var i = 0; i < apps.length; i++) {
    var app = apps[i];
    var count = type === 'script' ? (app.scripts || []).length : (app.articles || []).length;
    var lastUpdated = '';
    var items = type === 'script' ? (app.scripts || []) : (app.articles || []);
    if (items.length > 0) {
      var latest = items.reduce(function(a, b) {
        return (new Date(b.created || 0).getTime() > new Date(a.created || 0).getTime()) ? b : a;
      });
      lastUpdated = relTime(latest.created);
    } else {
      lastUpdated = relTime(app.created);
    }

    html += '<tr style="cursor:pointer" onclick="' + (type === 'script' ? 'openScriptApp(' + i + ')' : 'openKbApp(' + i + ')') + '">' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<span style="font-weight:600;color:var(--purple)">' + escapeHtml(app.name) + '</span>' +
          '<span style="font-size:18px;line-height:1">' + escapeHtml(app.icon || '📁') + '</span>' +
        '</div>' +
      '</td>' +
      '<td><span style="background:' + color.bg + ';color:' + color.fg + ';font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:20px">' + count + '</span></td>' +
      '<td style="font-size:12.5px;color:var(--muted)">' + lastUpdated + '</td>' +
      '<td style="text-align:right;white-space:nowrap" onclick="event.stopPropagation()">' +
        '<button class="db-icon-btn" onclick="editApp(\'' + type + '\',' + i + ')" title="Edit">✎</button>' +
        '<button class="db-icon-btn" onclick="deleteApp(\'' + type + '\',' + i + ')" title="Delete" style="color:var(--red);margin-left:4px">🗑</button>' +
      '</td>' +
    '</tr>';
  }
  html += '</tbody></table></div>';
  return html;
}

// ── SCRIPT page ──
function renderScriptPage() {
  if (currentScriptItem !== null) { renderScriptItemView(); return; }
  if (currentScriptApp !== null) { renderScriptDetail(); return; }
  var grid = document.getElementById('scriptAppsGrid');
  var empty = document.getElementById('scriptAppsEmpty');
  document.getElementById('scriptDetail').style.display = 'none';
  document.getElementById('scriptItemsEmpty').style.display = 'none';
  document.getElementById('scriptBackBtn').style.display = 'none';
  document.getElementById('scriptAddItemBtn').style.display = 'none';
  document.getElementById('scriptAddAppBtn').style.display = '';
  document.getElementById('scriptHeaderTitle').textContent = 'Script';
  document.getElementById('scriptHeaderSub').textContent = 'Group scripts by application';

  if (scriptApps.length === 0) {
    grid.style.display = 'none';
    grid.innerHTML = '';
    empty.style.display = '';
    return;
  }
  grid.style.display = '';
  grid.style.gridTemplateColumns = 'unset';
  empty.style.display = 'none';
  grid.innerHTML = buildAppsTable(scriptApps, 'script');
}

function renderScriptDetail() {
  var idx = currentScriptApp;
  if (idx === null || !scriptApps[idx]) { backToScriptApps(); return; }
  var app = scriptApps[idx];
  document.getElementById('scriptAppsGrid').style.display = 'none';
  document.getElementById('scriptAppsEmpty').style.display = 'none';
  document.getElementById('scriptBackBtn').style.display = '';
  document.getElementById('scriptBackBtn').textContent = '← Back to applications';
  document.getElementById('scriptBackBtn').onclick = backToScriptApps;
  document.getElementById('scriptAddItemBtn').style.display = '';
  document.getElementById('scriptAddAppBtn').style.display = 'none';
  document.getElementById('scriptHeaderTitle').innerHTML =
    '<span style="font-size:13px;font-weight:500;color:var(--muted)">Script · </span>' +
    '<span style="display:inline-flex;align-items:center;gap:8px">' + escapeHtml(app.name) + '<span style="font-size:22px">' + escapeHtml(app.icon || '📁') + '</span></span>';
  document.getElementById('scriptHeaderSub').textContent = (app.scripts || []).length + ' scripts';

  var detail = document.getElementById('scriptDetail');
  var empty = document.getElementById('scriptItemsEmpty');
  if (!app.scripts || app.scripts.length === 0) {
    detail.style.display = 'none';
    empty.style.display = '';
    return;
  }
  detail.style.display = '';
  empty.style.display = 'none';

  var html = '<div class="card" style="overflow:hidden">' +
    '<table class="ticket-table">' +
      '<thead><tr>' +
        '<th>Title</th>' +
        '<th>Comments</th>' +
        '<th>Updated</th>' +
        '<th style="text-align:right">Actions</th>' +
      '</tr></thead>' +
      '<tbody>';
  for (var i = 0; i < app.scripts.length; i++) {
    var s = app.scripts[i];
    var commentCount = (s.comments || []).length;
    html += '<tr style="cursor:pointer" onclick="openScriptItem(' + i + ')">' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<span style="font-size:15px">📜</span>' +
          '<span style="font-weight:600;color:var(--purple)">' + escapeHtml(s.title) + '</span>' +
        '</div>' +
      '</td>' +
      '<td><span style="font-size:12px;color:var(--muted)">' + commentCount + '</span></td>' +
      '<td style="font-size:12.5px;color:var(--muted);white-space:nowrap">' + relTime(s.created) + '</td>' +
      '<td style="text-align:right;white-space:nowrap" onclick="event.stopPropagation()">' +
        '<button class="db-icon-btn" onclick="editScriptItem(' + i + ')" title="Edit">✎</button>' +
        '<button class="db-icon-btn" onclick="deleteScriptItem(' + i + ')" title="Delete" style="color:var(--red);margin-left:4px">🗑</button>' +
      '</td>' +
    '</tr>';
  }
  html += '</tbody></table></div>';
  detail.innerHTML = html;
}

function renderScriptItemView() {
  var aIdx = currentScriptApp, iIdx = currentScriptItem;
  if (aIdx === null || iIdx === null || !scriptApps[aIdx] || !scriptApps[aIdx].scripts || !scriptApps[aIdx].scripts[iIdx]) { backToScriptItems(); return; }
  var app = scriptApps[aIdx];
  var s = scriptApps[aIdx].scripts[iIdx];

  document.getElementById('scriptAppsGrid').style.display = 'none';
  document.getElementById('scriptAppsEmpty').style.display = 'none';
  document.getElementById('scriptItemsEmpty').style.display = 'none';
  document.getElementById('scriptBackBtn').style.display = '';
  document.getElementById('scriptBackBtn').textContent = '← Back to ' + app.name;
  document.getElementById('scriptBackBtn').onclick = backToScriptItems;
  document.getElementById('scriptAddItemBtn').style.display = 'none';
  document.getElementById('scriptAddAppBtn').style.display = 'none';

  document.getElementById('scriptHeaderTitle').innerHTML =
    '<span style="font-size:13px;font-weight:500;color:var(--muted)">Script · ' + escapeHtml(app.name) + ' · </span>' +
    '<span>' + escapeHtml(s.title) + '</span>';
  document.getElementById('scriptHeaderSub').textContent = 'Added ' + relTime(s.created);

  var detail = document.getElementById('scriptDetail');
  detail.style.display = '';
  var comments = s.comments || [];
  var commentsHtml = '';
  for (var c = 0; c < comments.length; c++) {
    var cm = comments[c];
    commentsHtml +=
      '<div style="display:flex;gap:10px;padding:12px 0;border-top:1px solid var(--border)">' +
        '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--blue));display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;flex-shrink:0">' + escapeHtml((cm.author || 'A').slice(0,2).toUpperCase()) + '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">' +
            '<div style="font-size:13px;font-weight:600;color:var(--text)">' + escapeHtml(cm.author || 'Admin') + '</div>' +
            '<div style="font-size:11px;color:var(--faint)">' + relTime(cm.date) + '</div>' +
          '</div>' +
          '<div style="font-size:13px;color:var(--text);margin-top:3px;line-height:1.5;white-space:pre-wrap">' + escapeHtml(cm.text) + '</div>' +
        '</div>' +
        '<button class="db-icon-btn" onclick="deleteScriptComment(' + c + ')" title="Delete comment" style="color:var(--red);width:24px;height:24px;font-size:11px">🗑</button>' +
      '</div>';
  }

  // Backward-compat: append legacy image field if present and not already in body
  var legacyImg = (s.image && (s.body || '').indexOf(s.image) === -1)
    ? '<img src="' + escapeAttr(s.image) + '" style="max-width:100%;max-height:400px;border-radius:8px;margin-top:14px;border:1px solid var(--border);cursor:zoom-in" onclick="openImageView(\'' + escapeJs(s.image) + '\')">'
    : '';

  detail.innerHTML =
    '<div class="card" style="padding:24px 28px">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px">' +
        '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">' +
            '<span style="font-size:24px">📜</span>' +
            '<div style="font-size:22px;font-weight:800;color:var(--text);letter-spacing:-.4px">' + escapeHtml(s.title) + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-shrink:0">' +
          '<button class="btn-secondary" onclick="editScriptItem(' + iIdx + ')" style="padding:7px 12px;font-size:12.5px">✎ Edit</button>' +
          '<button class="btn-secondary" onclick="deleteScriptItem(' + iIdx + ')" style="padding:7px 12px;font-size:12.5px;color:var(--red);border-color:var(--red)">🗑 Delete</button>' +
        '</div>' +
      '</div>' +
      '<div class="rich-rendered" style="font-size:14px;color:var(--text);line-height:1.7">' + (s.body || '') + '</div>' +
      legacyImg +
      '<div style="margin-top:24px;border-top:1px solid var(--border);padding-top:18px">' +
        '<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:8px">Comments (' + comments.length + ')</div>' +
        commentsHtml +
        '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">' +
          '<input id="scriptCommentInput" class="form-input" type="text" placeholder="Add a comment as Admin..." style="flex:1;min-width:200px" onkeydown="if(event.key===\'Enter\')addScriptComment()">' +
          '<button class="new-btn" onclick="addScriptComment()" style="padding:9px 16px;font-size:12.5px">Post</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  // Bind images in rendered body to open in new tab on click
  bindRenderedImages(detail);
}

function openScriptApp(idx) { currentScriptApp = idx; currentScriptItem = null; renderScriptPage(); }
function openScriptItem(idx) { currentScriptItem = idx; renderScriptPage(); }
function backToScriptItems() { currentScriptItem = null; renderScriptPage(); }
function backToScriptApps() { currentScriptApp = null; currentScriptItem = null; renderScriptPage(); }

// ── KB page ──
function renderKbPage() {
  if (currentKbItem !== null) { renderKbItemView(); return; }
  if (currentKbApp !== null) { renderKbDetail(); return; }
  var grid = document.getElementById('kbAppsGrid');
  var empty = document.getElementById('kbAppsEmpty');
  document.getElementById('kbDetail').style.display = 'none';
  document.getElementById('kbItemsEmpty').style.display = 'none';
  document.getElementById('kbBackBtn').style.display = 'none';
  document.getElementById('kbAddItemBtn').style.display = 'none';
  document.getElementById('kbAddAppBtn').style.display = '';
  document.getElementById('kbHeaderTitle').textContent = 'Knowledge Base';
  document.getElementById('kbHeaderSub').textContent = 'Articles, guides, and images grouped by application';

  if (kbApps.length === 0) {
    grid.style.display = 'none';
    grid.innerHTML = '';
    empty.style.display = '';
    return;
  }
  grid.style.display = '';
  grid.style.gridTemplateColumns = 'unset';
  empty.style.display = 'none';
  grid.innerHTML = buildAppsTable(kbApps, 'kb');
}

function renderKbDetail() {
  var idx = currentKbApp;
  if (idx === null || !kbApps[idx]) { backToKbApps(); return; }
  var app = kbApps[idx];
  document.getElementById('kbAppsGrid').style.display = 'none';
  document.getElementById('kbAppsEmpty').style.display = 'none';
  document.getElementById('kbBackBtn').style.display = '';
  document.getElementById('kbBackBtn').textContent = '← Back to applications';
  document.getElementById('kbBackBtn').onclick = backToKbApps;
  document.getElementById('kbAddItemBtn').style.display = '';
  document.getElementById('kbAddAppBtn').style.display = 'none';
  document.getElementById('kbHeaderTitle').innerHTML =
    '<span style="font-size:13px;font-weight:500;color:var(--muted)">Knowledge Base · </span>' +
    '<span style="display:inline-flex;align-items:center;gap:8px">' + escapeHtml(app.name) + '<span style="font-size:22px">' + escapeHtml(app.icon || '📁') + '</span></span>';
  document.getElementById('kbHeaderSub').textContent = (app.articles || []).length + ' articles';

  var detail = document.getElementById('kbDetail');
  var empty = document.getElementById('kbItemsEmpty');
  if (!app.articles || app.articles.length === 0) {
    detail.style.display = 'none';
    empty.style.display = '';
    return;
  }
  detail.style.display = '';
  empty.style.display = 'none';

  var html = '<div class="card" style="overflow:hidden">' +
    '<table class="ticket-table">' +
      '<thead><tr>' +
        '<th>Title</th>' +
        '<th>Comments</th>' +
        '<th>Updated</th>' +
        '<th style="text-align:right">Actions</th>' +
      '</tr></thead>' +
      '<tbody>';
  for (var i = 0; i < app.articles.length; i++) {
    var a = app.articles[i];
    var commentCount = (a.comments || []).length;
    html += '<tr style="cursor:pointer" onclick="openKbItem(' + i + ')">' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<span style="font-size:15px">📄</span>' +
          '<span style="font-weight:600;color:var(--purple)">' + escapeHtml(a.title) + '</span>' +
        '</div>' +
      '</td>' +
      '<td><span style="font-size:12px;color:var(--muted)">' + commentCount + '</span></td>' +
      '<td style="font-size:12.5px;color:var(--muted);white-space:nowrap">' + relTime(a.created) + '</td>' +
      '<td style="text-align:right;white-space:nowrap" onclick="event.stopPropagation()">' +
        '<button class="db-icon-btn" onclick="editArticle(' + i + ')" title="Edit">✎</button>' +
        '<button class="db-icon-btn" onclick="deleteArticle(' + i + ')" title="Delete" style="color:var(--red);margin-left:4px">🗑</button>' +
      '</td>' +
    '</tr>';
  }
  html += '</tbody></table></div>';
  detail.innerHTML = html;
}

function renderKbItemView() {
  var aIdx = currentKbApp, iIdx = currentKbItem;
  if (aIdx === null || iIdx === null || !kbApps[aIdx] || !kbApps[aIdx].articles || !kbApps[aIdx].articles[iIdx]) { backToKbItems(); return; }
  var app = kbApps[aIdx];
  var a = kbApps[aIdx].articles[iIdx];

  document.getElementById('kbAppsGrid').style.display = 'none';
  document.getElementById('kbAppsEmpty').style.display = 'none';
  document.getElementById('kbItemsEmpty').style.display = 'none';
  document.getElementById('kbBackBtn').style.display = '';
  document.getElementById('kbBackBtn').textContent = '← Back to ' + app.name;
  document.getElementById('kbBackBtn').onclick = backToKbItems;
  document.getElementById('kbAddItemBtn').style.display = 'none';
  document.getElementById('kbAddAppBtn').style.display = 'none';

  document.getElementById('kbHeaderTitle').innerHTML =
    '<span style="font-size:13px;font-weight:500;color:var(--muted)">Knowledge Base · ' + escapeHtml(app.name) + ' · </span>' +
    '<span>' + escapeHtml(a.title) + '</span>';
  document.getElementById('kbHeaderSub').textContent = 'Added ' + relTime(a.created);

  var detail = document.getElementById('kbDetail');
  detail.style.display = '';
  var comments = a.comments || [];
  var commentsHtml = '';
  for (var c = 0; c < comments.length; c++) {
    var cm = comments[c];
    commentsHtml +=
      '<div style="display:flex;gap:10px;padding:12px 0;border-top:1px solid var(--border)">' +
        '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--blue));display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;flex-shrink:0">' + escapeHtml((cm.author || 'A').slice(0,2).toUpperCase()) + '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">' +
            '<div style="font-size:13px;font-weight:600;color:var(--text)">' + escapeHtml(cm.author || 'Admin') + '</div>' +
            '<div style="font-size:11px;color:var(--faint)">' + relTime(cm.date) + '</div>' +
          '</div>' +
          '<div style="font-size:13px;color:var(--text);margin-top:3px;line-height:1.5;white-space:pre-wrap">' + escapeHtml(cm.text) + '</div>' +
        '</div>' +
        '<button class="db-icon-btn" onclick="deleteComment(' + iIdx + ',' + c + ')" title="Delete comment" style="color:var(--red);width:24px;height:24px;font-size:11px">🗑</button>' +
      '</div>';
  }

  // Backward-compat: append legacy image field if present and not already in body
  var legacyImg = (a.image && (a.body || '').indexOf(a.image) === -1)
    ? '<img src="' + escapeAttr(a.image) + '" style="max-width:100%;max-height:480px;border-radius:8px;margin-top:14px;border:1px solid var(--border);cursor:zoom-in" onclick="openImageView(\'' + escapeJs(a.image) + '\')">'
    : '';

  detail.innerHTML =
    '<div class="card" style="padding:24px 28px">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px">' +
        '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">' +
            '<span style="font-size:24px">📄</span>' +
            '<div style="font-size:22px;font-weight:800;color:var(--text);letter-spacing:-.4px">' + escapeHtml(a.title) + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-shrink:0">' +
          '<button class="btn-secondary" onclick="editArticle(' + iIdx + ')" style="padding:7px 12px;font-size:12.5px">✎ Edit</button>' +
          '<button class="btn-secondary" onclick="deleteArticle(' + iIdx + ')" style="padding:7px 12px;font-size:12.5px;color:var(--red);border-color:var(--red)">🗑 Delete</button>' +
        '</div>' +
      '</div>' +
      '<div class="rich-rendered" style="font-size:14px;color:var(--text);line-height:1.7">' + (a.body || '') + '</div>' +
      legacyImg +
      '<div style="margin-top:24px;border-top:1px solid var(--border);padding-top:18px">' +
        '<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:8px">Comments (' + comments.length + ')</div>' +
        commentsHtml +
        '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">' +
          '<input id="kbCommentInput" class="form-input" type="text" placeholder="Add a comment as Admin..." style="flex:1;min-width:200px" onkeydown="if(event.key===\'Enter\')addComment(' + iIdx + ')">' +
          '<button class="new-btn" onclick="addComment(' + iIdx + ')" style="padding:9px 16px;font-size:12.5px">Post</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  bindRenderedImages(detail);
}

function openKbApp(idx) { currentKbApp = idx; currentKbItem = null; renderKbPage(); }
function openKbItem(idx) { currentKbItem = idx; renderKbPage(); }
function backToKbItems() { currentKbItem = null; renderKbPage(); }
function backToKbApps() { currentKbApp = null; currentKbItem = null; renderKbPage(); }

// ── Weekly stats & modal ──
function getWeekStart() {
  var now = new Date();
  var day = now.getDay(); // 0=Sun .. 6=Sat
  var diff = (day === 0 ? -6 : 1 - day); // Monday is start
  var monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function isThisWeek(iso) {
  if (!iso) return false;
  var d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  return d.getTime() >= getWeekStart().getTime();
}

function getKnowledgeHubStats() {
  var totalA = 0, totalS = 0, weeklyA = 0, weeklyS = 0;
  for (var i = 0; i < kbApps.length; i++) {
    var arr = kbApps[i].articles || [];
    totalA += arr.length;
    for (var j = 0; j < arr.length; j++) if (isThisWeek(arr[j].created)) weeklyA++;
  }
  for (var i = 0; i < scriptApps.length; i++) {
    var arr = scriptApps[i].scripts || [];
    totalS += arr.length;
    for (var j = 0; j < arr.length; j++) if (isThisWeek(arr[j].created)) weeklyS++;
  }
  return {
    total: totalA + totalS,
    weekly: weeklyA + weeklyS,
    totalArticles: totalA, totalScripts: totalS,
    weeklyArticles: weeklyA, weeklyScripts: weeklyS
  };
}

function renderHeroStats() {
  var stats = getKnowledgeHubStats();
  var totalEl = document.getElementById('heroKhTotal');
  var weeklyEl = document.getElementById('heroKhWeekly');
  if (totalEl) totalEl.textContent = stats.total;
  if (weeklyEl) {
    if (stats.weekly === 0) {
      weeklyEl.textContent = 'No new this week';
      weeklyEl.classList.remove('up');
    } else {
      weeklyEl.innerHTML = '▲ +' + stats.weekly + ' this week ↗';
      weeklyEl.classList.add('up');
    }
  }
}

function openWeeklyModal() {
  document.getElementById('weeklyModalOverlay').classList.add('open');
  renderWeeklyAdditions();
}

function closeWeeklyModal() {
  document.getElementById('weeklyModalOverlay').classList.remove('open');
}

function renderWeeklyAdditions() {
  var body = document.getElementById('weeklyModalBody');
  var sub = document.getElementById('weeklyModalSub');
  var items = [];

  for (var i = 0; i < kbApps.length; i++) {
    var arr = kbApps[i].articles || [];
    for (var j = 0; j < arr.length; j++) {
      if (isThisWeek(arr[j].created)) {
        items.push({
          type: 'kb',
          appIdx: i, itemIdx: j,
          appName: kbApps[i].name,
          appIcon: kbApps[i].icon || '📁',
          title: arr[j].title,
          created: arr[j].created
        });
      }
    }
  }
  for (var i = 0; i < scriptApps.length; i++) {
    var arr = scriptApps[i].scripts || [];
    for (var j = 0; j < arr.length; j++) {
      if (isThisWeek(arr[j].created)) {
        items.push({
          type: 'script',
          appIdx: i, itemIdx: j,
          appName: scriptApps[i].name,
          appIcon: scriptApps[i].icon || '📁',
          title: arr[j].title,
          created: arr[j].created
        });
      }
    }
  }
  items.sort(function(a, b) {
    return new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime();
  });

  var weekStart = getWeekStart();
  if (sub) sub.textContent = 'Since ' + formatDate(weekStart.toISOString()) + ' · ' + items.length + ' new ' + (items.length === 1 ? 'item' : 'items');

  if (items.length === 0) {
    body.innerHTML =
      '<div style="padding:32px 12px;text-align:center;color:var(--muted);font-size:13px">' +
        '<div style="font-size:38px;margin-bottom:10px">🗓️</div>' +
        '<div style="font-weight:600;color:var(--text);margin-bottom:4px">Nothing added this week yet</div>' +
        '<div style="font-size:12px">Bagong scripts at articles ay lalabas dito agad pag na-save sa Knowledge Hub.</div>' +
      '</div>';
    return;
  }

  var html = '<div style="display:flex;flex-direction:column;gap:6px">';
  for (var k = 0; k < items.length; k++) {
    var it = items[k];
    var typeBadge = it.type === 'kb'
      ? '<span style="background:#DBEAFE;color:#1D4ED8;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:20px;text-transform:uppercase;letter-spacing:.4px">KB</span>'
      : '<span style="background:#EDE9FF;color:var(--purple);font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:20px;text-transform:uppercase;letter-spacing:.4px">Script</span>';
    var iconChar = it.type === 'kb' ? '📄' : '📜';
    var navFn = it.type === 'kb' ? 'navigateToKbArticle' : 'navigateToScriptItem';
    html +=
      '<div onclick="closeWeeklyModal();' + navFn + '(' + it.appIdx + ',' + it.itemIdx + ')" style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border);border-radius:var(--radius-xs);cursor:pointer;transition:background .12s" onmouseenter="this.style.background=\'#F5F7FF\'" onmouseleave="this.style.background=\'\'">' +
        '<div style="width:36px;height:36px;border-radius:8px;background:#EDE9FF;color:var(--purple);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">' + escapeHtml(it.appIcon) + '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">' +
            typeBadge +
            '<span style="font-size:11.5px;color:var(--muted)">' + escapeHtml(it.appName) + '</span>' +
          '</div>' +
          '<div style="font-size:13.5px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + iconChar + ' ' + escapeHtml(it.title) + '</div>' +
        '</div>' +
        '<div style="font-size:11.5px;color:var(--faint);white-space:nowrap;flex-shrink:0">' + relTime(it.created) + '</div>' +
      '</div>';
  }
  html += '</div>';
  body.innerHTML = html;
}

// ── Dashboard ↔ Knowledge Hub wiring ──
// ── Global search ──
var GLOBAL_NAV_ITEMS = [
  { title: 'Dashboard',           sub: 'Overview',          icon: '📊', go: function(){ navigateToDashboard(); } },
  { title: 'Turnover',            sub: 'Pending and Closed',icon: '🔁', go: function(){ navigateToTurnoverPending(); } },
  { title: 'Pending Turnover',    sub: 'Active concerns',   icon: '⏳', go: function(){ navigateToTurnoverPending(); } },
  { title: 'Closed Turnover',     sub: 'Archive',           icon: '✅', go: function(){ navigateToTurnoverResolved(); } },
  { title: 'Knowledge Hub',       sub: 'Knowledge area',    icon: '📚', go: function(){ navigateToKbHub(); } },
  { title: 'Script',              sub: 'Reusable scripts',  icon: '📜', go: function(){ navigateToScriptHub(); } },
  { title: 'Knowledge Base',      sub: 'Articles & guides', icon: '📚', go: function(){ navigateToKbHub(); } },
  { title: 'Two Factor Authentication', sub: 'Access',      icon: '🔐', go: function(){ navigateToSimplePage('2fa'); } },
  { title: 'Database Credentials',sub: 'Vault',             icon: '🗄️', go: function(){ navigateToSimplePage('dbcreds'); } },
  { title: 'Access Credentials',  sub: 'Group',             icon: '🔑', go: function(){ navigateToSimplePage('dbcreds'); } },
  { title: 'Deployment',          sub: 'Jenkins / GitLab',  icon: '🚀', go: function(){ navigateToSimplePage('deployment-jenkins'); } },
  { title: 'Jenkins',             sub: 'Pipelines',         icon: '🤖', go: function(){ navigateToSimplePage('deployment-jenkins'); } },
  { title: 'GitLab',              sub: 'Merge requests',    icon: '🦊', go: function(){ navigateToSimplePage('deployment-gitlab'); } },
  { title: 'System Applications', sub: 'Settings',          icon: '⚙️', go: function(){ showToast('⚙️ System Applications'); } },
  { title: 'Schedule',            sub: 'Calendar',          icon: '📅', go: function(){ navigateToSimplePage('schedule'); } }
];

function navigateToDashboard() {
  var navItems = document.querySelectorAll('.nav-item');
  for (var i = 0; i < navItems.length; i++) {
    navItems[i].classList.remove('active');
    if (navItems[i].getAttribute('data-tip') === 'Dashboard') navItems[i].classList.add('active');
  }
  var subMenus = document.querySelectorAll('.sub-menu');
  for (var j = 0; j < subMenus.length; j++) subMenus[j].classList.remove('open');
  navigateToSimplePage('dashboard');
}

function navigateToTurnover() {
  var navItems = document.querySelectorAll('.nav-item');
  for (var i = 0; i < navItems.length; i++) {
    navItems[i].classList.remove('active');
    if (navItems[i].getAttribute('data-tip') === 'Turnover') navItems[i].classList.add('active');
  }
  showToast('📁 Turnover (no dedicated page yet)');
}

function navigateToSimplePage(pageId) {
  var pages = document.querySelectorAll('[id^="page-"]');
  for (var i = 0; i < pages.length; i++) pages[i].style.display = 'none';
  var p = document.getElementById('page-' + pageId);
  if (p) p.style.display = 'flex';
}

function buildSearchIndex() {
  var index = [];
  for (var n = 0; n < GLOBAL_NAV_ITEMS.length; n++) {
    var nav = GLOBAL_NAV_ITEMS[n];
    index.push({ kind: 'Nav', title: nav.title, sub: nav.sub, icon: nav.icon, hay: nav.title + ' ' + (nav.sub || ''), go: nav.go });
  }
  for (var i = 0; i < kbApps.length; i++) {
    var app = kbApps[i];
    index.push({
      kind: 'KB App', title: app.name, sub: 'Knowledge Base · ' + ((app.articles || []).length + ' articles'),
      icon: app.icon || '📁', hay: app.name + ' kb knowledge base',
      go: (function(idx){ return function(){ currentKbApp = idx; currentKbItem = null; setSidebarToKnowledgeHub(); navigateToSimplePage('kb'); renderKbPage(); }; })(i)
    });
    var arts = app.articles || [];
    for (var j = 0; j < arts.length; j++) {
      var a = arts[j];
      var bodyText = (a.body || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      index.push({
        kind: 'Article', title: a.title, sub: 'KB · ' + app.name,
        icon: '📄', hay: a.title + ' ' + bodyText.slice(0, 200) + ' ' + app.name,
        go: (function(ai, ii){ return function(){ navigateToKbArticle(ai, ii); }; })(i, j)
      });
    }
  }
  for (var i = 0; i < scriptApps.length; i++) {
    var app = scriptApps[i];
    index.push({
      kind: 'Script App', title: app.name, sub: 'Script · ' + ((app.scripts || []).length + ' scripts'),
      icon: app.icon || '📁', hay: app.name + ' script',
      go: (function(idx){ return function(){ currentScriptApp = idx; currentScriptItem = null; setSidebarToScript(); navigateToSimplePage('script'); renderScriptPage(); }; })(i)
    });
    var scripts = app.scripts || [];
    for (var j = 0; j < scripts.length; j++) {
      var s = scripts[j];
      var bodyText = (s.body || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      index.push({
        kind: 'Script', title: s.title, sub: 'Script · ' + app.name,
        icon: '📜', hay: s.title + ' ' + bodyText.slice(0, 200) + ' ' + app.name,
        go: (function(ai, ii){ return function(){ navigateToScriptItem(ai, ii); }; })(i, j)
      });
    }
  }
  if (typeof dbList !== 'undefined') {
    for (var i = 0; i < dbList.length; i++) {
      var db = dbList[i];
      index.push({
        kind: 'Database', title: db.name, sub: (db.type || 'DB') + ' · ' + (db.env || '') + ' · ' + (db.host || ''),
        icon: '🗄️', hay: db.name + ' ' + (db.host || '') + ' ' + (db.type || '') + ' ' + (db.env || '') + ' ' + (db.user || ''),
        go: (function(idx){ return function(){ navigateToSimplePage('dbcreds'); openDbModal(idx); }; })(i)
      });
    }
  }
  if (typeof turnovers !== 'undefined') {
    for (var i = 0; i < turnovers.length; i++) {
      var t = turnovers[i];
      var bodyText = (t.body || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      index.push({
        kind: t.status === 'done' ? 'Closed Turnover' : 'Pending Turnover',
        title: (t.summary || '(no summary)'),
        sub: t.status === 'done' ? 'Closed' : 'Pending',
        icon: t.status === 'done' ? '✅' : '⏳',
        hay: (t.summary || '') + ' ' + bodyText.slice(0, 200),
        go: (function(id){ return function(){ openTurnoverDetail(id); }; })(t.id)
      });
    }
  }
  return index;
}

var globalSearchActiveIdx = -1;
var globalSearchResults = [];

function onGlobalSearchInput(value) {
  var dd = document.getElementById('globalSearchDropdown');
  var q = (value || '').toLowerCase().trim();
  if (!q) { dd.style.display = 'none'; dd.innerHTML = ''; globalSearchResults = []; globalSearchActiveIdx = -1; return; }
  var index = buildSearchIndex();
  var results = index.filter(function(it){ return it.hay.toLowerCase().indexOf(q) !== -1; }).slice(0, 12);
  globalSearchResults = results;
  globalSearchActiveIdx = results.length > 0 ? 0 : -1;
  renderGlobalSearchResults();
  dd.style.display = '';
}

function renderGlobalSearchResults() {
  var dd = document.getElementById('globalSearchDropdown');
  if (!dd) return;
  if (globalSearchResults.length === 0) {
    dd.innerHTML = '<div class="search-empty">No matches. Try a different keyword.</div>';
    return;
  }
  // Group by kind
  var grouped = {};
  for (var i = 0; i < globalSearchResults.length; i++) {
    var r = globalSearchResults[i];
    if (!grouped[r.kind]) grouped[r.kind] = [];
    grouped[r.kind].push({ r: r, idx: i });
  }
  var order = ['Nav', 'KB App', 'Article', 'Script App', 'Script', 'Database'];
  var html = '';
  for (var k = 0; k < order.length; k++) {
    var kind = order[k];
    if (!grouped[kind]) continue;
    html += '<div class="search-section-label">' + escapeHtml(kind) + '</div>';
    for (var x = 0; x < grouped[kind].length; x++) {
      var it = grouped[kind][x].r;
      var idx = grouped[kind][x].idx;
      var active = idx === globalSearchActiveIdx ? ' active' : '';
      html += '<div class="search-result' + active + '" data-idx="' + idx + '" onmousedown="event.preventDefault();selectGlobalSearchResult(' + idx + ')">' +
        '<div class="search-result-icon">' + escapeHtml(it.icon || '•') + '</div>' +
        '<div class="search-result-body">' +
          '<div class="search-result-title">' + escapeHtml(it.title) + '</div>' +
          '<div class="search-result-sub">' + escapeHtml(it.sub || '') + '</div>' +
        '</div>' +
        '<span class="search-result-type">' + escapeHtml(it.kind) + '</span>' +
      '</div>';
    }
  }
  dd.innerHTML = html;
}

function selectGlobalSearchResult(idx) {
  var r = globalSearchResults[idx];
  if (!r) return;
  closeGlobalSearchDropdown();
  document.getElementById('globalSearchInput').value = '';
  try { r.go(); } catch (e) { console.error(e); showToast('⚠️ Navigation failed'); }
}

function onGlobalSearchFocus() {
  var input = document.getElementById('globalSearchInput');
  if (input.value.trim()) onGlobalSearchInput(input.value);
}

function closeGlobalSearchDropdown() {
  var dd = document.getElementById('globalSearchDropdown');
  if (dd) { dd.style.display = 'none'; dd.innerHTML = ''; }
  globalSearchResults = [];
  globalSearchActiveIdx = -1;
}

function onGlobalSearchKeydown(e) {
  if (!globalSearchResults.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    globalSearchActiveIdx = (globalSearchActiveIdx + 1) % globalSearchResults.length;
    renderGlobalSearchResults();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    globalSearchActiveIdx = (globalSearchActiveIdx - 1 + globalSearchResults.length) % globalSearchResults.length;
    renderGlobalSearchResults();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (globalSearchActiveIdx >= 0) selectGlobalSearchResult(globalSearchActiveIdx);
  } else if (e.key === 'Escape') {
    closeGlobalSearchDropdown();
    document.getElementById('globalSearchInput').blur();
  }
}

document.addEventListener('click', function(e) {
  var wrap = document.querySelector('.search-wrap');
  if (wrap && !wrap.contains(e.target)) closeGlobalSearchDropdown();
});

function setSidebarToKnowledgeHub() {
  // Highlight Knowledge Hub nav-item, expand its sub-menu, and mark KB sub-item active
  var navItems = document.querySelectorAll('.nav-item');
  for (var i = 0; i < navItems.length; i++) {
    navItems[i].classList.remove('active');
    if (navItems[i].getAttribute('data-tip') === 'Knowledge Hub') navItems[i].classList.add('active');
  }
  var subMenus = document.querySelectorAll('.sub-menu');
  for (var j = 0; j < subMenus.length; j++) subMenus[j].classList.remove('open');
  var subKb = document.getElementById('sub-kb');
  if (subKb) subKb.classList.add('open');
  var subItems = document.querySelectorAll('.sub-item');
  for (var k = 0; k < subItems.length; k++) {
    subItems[k].classList.remove('active');
    var lbl = subItems[k].querySelector('.nav-label');
    if (lbl && lbl.textContent === 'Knowledge Base') subItems[k].classList.add('active');
  }
}

function navigateToKbHub() {
  setSidebarToKnowledgeHub();
  navigateToSimplePage('kb');
  currentKbApp = null;
  currentKbItem = null;
  if (typeof renderKbPage === 'function') renderKbPage();
}

function navigateToScriptHub() {
  setSidebarToScript();
  navigateToSimplePage('script');
  currentScriptApp = null;
  currentScriptItem = null;
  if (typeof renderScriptPage === 'function') renderScriptPage();
}

function navigateToKbArticle(appIdx, articleIdx) {
  if (!kbApps[appIdx] || !kbApps[appIdx].articles || !kbApps[appIdx].articles[articleIdx]) {
    showToast('⚠️ Article not found');
    return;
  }
  setSidebarToKnowledgeHub();
  navigateToSimplePage('kb');
  currentKbApp = appIdx;
  currentKbItem = articleIdx;
  if (typeof renderKbPage === 'function') renderKbPage();
}

function setSidebarToScript() {
  var navItems = document.querySelectorAll('.nav-item');
  for (var i = 0; i < navItems.length; i++) {
    navItems[i].classList.remove('active');
    if (navItems[i].getAttribute('data-tip') === 'Knowledge Hub') navItems[i].classList.add('active');
  }
  var subMenus = document.querySelectorAll('.sub-menu');
  for (var j = 0; j < subMenus.length; j++) subMenus[j].classList.remove('open');
  var subKb = document.getElementById('sub-kb');
  if (subKb) subKb.classList.add('open');
  var subItems = document.querySelectorAll('.sub-item');
  for (var k = 0; k < subItems.length; k++) {
    subItems[k].classList.remove('active');
    var lbl = subItems[k].querySelector('.nav-label');
    if (lbl && lbl.textContent === 'Script') subItems[k].classList.add('active');
  }
}

function navigateToScriptItem(appIdx, scriptIdx) {
  if (!scriptApps[appIdx] || !scriptApps[appIdx].scripts || !scriptApps[appIdx].scripts[scriptIdx]) {
    showToast('⚠️ Script not found');
    return;
  }
  setSidebarToScript();
  navigateToSimplePage('script');
  currentScriptApp = appIdx;
  currentScriptItem = scriptIdx;
  if (typeof renderScriptPage === 'function') renderScriptPage();
}

var dashboardExpandedCard = null; // 'sprint' | 'kb' | 'team' | null

function toggleDashboardCard(which) {
  dashboardExpandedCard = (dashboardExpandedCard === which) ? null : which;
  applyDashboardExpand();
}

function applyDashboardExpand() {
  var sprint = document.getElementById('sprintCard');
  var kb = document.getElementById('dashboardKbCard');
  var team = document.getElementById('teamActivityCard');
  if (dashboardExpandedCard === null) {
    if (sprint) sprint.style.display = '';
    if (kb) kb.style.display = '';
    if (team) team.style.display = '';
  } else {
    if (sprint) sprint.style.display = (dashboardExpandedCard === 'sprint') ? '' : 'none';
    if (kb) kb.style.display = (dashboardExpandedCard === 'kb') ? '' : 'none';
    if (team) team.style.display = (dashboardExpandedCard === 'team') ? '' : 'none';
  }
  renderSprintCard();
  renderDashboardKb();
  renderTeamCard();
}

// Backward compat (older inline calls)
function toggleKbExpand() { toggleDashboardCard('kb'); }

var SPRINT_TASKS = [
  { id: 'TK-0142', title: 'Unlock MPC Account — Branch 05', assignee: 'Rex S.', status: 'pending' },
  { id: 'TK-0141', title: 'Disable LOS Access — Resigned Staff', assignee: 'Rex S.', status: 'done' },
  { id: 'TK-0140', title: '2FA Setup — New User Onboarding', assignee: 'Jay D.', status: 'progress' },
  { id: 'TK-0139', title: 'MOB Access Creation — Cashier', assignee: 'Marie A.', status: 'fyi' },
  { id: 'TK-0138', title: 'DB Credentials Reset — Dev Team', assignee: 'Jay D.', status: 'escalated' },
  { id: 'TK-0137', title: 'Branch 12 LOS sync error', assignee: 'Rex S.', status: 'done' },
  { id: 'TK-0136', title: 'EMPC password expiry batch', assignee: 'Marie A.', status: 'done' },
  { id: 'TK-0135', title: 'MOB token refresh — Branch 03', assignee: 'Jay D.', status: 'progress' },
  { id: 'TK-0134', title: 'KB cleanup — outdated articles', assignee: 'Rex S.', status: 'todo' },
  { id: 'TK-0133', title: 'Quarterly access audit', assignee: 'Marie A.', status: 'todo' },
  { id: 'TK-0132', title: 'Migrate dev DB credentials vault', assignee: 'Jay D.', status: 'todo' }
];

var STATUS_BADGES = {
  pending:   { label: 'Pending',     bg: '#FEF3C7', fg: '#B45309' },
  progress:  { label: 'In Progress', bg: '#DBEAFE', fg: '#1D4ED8' },
  done:      { label: 'Done',        bg: '#DCFCE7', fg: '#15803D' },
  fyi:       { label: 'FYI',         bg: '#F3E8FF', fg: '#7C3AED' },
  escalated: { label: 'Escalated',   bg: '#FEE2E2', fg: '#DC2626' },
  todo:      { label: 'To Do',       bg: '#F3F4F8', fg: '#64748B' }
};

function renderSprintCard() {
  var body = document.getElementById('sprintBody');
  var action = document.getElementById('sprintAction');
  if (!body) return;
  var expanded = dashboardExpandedCard === 'sprint';
  if (action) action.innerHTML = expanded ? 'Show less ↑' : 'View board ↗';

  var html =
    '<div class="sprint-body">' +
      '<div style="font-size:12.5px;font-weight:600;color:var(--muted);margin-bottom:8px">Sprint 12 · 21 total items</div>' +
      '<div class="sprint-progress-wrap">' +
        '<div class="sprint-bar-bg">' +
          '<div class="sprint-seg" style="width:66.7%;background:var(--purple)"></div>' +
          '<div class="sprint-seg" style="width:19%;background:var(--blue)"></div>' +
          '<div class="sprint-seg" style="width:14.3%;background:var(--accent)"></div>' +
        '</div>' +
      '</div>' +
      '<div class="sprint-legend">' +
        '<div class="legend-item"><span class="legend-dot" style="background:var(--purple)"></span>Completed (14)</div>' +
        '<div class="legend-item"><span class="legend-dot" style="background:var(--blue)"></span>In Progress (4)</div>' +
        '<div class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>To Do (3)</div>' +
      '</div>' +
    '</div>';

  if (expanded) {
    html += '<div style="border-top:1px solid var(--border);padding:12px 22px 18px">' +
      '<div style="font-size:12.5px;font-weight:700;color:var(--text);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Sprint Items</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;max-height:480px;overflow-y:auto">';
    for (var i = 0; i < SPRINT_TASKS.length; i++) {
      var t = SPRINT_TASKS[i];
      var b = STATUS_BADGES[t.status] || STATUS_BADGES.todo;
      html +=
        '<div style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--border);border-radius:var(--radius-xs);background:var(--bg)">' +
          '<span style="font-family:Courier New,monospace;font-size:11.5px;color:var(--muted);min-width:60px">' + escapeHtml(t.id) + '</span>' +
          '<span style="flex:1;min-width:0;font-size:13px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(t.title) + '</span>' +
          '<span style="font-size:11.5px;color:var(--muted);white-space:nowrap">' + escapeHtml(t.assignee) + '</span>' +
          '<span class="ticket-badge" style="background:' + b.bg + ';color:' + b.fg + '">' + escapeHtml(b.label) + '</span>' +
        '</div>';
    }
    html += '</div></div>';
  }

  body.innerHTML = html;
}

var TEAM_ACTIVITY_FEED = [
  { who: 'Rex S.',   from: '#6B4EFF', to: '#3B9EFF', desc: 'Resolved TK-0141 — LOS Access',           when: '8 mins ago' },
  { who: 'Jay D.',   from: '#F59E0B', to: '#EF4444', desc: 'Escalated TK-0138 — DB Credentials',      when: '42 mins ago' },
  { who: 'Marie A.', from: '#22C55E', to: '#3B9EFF', desc: 'Added KB article — MOB Access',           when: '2 hrs ago' },
  { who: 'Rex S.',   from: '#6B4EFF', to: '#3B9EFF', desc: 'Closed TK-0136 — EMPC password expiry',    when: '4 hrs ago' },
  { who: 'Marie A.', from: '#22C55E', to: '#3B9EFF', desc: 'Updated KB — Unlock MPC steps v2',         when: 'Yesterday' },
  { who: 'Jay D.',   from: '#F59E0B', to: '#EF4444', desc: 'Reassigned TK-0135 to Jay D.',            when: 'Yesterday' },
  { who: 'Rex S.',   from: '#6B4EFF', to: '#3B9EFF', desc: 'Logged merge !142 to UAT',                 when: '2 days ago' },
  { who: 'Marie A.', from: '#22C55E', to: '#3B9EFF', desc: 'Added Script — Token refresh batch job',   when: '2 days ago' },
  { who: 'Jay D.',   from: '#F59E0B', to: '#EF4444', desc: 'Approved DB credentials change request',  when: '3 days ago' },
  { who: 'Rex S.',   from: '#6B4EFF', to: '#3B9EFF', desc: 'Closed TK-0130 — KB cleanup batch',        when: '4 days ago' }
];

function renderTeamCard() {
  var list = document.getElementById('teamActivityList');
  var action = document.getElementById('teamAction');
  if (!list) return;
  var expanded = dashboardExpandedCard === 'team';
  if (action) action.innerHTML = expanded ? 'Show less ↑' : 'View all ↗';

  var items = expanded ? TEAM_ACTIVITY_FEED : TEAM_ACTIVITY_FEED.slice(0, 3);
  var html = '';
  for (var i = 0; i < items.length; i++) {
    var a = items[i];
    var initials = (a.who || '?').split(/\s+/).map(function(p){ return p[0] || ''; }).join('').slice(0,2).toUpperCase();
    html +=
      '<div class="activity-item">' +
        '<div class="activity-av" style="background:linear-gradient(135deg,' + a.from + ',' + a.to + ')">' + escapeHtml(initials) + '</div>' +
        '<div class="activity-body">' +
          '<div class="activity-name">' + escapeHtml(a.who) + '</div>' +
          '<div class="activity-desc">' + escapeHtml(a.desc) + '</div>' +
          '<div class="activity-time">' + escapeHtml(a.when) + '</div>' +
        '</div>' +
      '</div>';
  }
  list.innerHTML = html;
  if (expanded) {
    list.style.maxHeight = '560px';
    list.style.overflowY = 'auto';
  } else {
    list.style.maxHeight = '';
    list.style.overflowY = '';
  }
}

function renderDashboardKb() {
  var list = document.getElementById('dashboardKbList');
  var sub = document.getElementById('dashboardKbSub');
  var actionBtn = document.getElementById('dashboardKbAction');
  if (!list) return;

  var total = scriptApps.length;

  if (sub) sub.textContent = total === 0 ? 'No applications yet' : ((dashboardExpandedCard === 'kb') ? 'All applications · ' + total + ' total' : total + ' application' + (total !== 1 ? 's' : '') + ' total');

  if (actionBtn) actionBtn.innerHTML = (dashboardExpandedCard === 'kb') ? 'Show less ↑' : 'View all ↗';

  if (total === 0) {
    list.innerHTML = '<div style="padding:24px 16px;text-align:center;color:var(--muted);font-size:13px">No scripts yet. <a style="color:var(--purple);cursor:pointer;font-weight:600" onclick="navigateToScriptHub()">Open Scripts</a></div>';
    list.style.maxHeight = '';
    list.style.overflowY = '';
    return;
  }

  var palette = [
    ['#EDE9FF','var(--purple)'],
    ['#DBEAFE','var(--blue)'],
    ['#DCFCE7','var(--green-dim)'],
    ['#FEF3C7','#B45309'],
    ['#FFE4E6','#BE123C']
  ];

  var displayApps = (dashboardExpandedCard === 'kb') ? scriptApps : scriptApps.slice(0, 5);
  var html = '';
  for (var k = 0; k < displayApps.length; k++) {
    var app = displayApps[k];
    var c = palette[k % palette.length];
    var scriptCount = (app.scripts || []).length;
    html += '<div class="kb-item" onclick="currentScriptApp=' + k + ';currentScriptItem=null;setSidebarToScript();navigateToSimplePage(\'script\');renderScriptPage();">' +
      '<div class="kb-icon" style="background:' + c[0] + ';color:' + c[1] + '">' + escapeHtml(app.icon || '📁') + '</div>' +
      '<div class="kb-info">' +
        '<div class="kb-name">' + escapeHtml(app.name) + '</div>' +
        '<div class="kb-cat">' + scriptCount + ' script' + (scriptCount !== 1 ? 's' : '') + '</div>' +
      '</div>' +
      '<span class="kb-arrow">↗</span>' +
    '</div>';
  }
  list.innerHTML = html;
  if (dashboardExpandedCard === 'kb') {
    list.style.maxHeight = '560px';
    list.style.overflowY = 'auto';
  } else {
    list.style.maxHeight = '';
    list.style.overflowY = '';
  }
}

function renderDashboardScripts() {
  var list = document.getElementById('dashboardScriptList');
  var sub = document.getElementById('dashboardScriptSub');
  if (!list) return;

  var allItems = [];
  var total = 0;
  for (var i = 0; i < scriptApps.length; i++) {
    var app = scriptApps[i];
    var arr = app.scripts || [];
    total += arr.length;
    for (var j = 0; j < arr.length; j++) {
      allItems.push({
        appIdx: i, itemIdx: j,
        appName: app.name,
        appIcon: app.icon || '📁',
        title: arr[j].title,
        created: arr[j].created
      });
    }
  }

  if (sub) sub.textContent = total === 0 ? 'No scripts yet' : 'Recent scripts · ' + total + ' total';

  if (allItems.length === 0) {
    list.innerHTML = '<div style="padding:24px 16px;text-align:center;color:var(--muted);font-size:13px">No scripts yet. <a style="color:var(--purple);cursor:pointer;font-weight:600" onclick="navigateToScriptHub()">Open Script Hub</a></div>';
    return;
  }

  allItems.sort(function(a, b){ return new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime(); });
  var top = allItems.slice(0, 4);
  var palette = [
    ['#EDE9FF','var(--purple)'],
    ['#DBEAFE','var(--blue)'],
    ['#DCFCE7','var(--green-dim)'],
    ['#FEF3C7','#B45309']
  ];
  var html = '';
  for (var k = 0; k < top.length; k++) {
    var it = top[k];
    var c = palette[k % palette.length];
    html += '<div class="kb-item" onclick="navigateToScriptItem(' + it.appIdx + ',' + it.itemIdx + ')">' +
      '<div class="kb-icon" style="background:' + c[0] + ';color:' + c[1] + '">' + escapeHtml(it.appIcon) + '</div>' +
      '<div class="kb-info">' +
        '<div class="kb-name">' + escapeHtml(it.title) + '</div>' +
        '<div class="kb-cat">' + escapeHtml(it.appName) + ' · ' + relTime(it.created) + '</div>' +
      '</div>' +
      '<span class="kb-arrow">↗</span>' +
    '</div>';
  }
  list.innerHTML = html;
}

function renderRecentActivity() {
  var wrap = document.getElementById('recentActivityWrap');
  var sub = document.getElementById('recentActivitySub');
  if (!wrap) return;

  var items = [];
  for (var i = 0; i < kbApps.length; i++) {
    var arr = kbApps[i].articles || [];
    for (var j = 0; j < arr.length; j++) {
      items.push({ type: 'kb', appIdx: i, itemIdx: j, appName: kbApps[i].name, appIcon: kbApps[i].icon || '📁', title: arr[j].title, created: arr[j].created });
    }
  }
  for (var i = 0; i < scriptApps.length; i++) {
    var arr = scriptApps[i].scripts || [];
    for (var j = 0; j < arr.length; j++) {
      items.push({ type: 'script', appIdx: i, itemIdx: j, appName: scriptApps[i].name, appIcon: scriptApps[i].icon || '📁', title: arr[j].title, created: arr[j].created });
    }
  }
  items.sort(function(a, b){ return new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime(); });
  var weeklyCount = items.filter(function(x){ return isThisWeek(x.created); }).length;

  if (sub) {
    sub.textContent = items.length === 0
      ? 'Mga bago mong articles at scripts ay lalabas dito'
      : weeklyCount + ' added this week · ' + items.length + ' total';
  }

  if (items.length === 0) {
    wrap.innerHTML =
      '<div style="padding:48px 22px;text-align:center;color:var(--muted);font-size:13px">' +
        '<div style="font-size:38px;margin-bottom:10px">🗒️</div>' +
        '<div style="font-weight:600;color:var(--text);margin-bottom:4px">No activity yet</div>' +
        '<div style="font-size:12px;margin-bottom:14px">Add a Knowledge Base article or Script para magsimula.</div>' +
        '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">' +
          '<button class="new-btn" onclick="navigateToKbHub()" style="padding:8px 14px;font-size:12.5px">📚 Open Knowledge Base</button>' +
          '<button class="btn-secondary" onclick="navigateToScriptHub()" style="padding:8px 14px;font-size:12.5px">📜 Open Scripts</button>' +
        '</div>' +
      '</div>';
    return;
  }

  // Show up to 8 most recent
  var top = items.slice(0, 8);
  var html = '<table class="ticket-table"><thead><tr>' +
    '<th>Type</th>' +
    '<th>Title</th>' +
    '<th>Application</th>' +
    '<th>Added</th>' +
  '</tr></thead><tbody>';
  for (var k = 0; k < top.length; k++) {
    var it = top[k];
    var typeBadge = it.type === 'kb'
      ? '<span style="background:#DBEAFE;color:#1D4ED8;font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:20px;text-transform:uppercase;letter-spacing:.4px">KB</span>'
      : '<span style="background:#EDE9FF;color:var(--purple);font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:20px;text-transform:uppercase;letter-spacing:.4px">Script</span>';
    var iconChar = it.type === 'kb' ? '📄' : '📜';
    var navFn = it.type === 'kb' ? 'navigateToKbArticle' : 'navigateToScriptItem';
    var weekTag = isThisWeek(it.created)
      ? '<span style="background:#DCFCE7;color:var(--green-dim);font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;margin-left:6px">NEW</span>'
      : '';
    html += '<tr style="cursor:pointer" onclick="' + navFn + '(' + it.appIdx + ',' + it.itemIdx + ')">' +
      '<td>' + typeBadge + '</td>' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<span style="font-size:14px">' + iconChar + '</span>' +
          '<span style="font-weight:600;color:var(--text)">' + escapeHtml(it.title) + '</span>' +
          weekTag +
        '</div>' +
      '</td>' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:6px">' +
          '<span style="font-size:14px">' + escapeHtml(it.appIcon) + '</span>' +
          '<span style="font-size:12.5px;color:var(--muted)">' + escapeHtml(it.appName) + '</span>' +
        '</div>' +
      '</td>' +
      '<td style="font-size:12.5px;color:var(--muted);white-space:nowrap">' + relTime(it.created) + '</td>' +
    '</tr>';
  }
  html += '</tbody></table>';
  wrap.innerHTML = html;
}

setTimeout(function(){
  renderHeroStats();
  renderSprintCard();
  renderDashboardKb();
  renderTeamCard();
}, 100);

function escapeAttr(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function openImageView(src) {
  var win = window.open('', '_blank');
  if (win) win.document.write('<title>Image preview</title><img src="' + src + '" style="max-width:100%">');
}

// ── Rich editor helpers ──
function execRich(cmd, val) {
  document.execCommand(cmd, false, val || null);
}

function execHighlight() {
  // Wrap selection in <mark>
  var sel = window.getSelection();
  if (!sel.rangeCount) return;
  var range = sel.getRangeAt(0);
  if (range.collapsed) return;
  var mark = document.createElement('mark');
  try {
    mark.appendChild(range.extractContents());
    range.insertNode(mark);
    sel.removeAllRanges();
  } catch (e) {
    document.execCommand('hiliteColor', false, '#FEF08A');
  }
}

function insertRichImage(editorId) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = function() {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    if (file.size > 2 * 1024 * 1024) { showToast('⚠️ Image too large (max 2MB)'); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
      var ed = document.getElementById(editorId);
      ed.focus();
      // Insert <img> at caret position
      var sel = window.getSelection();
      if (sel.rangeCount && ed.contains(sel.anchorNode)) {
        var range = sel.getRangeAt(0);
        range.deleteContents();
        var img = document.createElement('img');
        img.src = e.target.result;
        range.insertNode(img);
        // Move caret after image
        range.setStartAfter(img);
        range.setEndAfter(img);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        ed.innerHTML += '<img src="' + e.target.result + '">';
      }
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function bindRenderedImages(container) {
  if (!container) return;
  var imgs = container.querySelectorAll('.rich-rendered img');
  for (var i = 0; i < imgs.length; i++) {
    (function(img) {
      img.onclick = function() { openImageView(img.src); };
    })(imgs[i]);
  }
}

// ── Icon picker ──
function buildIconPicker() {
  var picker = document.getElementById('appIconPicker');
  var html = '';
  for (var g = 0; g < ICON_GROUPS.length; g++) {
    var grp = ICON_GROUPS[g];
    html += '<div style="font-size:11px;font-weight:600;color:var(--muted);margin:' + (g === 0 ? '0' : '10px') + ' 0 6px;text-transform:uppercase;letter-spacing:.5px">' + escapeHtml(grp.label) + '</div>';
    html += '<div class="icon-picker-grid">';
    for (var i = 0; i < grp.icons.length; i++) {
      var ic = grp.icons[i];
      var sel = (ic === pendingAppIcon) ? ' selected' : '';
      html += '<button type="button" class="icon-choice' + sel + '" onclick="setAppIcon(\'' + escapeJs(ic) + '\')">' + escapeHtml(ic) + '</button>';
    }
    html += '</div>';
  }
  picker.innerHTML = html;
}

function toggleIconPicker() {
  var picker = document.getElementById('appIconPicker');
  if (picker.style.display === 'none') {
    buildIconPicker();
    picker.style.display = '';
  } else {
    picker.style.display = 'none';
  }
}

function setAppIcon(icon) {
  pendingAppIcon = icon;
  document.getElementById('appIconBtn').textContent = icon;
  buildIconPicker();
}

// ── Application modal ──
function openAppModal(type, idx) {
  editingAppType = type;
  editingAppIdx = (typeof idx === 'number') ? idx : null;
  document.getElementById('appNameInput').value = '';
  pendingAppIcon = '📁';
  document.getElementById('appIconBtn').textContent = '📁';
  document.getElementById('appIconPicker').style.display = 'none';
  document.getElementById('appModalTitle').textContent = (editingAppIdx != null ? 'Edit' : 'Add') + ' Application';

  if (editingAppIdx != null) {
    var apps = type === 'script' ? scriptApps : kbApps;
    var app = apps[editingAppIdx];
    document.getElementById('appNameInput').value = app.name || '';
    pendingAppIcon = app.icon || '📁';
    document.getElementById('appIconBtn').textContent = pendingAppIcon;
  }
  document.getElementById('appModalOverlay').classList.add('open');
}

function closeAppModal() {
  document.getElementById('appModalOverlay').classList.remove('open');
}

function saveApp() {
  var name = document.getElementById('appNameInput').value.trim();
  if (!name) { showToast('⚠️ Application name required'); return; }

  var apps = editingAppType === 'script' ? scriptApps : kbApps;
  var entry = {
    name: name,
    icon: pendingAppIcon || '📁'
  };

  if (editingAppIdx != null) {
    var existing = apps[editingAppIdx];
    entry.scripts = existing.scripts;
    entry.articles = existing.articles;
    entry.created = existing.created;
    apps[editingAppIdx] = entry;
    showToast('✅ Application updated');
  } else {
    if (editingAppType === 'script') entry.scripts = [];
    else entry.articles = [];
    entry.created = new Date().toISOString();
    apps.push(entry);
    showToast('✅ Application added');
  }

  if (editingAppType === 'script') { saveScriptApps(); renderScriptPage(); }
  else { saveKbApps(); renderKbPage(); }
  closeAppModal();
}

function editApp(type, idx) { openAppModal(type, idx); }

function deleteApp(type, idx) {
  var apps = type === 'script' ? scriptApps : kbApps;
  var label = type === 'script' ? 'scripts' : 'articles';
  if (!confirm('Delete "' + apps[idx].name + '"?\n\nAll ' + label + ' inside will be lost. This cannot be undone.')) return;
  apps.splice(idx, 1);
  if (type === 'script') {
    saveScriptApps();
    if (currentScriptApp === idx) { currentScriptApp = null; currentScriptItem = null; }
    else if (currentScriptApp !== null && currentScriptApp > idx) currentScriptApp--;
    renderScriptPage();
  } else {
    saveKbApps();
    if (currentKbApp === idx) { currentKbApp = null; currentKbItem = null; }
    else if (currentKbApp !== null && currentKbApp > idx) currentKbApp--;
    renderKbPage();
  }
  showToast('🗑 Application removed');
}

// ── Script item modal ──
function openScriptItemModal(idx) {
  editingScriptIdx = (typeof idx === 'number') ? idx : null;
  document.getElementById('scriptTitleInput').value = '';
  document.getElementById('scriptBodyEditor').innerHTML = '';
  document.getElementById('scriptItemModalTitle').textContent = (editingScriptIdx != null ? 'Edit' : 'Add') + ' Script';

  if (editingScriptIdx != null && currentScriptApp !== null) {
    var s = scriptApps[currentScriptApp].scripts[editingScriptIdx];
    document.getElementById('scriptTitleInput').value = s.title || '';
    document.getElementById('scriptBodyEditor').innerHTML = s.body || '';
  }
  document.getElementById('scriptItemModalOverlay').classList.add('open');
  setTimeout(function(){ document.getElementById('scriptBodyEditor').focus(); lastEditorFocused = 'scriptBodyEditor'; }, 50);
}

function closeScriptItemModal() {
  document.getElementById('scriptItemModalOverlay').classList.remove('open');
}

function saveScriptItem() {
  if (currentScriptApp === null) { showToast('⚠️ No application selected'); return; }
  var title = document.getElementById('scriptTitleInput').value.trim();
  var body = document.getElementById('scriptBodyEditor').innerHTML;
  var bodyText = (document.getElementById('scriptBodyEditor').textContent || '').trim();
  if (!title || (!bodyText && body.indexOf('<img') === -1)) { showToast('⚠️ Title and body required'); return; }

  if (!scriptApps[currentScriptApp].scripts) scriptApps[currentScriptApp].scripts = [];
  var entry = {
    title: title,
    body: body,
    comments: [],
    created: new Date().toISOString()
  };
  if (editingScriptIdx != null) {
    var existing = scriptApps[currentScriptApp].scripts[editingScriptIdx];
    entry.created = existing.created || entry.created;
    entry.comments = existing.comments || [];
    scriptApps[currentScriptApp].scripts[editingScriptIdx] = entry;
    showToast('✅ Script updated');
  } else {
    scriptApps[currentScriptApp].scripts.push(entry);
    showToast('✅ Script added');
  }
  saveScriptApps();
  closeScriptItemModal();
  if (currentScriptItem !== null) renderScriptItemView();
  else renderScriptDetail();
}

function editScriptItem(idx) { openScriptItemModal(idx); }

function deleteScriptItem(idx) {
  if (currentScriptApp === null) return;
  if (!confirm('Delete this script? Comments will also be lost.')) return;
  scriptApps[currentScriptApp].scripts.splice(idx, 1);
  saveScriptApps();
  if (currentScriptItem === idx) currentScriptItem = null;
  else if (currentScriptItem !== null && currentScriptItem > idx) currentScriptItem--;
  renderScriptPage();
  showToast('🗑 Script removed');
}

function addScriptComment() {
  if (currentScriptApp === null || currentScriptItem === null) return;
  var input = document.getElementById('scriptCommentInput');
  if (!input) return;
  var text = (input.value || '').trim();
  if (!text) { showToast('⚠️ Comment cannot be empty'); return; }

  var s = scriptApps[currentScriptApp].scripts[currentScriptItem];
  if (!s.comments) s.comments = [];
  s.comments.push({ author: 'Admin', text: text, date: new Date().toISOString() });
  saveScriptApps();
  renderScriptItemView();
  showToast('✅ Comment posted');
}

function deleteScriptComment(commentIdx) {
  if (currentScriptApp === null || currentScriptItem === null) return;
  if (!confirm('Delete this comment?')) return;
  scriptApps[currentScriptApp].scripts[currentScriptItem].comments.splice(commentIdx, 1);
  saveScriptApps();
  renderScriptItemView();
}

// ── Article modal ──
function openArticleModal(idx) {
  editingArticleIdx = (typeof idx === 'number') ? idx : null;
  document.getElementById('articleTitleInput').value = '';
  document.getElementById('articleBodyEditor').innerHTML = '';
  document.getElementById('articleModalTitle').textContent = (editingArticleIdx != null ? 'Edit' : 'Add') + ' Article';

  if (editingArticleIdx != null && currentKbApp !== null) {
    var a = kbApps[currentKbApp].articles[editingArticleIdx];
    document.getElementById('articleTitleInput').value = a.title || '';
    document.getElementById('articleBodyEditor').innerHTML = a.body || '';
  }
  document.getElementById('articleModalOverlay').classList.add('open');
  setTimeout(function(){ document.getElementById('articleBodyEditor').focus(); lastEditorFocused = 'articleBodyEditor'; }, 50);
}

function closeArticleModal() {
  document.getElementById('articleModalOverlay').classList.remove('open');
}

function saveArticle() {
  if (currentKbApp === null) { showToast('⚠️ No application selected'); return; }
  var title = document.getElementById('articleTitleInput').value.trim();
  var body = document.getElementById('articleBodyEditor').innerHTML;
  var bodyText = (document.getElementById('articleBodyEditor').textContent || '').trim();
  if (!title || (!bodyText && body.indexOf('<img') === -1)) { showToast('⚠️ Title and body required'); return; }

  if (!kbApps[currentKbApp].articles) kbApps[currentKbApp].articles = [];

  var entry = {
    title: title,
    body: body,
    comments: [],
    created: new Date().toISOString()
  };
  if (editingArticleIdx != null) {
    var existing = kbApps[currentKbApp].articles[editingArticleIdx];
    entry.created = existing.created || entry.created;
    entry.comments = existing.comments || [];
    kbApps[currentKbApp].articles[editingArticleIdx] = entry;
    showToast('✅ Article updated');
  } else {
    kbApps[currentKbApp].articles.push(entry);
    showToast('✅ Article added');
  }
  saveKbApps();
  closeArticleModal();
  if (currentKbItem !== null) renderKbItemView();
  else renderKbDetail();
}

function editArticle(idx) { openArticleModal(idx); }

function deleteArticle(idx) {
  if (currentKbApp === null) return;
  if (!confirm('Delete this article? Comments will also be lost.')) return;
  kbApps[currentKbApp].articles.splice(idx, 1);
  saveKbApps();
  if (currentKbItem === idx) currentKbItem = null;
  else if (currentKbItem !== null && currentKbItem > idx) currentKbItem--;
  renderKbPage();
  showToast('🗑 Article removed');
}

// ── Comments (KB) ──
function addComment(articleIdx) {
  if (currentKbApp === null) return;
  var input = document.getElementById('kbCommentInput');
  if (!input) return;
  var text = (input.value || '').trim();
  if (!text) { showToast('⚠️ Comment cannot be empty'); return; }

  if (!kbApps[currentKbApp].articles[articleIdx].comments) kbApps[currentKbApp].articles[articleIdx].comments = [];
  kbApps[currentKbApp].articles[articleIdx].comments.push({
    author: 'Admin',
    text: text,
    date: new Date().toISOString()
  });
  saveKbApps();
  if (currentKbItem !== null) renderKbItemView();
  else renderKbDetail();
  showToast('✅ Comment posted');
}

function deleteComment(articleIdx, commentIdx) {
  if (currentKbApp === null) return;
  if (!confirm('Delete this comment?')) return;
  kbApps[currentKbApp].articles[articleIdx].comments.splice(commentIdx, 1);
  saveKbApps();
  if (currentKbItem !== null) renderKbItemView();
  else renderKbDetail();
}

// ============ DATABASE CREDENTIALS ============
var dbList = [];
var editingDbIdx = null;

function loadDbList() {
  var raw = localStorage.getItem('hd_dblist') || '[]';
  try {
    dbList = JSON.parse(raw);
  } catch (e) { dbList = []; }
}

function saveDbList() {
  localStorage.setItem('hd_dblist', JSON.stringify(dbList));
}

loadDbList();

function renderDbList() {
  var tbody = document.getElementById('dbTbody');
  var empty = document.getElementById('dbEmpty');
  var tableWrap = document.getElementById('dbTableWrap');
  var search = (document.getElementById('dbSearch').value || '').toLowerCase().trim();
  var envFilter = document.getElementById('dbEnvFilter').value;

  var filtered = dbList.filter(function(db) {
    if (db.env !== envFilter) return false;
    if (search) {
      var hay = (db.name + ' ' + db.host + ' ' + (db.tags || []).join(' ') + ' ' + (db.type || '') + ' ' + (db.env || '') + ' ' + (db.user || '')).toLowerCase();
      if (hay.indexOf(search) === -1) return false;
    }
    return true;
  });

  if (dbList.length === 0) {
    tableWrap.style.display = 'none';
    empty.style.display = 'block';
    tbody.innerHTML = '';
    return;
  }

  empty.style.display = 'none';
  tableWrap.style.display = '';
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="padding:30px;text-align:center;color:var(--muted);font-size:13px">No databases match your filter.</td></tr>';
    return;
  }

  for (var i = 0; i < filtered.length; i++) {
    var db = filtered[i];
    var realIdx = dbList.indexOf(db);
    var passVal = db.password || '';
    var maskedPass = '••••••••••';

    var tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.onclick = (function(idx){ return function(e){
      if (e.target.closest('button')) return;
      openDbModal(idx);
    }; })(realIdx);
    tr.innerHTML =
      '<td>' +
        '<div style="font-weight:600;color:var(--text)">' + escapeHtml(db.name) + '</div>' +
        '<div style="font-size:11.5px;color:var(--muted);margin-top:2px">' + escapeHtml(db.type || 'Database') + '</div>' +
      '</td>' +
      '<td><span class="db-env-badge db-env-' + escapeHtml(db.env || 'uat') + '" style="font-family:Courier New,monospace;font-size:12px;font-weight:500;background:none;border:none;padding:0;color:var(--text)">' + escapeHtml(db.host || '—') + '</span></td>' +
      '<td onclick="event.stopPropagation()">' +
        '<div style="display:flex;align-items:center;gap:6px">' +
          '<span class="db-field-pass" id="dbPass-' + realIdx + '" style="font-family:Courier New,monospace;font-size:12.5px;letter-spacing:1.5px">' + maskedPass + '</span>' +
          '<button class="db-icon-btn" onclick="togglePassVisibility(' + realIdx + ',\'' + escapeJs(passVal) + '\')" id="dbEye-' + realIdx + '" title="Show/hide">👁</button>' +
        '</div>' +
      '</td>' +
      '<td style="font-size:12px;color:var(--muted);white-space:nowrap">' + (db.updated ? formatDate(db.updated) : '—') + '</td>';
    tbody.appendChild(tr);
  }
}

function escapeJs(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

function togglePassVisibility(idx, plain) {
  var el = document.getElementById('dbPass-' + idx);
  var eye = document.getElementById('dbEye-' + idx);
  if (!el) return;
  if (el.textContent.indexOf('•') === 0) {
    el.textContent = plain;
    el.style.letterSpacing = '0';
    if (eye) eye.textContent = '🙈';
    setTimeout(function() {
      if (el && el.textContent === plain) {
        el.textContent = '••••••••••';
        el.style.letterSpacing = '1.5px';
        if (eye) eye.textContent = '👁';
      }
    }, 15000);
  } else {
    el.textContent = '••••••••••';
    el.style.letterSpacing = '1.5px';
    if (eye) eye.textContent = '👁';
  }
}

function copyToClipboard(text, label) {
  if (!text) { showToast('Nothing to copy'); return; }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() {
      showToast('✅ ' + (label || 'Copied'));
    }).catch(function() {
      fallbackCopy(text, label);
    });
  } else {
    fallbackCopy(text, label);
  }
}

function fallbackCopy(text, label) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast('✅ ' + (label || 'Copied'));
  } catch (e) {
    showToast('⚠️ Copy failed');
  }
  document.body.removeChild(ta);
}

function openDbModal(idx) {
  document.getElementById('dbModalOverlay').classList.add('open');
  var deleteBtn = document.getElementById('dbDeleteBtn');
  if (typeof idx === 'number') {
    var db = dbList[idx];
    document.getElementById('dbModalTitle').textContent = 'Edit Database';
    document.getElementById('dbName').value = db.name || '';
    document.getElementById('dbType').value = db.type || 'PostgreSQL';
    document.getElementById('dbEnv').value = db.env || 'uat';
    document.getElementById('dbHost').value = db.host || '';
    document.getElementById('dbPort').value = db.port || '';
    document.getElementById('dbSchema').value = db.schema || '';
    document.getElementById('dbUser').value = db.user || '';
    document.getElementById('dbPass').value = db.password || '';
    editingDbIdx = idx;
    if (deleteBtn) deleteBtn.style.display = '';
  } else {
    document.getElementById('dbModalTitle').textContent = 'Add Database';
    var fields = ['dbName', 'dbHost', 'dbPort', 'dbSchema', 'dbUser', 'dbPass'];
    for (var i = 0; i < fields.length; i++) document.getElementById(fields[i]).value = '';
    document.getElementById('dbType').value = 'PostgreSQL';
    document.getElementById('dbEnv').value = 'uat';
    editingDbIdx = null;
    if (deleteBtn) deleteBtn.style.display = 'none';
  }
  document.getElementById('dbPass').type = 'password';
  document.getElementById('dbPassToggle').textContent = '👁';
}

function closeDbModal() {
  document.getElementById('dbModalOverlay').classList.remove('open');
}

function toggleModalPassVisibility() {
  var input = document.getElementById('dbPass');
  var btn = document.getElementById('dbPassToggle');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

function generatePassword() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  var pass = '';
  var crypto = window.crypto || window.msCrypto;
  if (crypto && crypto.getRandomValues) {
    var arr = new Uint32Array(20);
    crypto.getRandomValues(arr);
    for (var i = 0; i < 20; i++) pass += chars[arr[i] % chars.length];
  } else {
    for (var i = 0; i < 20; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  }
  document.getElementById('dbPass').value = pass;
  document.getElementById('dbPass').type = 'text';
  document.getElementById('dbPassToggle').textContent = '🙈';
  showToast('🎲 Generated 20-char password');
}

function saveDb() {
  var name = document.getElementById('dbName').value.trim();
  var host = document.getElementById('dbHost').value.trim();
  var pass = document.getElementById('dbPass').value;

  if (!name || !host || !pass) {
    showToast('⚠️ Name, IP/Host, and Password are required');
    return;
  }

  var existing = (editingDbIdx != null) ? dbList[editingDbIdx] : null;
  var entry = {
    name: name,
    type: document.getElementById('dbType').value,
    env: document.getElementById('dbEnv').value,
    host: host,
    port: document.getElementById('dbPort').value.trim(),
    schema: document.getElementById('dbSchema').value.trim(),
    user: document.getElementById('dbUser').value.trim(),
    password: pass,
    notes: existing ? (existing.notes || '') : '',
    tags: existing ? (existing.tags || []) : [],
    updated: new Date().toISOString()
  };

  if (editingDbIdx != null) {
    entry.created = existing.created || entry.updated;
    dbList[editingDbIdx] = entry;
    showToast('✅ Database updated');
  } else {
    entry.created = entry.updated;
    dbList.push(entry);
    showToast('✅ Database added');
  }

  saveDbList();
  closeDbModal();
  renderDbList();
}

function editDb(idx) {
  openDbModal(idx);
}

function deleteCurrentDb() {
  if (editingDbIdx == null) return;
  var db = dbList[editingDbIdx];
  if (!confirm('Delete "' + db.name + '"?\n\nThis cannot be undone.')) return;
  dbList.splice(editingDbIdx, 1);
  editingDbIdx = null;
  saveDbList();
  closeDbModal();
  renderDbList();
  showToast('🗑 Database removed');
}

function deleteDb(idx) {
  var db = dbList[idx];
  if (!confirm('Delete "' + db.name + '"?\n\nThis cannot be undone.')) return;
  dbList.splice(idx, 1);
  saveDbList();
  renderDbList();
  showToast('🗑 Database removed');
}

setTimeout(renderDbList, 100);
