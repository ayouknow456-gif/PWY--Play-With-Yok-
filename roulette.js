(() => {
  const PALETTE = ['#FFC93C','#FF5E9E','#3FE0C5','#5FA8FF','#FF8C42','#B784FF','#FF4D5E','#4CD964'];

  let names = [];
  let rotation = 0;      // accumulated rotation in degrees
  let spinning = false;
  let lastWinnerIndex = null;

  const setupView = document.getElementById('setupView');
  const wheelView = document.getElementById('wheelView');
  const nameInput = document.getElementById('nameInput');
  const addBtn = document.getElementById('addBtn');
  const chipList = document.getElementById('chipList');
  const countHint = document.getElementById('countHint');
  const wheelCountHint = document.getElementById('wheelCountHint');
  const startSpinBtn = document.getElementById('startSpinBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const spinBtn = document.getElementById('spinBtn');
  const editNamesBtn = document.getElementById('editNamesBtn');
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const resultModal = document.getElementById('resultModal');
  const winnerText = document.getElementById('winnerText');
  const removeOptionBtn = document.getElementById('removeOptionBtn');
  const restartBtn = document.getElementById('restartBtn');
  const okBtn = document.getElementById('okBtn');

  function renderChips(){
    chipList.innerHTML = '';
    names.forEach((n, i) => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.innerHTML = `<span>${escapeHtml(n)}</span>`;
      const rm = document.createElement('button');
      rm.textContent = '×';
      rm.setAttribute('aria-label', 'ลบ ' + n);
      rm.onclick = () => { names.splice(i,1); PWY.click(); renderChips(); };
      chip.appendChild(rm);
      chipList.appendChild(chip);
    });
    countHint.textContent = names.length === 0
      ? 'ยังไม่มีชื่อในวงล้อ'
      : `มีทั้งหมด ${names.length} ชื่อในวงล้อ`;
    startSpinBtn.disabled = names.length < 2;
  }

  function escapeHtml(s){
    const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
  }

  function addName(){
    const v = nameInput.value.trim();
    if(!v) return;
    names.push(v);
    nameInput.value = '';
    PWY.pop();
    renderChips();
    nameInput.focus();
  }

  addBtn.addEventListener('click', addName);
  nameInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') addName(); });
  clearAllBtn.addEventListener('click', () => { names = []; PWY.click(); renderChips(); });

  startSpinBtn.addEventListener('click', () => {
    if(names.length < 2) return;
    PWY.click();
    setupView.classList.remove('active');
    wheelView.classList.add('active');
    rotation = 0;
    drawWheel();
    updateWheelHint();
  });

  editNamesBtn.addEventListener('click', () => {
    if(spinning) return;
    PWY.click();
    wheelView.classList.remove('active');
    setupView.classList.add('active');
  });

  function updateWheelHint(){
    wheelCountHint.textContent = `${names.length} ตัวเลือกในวงล้อ`;
  }

  function drawWheel(){
    const n = names.length;
    const w = canvas.width, h = canvas.height;
    const cx = w/2, cy = h/2, r = w/2 - 8;
    ctx.clearRect(0,0,w,h);
    if(n === 0) return;
    const seg = (Math.PI*2)/n;

    for(let i=0;i<n;i++){
      const start = -Math.PI/2 + i*seg;
      const end = start + seg;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,start,end);
      ctx.closePath();
      ctx.fillStyle = PALETTE[i % PALETTE.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(15,8,33,0.35)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // label
      ctx.save();
      ctx.translate(cx,cy);
      ctx.rotate(start + seg/2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#170B2E';
      ctx.font = `600 ${Math.max(16, Math.min(26, 260/n))}px Kanit, sans-serif`;
      let label = names[i];
      if(label.length > 12) label = label.slice(0,11) + '…';
      ctx.fillText(label, r - 18, 0);
      ctx.restore();
    }
  }

  function easeOutQuint(t){ return 1 - Math.pow(1-t, 5); }

  function spin(){
    if(spinning || names.length < 2) return;
    spinning = true;
    spinBtn.disabled = true;
    editNamesBtn.disabled = true;

    const n = names.length;
    const seg = 360/n;
    const winnerIndex = Math.floor(Math.random()*n);
    lastWinnerIndex = winnerIndex;

    // land near the center of the winning segment with slight randomness
    const jitter = (Math.random()-0.5) * seg * 0.6;
    const angleAtTop = ((winnerIndex*seg) + seg/2 + jitter + 360) % 360;
    const normalizedTarget = (360 - angleAtTop + 360) % 360;

    const currentMod = ((rotation % 360) + 360) % 360;
    const diff = ((normalizedTarget - currentMod) + 360) % 360;
    const extraSpins = 6 + Math.floor(Math.random()*2); // 6-7 full spins
    const startRotation = rotation;
    const finalRotation = rotation + extraSpins*360 + diff;
    const duration = 4300 + Math.random()*500; // 4.3 - 4.8s

    let lastTickSeg = Math.floor(currentMod/seg);
    const startTime = performance.now();

    function frame(now){
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed/duration);
      const eased = easeOutQuint(t);
      rotation = startRotation + (finalRotation - startRotation)*eased;
      canvas.parentElement.style.transform = `rotate(${rotation}deg)`;

      const mod = ((rotation % 360) + 360) % 360;
      const curSeg = Math.floor(mod/seg);
      if(curSeg !== lastTickSeg){
        lastTickSeg = curSeg;
        PWY.tick();
      }

      if(t < 1){
        requestAnimationFrame(frame);
      }else{
        spinning = false;
        spinBtn.disabled = false;
        editNamesBtn.disabled = false;
        onSpinFinished(winnerIndex);
      }
    }
    requestAnimationFrame(frame);
  }

  function onSpinFinished(winnerIndex){
    PWY.fanfare();
    const winnerName = names[winnerIndex];
    winnerText.textContent = `ผู้โชคดีคือ ${winnerName}`;
    resultModal.style.display = 'flex';
    PWY.speak(`ผู้โชคดีคือ ${winnerName}`, {rate:1});
  }

  spinBtn.addEventListener('click', () => { PWY.click(); spin(); });

  removeOptionBtn.addEventListener('click', () => {
    PWY.click();
    if(lastWinnerIndex !== null) names.splice(lastWinnerIndex, 1);
    lastWinnerIndex = null;
    resultModal.style.display = 'none';
    if(names.length < 2){
      wheelView.classList.remove('active');
      setupView.classList.add('active');
      renderChips();
    }else{
      drawWheel();
      updateWheelHint();
    }
  });

  restartBtn.addEventListener('click', () => {
    PWY.click();
    names = [];
    lastWinnerIndex = null;
    rotation = 0;
    canvas.parentElement.style.transform = 'rotate(0deg)';
    resultModal.style.display = 'none';
    wheelView.classList.remove('active');
    setupView.classList.add('active');
    renderChips();
  });

  okBtn.addEventListener('click', () => {
    PWY.click();
    resultModal.style.display = 'none';
  });

  renderChips();
})();
