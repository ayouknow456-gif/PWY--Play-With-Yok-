(() => {
  let players = [];
  let lastAssignment = null;

  const setupView = document.getElementById('setupView');
  const confirmView = document.getElementById('confirmView');
  const resultView = document.getElementById('resultView');

  const nameInput = document.getElementById('nameInput');
  const addBtn = document.getElementById('addBtn');
  const chipList = document.getElementById('chipList');
  const countHint = document.getElementById('countHint');
  const nextBtn = document.getElementById('nextBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');

  const confirmSummary = document.getElementById('confirmSummary');
  const roleBreakdown = document.getElementById('roleBreakdown');
  const assignBtn = document.getElementById('assignBtn');
  const backBtn = document.getElementById('backBtn');

  const resultGrid = document.getElementById('resultGrid');
  const reRollBtn = document.getElementById('reRollBtn');
  const editBtn = document.getElementById('editBtn');

  const ROLE_META = {
    spy:      { icon:'🕵️', name:'ตัวแฝง',    cls:'spy' },
    sheriff:  { icon:'⭐',  name:'นายอำเภอ',  cls:'sheriff' },
    doctor:   { icon:'💉',  name:'หมอ',       cls:'doctor' },
    innocent: { icon:'🙂',  name:'ผู้บริสุทธิ์', cls:'innocent' },
  };

  function escapeHtml(s){ const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function renderChips(){
    chipList.innerHTML = '';
    players.forEach((n,i) => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.innerHTML = `<span>${escapeHtml(n)}</span>`;
      const rm = document.createElement('button');
      rm.textContent = '×';
      rm.onclick = () => { players.splice(i,1); PWY.click(); renderChips(); };
      chip.appendChild(rm);
      chipList.appendChild(chip);
    });
    countHint.textContent = players.length === 0
      ? 'ยังไม่มีผู้เล่น (ต้องการอย่างน้อย 4 คน)'
      : players.length < 4
        ? `มี ${players.length} คน — ต้องการอีกอย่างน้อย ${4 - players.length} คน`
        : `มี ${players.length} คน พร้อมเริ่มเกม`;
    nextBtn.disabled = players.length < 4;
  }

  function addPlayer(){
    const v = nameInput.value.trim();
    if(!v) return;
    if(players.includes(v)){ nameInput.value=''; return; }
    players.push(v);
    nameInput.value = '';
    PWY.pop();
    renderChips();
    nameInput.focus();
  }

  addBtn.addEventListener('click', addPlayer);
  nameInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') addPlayer(); });
  clearAllBtn.addEventListener('click', () => { players = []; PWY.click(); renderChips(); });

  function showBreakdown(){
    const innocentCount = players.length - 3;
    confirmSummary.textContent = `ผู้เล่นทั้งหมด ${players.length} คน`;
    roleBreakdown.innerHTML = `
      <span class="role-pill">🕵️ ตัวแฝง × 1</span>
      <span class="role-pill">⭐ นายอำเภอ × 1</span>
      <span class="role-pill">💉 หมอ × 1</span>
      <span class="role-pill">🙂 ผู้บริสุทธิ์ × ${innocentCount}</span>
    `;
  }

  nextBtn.addEventListener('click', () => {
    if(players.length < 4) return;
    PWY.click();
    showBreakdown();
    setupView.classList.remove('active');
    confirmView.classList.add('active');
  });

  backBtn.addEventListener('click', () => {
    PWY.click();
    confirmView.classList.remove('active');
    setupView.classList.add('active');
  });

  function assignRoles(){
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const assignment = {};
    shuffled.forEach((name, i) => {
      if(i === 0) assignment[name] = 'spy';
      else if(i === 1) assignment[name] = 'sheriff';
      else if(i === 2) assignment[name] = 'doctor';
      else assignment[name] = 'innocent';
    });
    lastAssignment = assignment;
    return assignment;
  }

  function renderResults(assignment){
    resultGrid.innerHTML = '';
    players.forEach((name, i) => {
      const role = assignment[name];
      const meta = ROLE_META[role];
      const card = document.createElement('div');
      card.className = `role-card ${meta.cls}`;
      card.style.animationDelay = `${i * 0.09}s`;
      card.innerHTML = `
        <div class="role-icon">${meta.icon}</div>
        <div class="name">${escapeHtml(name)}</div>
        <div class="role-name">${meta.name}</div>
      `;
      resultGrid.appendChild(card);
    });
  }

  assignBtn.addEventListener('click', () => {
    PWY.fanfare();
    const assignment = assignRoles();
    confirmView.classList.remove('active');
    resultView.classList.add('active');
    renderResults(assignment);
  });

  reRollBtn.addEventListener('click', () => {
    PWY.click();
    const assignment = assignRoles();
    renderResults(assignment);
    PWY.fanfare();
  });

  editBtn.addEventListener('click', () => {
    PWY.click();
    resultView.classList.remove('active');
    setupView.classList.add('active');
  });

  renderChips();
})();
