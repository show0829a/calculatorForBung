// Bung Calculator - 2026 Modern Fintech Application Logic (with History Board Drawer)

document.addEventListener('DOMContentLoaded', () => {
  const CURRENT_STATE_KEY = 'bungbi_calc_current_state_v2';
  const HISTORY_STORAGE_KEY = 'bungbi_calc_history_v2';
  const MEMBER_PROFILES_KEY = 'bungbi_calc_member_profiles_v1';

  // Helper: Default Meeting Title
  function getDefaultMeetingTitle() {
    const now = new Date();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    return `${m}월 ${d}일 벙 정산`;
  }

  function createDefaultDrinkTrackerState() {
    return {
      shotsPerBottle: 8,
      includeInReceipt: true,
      autoSyncToFirstRound: true,
      members: {}, // { [name]: { shots: 0, updatedAt: number } }
      logs: [] // [{ id, name, delta, totalShots, timestamp, isMilestone, bottleNum }]
    };
  }

  // Application State
  const state = {
    meetingId: null, // ID of currently loaded meeting record (null if new)
    meetingTitle: getDefaultMeetingTitle(),
    activeTab: 'settlement', // 'settlement' | 'drink'
    rounds: [], // { id, name, amount, addedAttendees: [], removedAttendees: [] }
    operatingFee: 0,
    hostName: '', // Name of gathering host (벙주)
    hostSupportFee: 0, // Support fee per non-host attendee (e.g. 1000)
    roundRule: 'floor',
    bankInfo: '기업은행 425-016501-01-019 ㄱㅅㅎ',
    nextRoundId: 1,
    paidAttendees: {}, // { [name]: boolean }
    drinkTracker: createDefaultDrinkTrackerState()
  };

  let latestAttendeeTotals = [];

  // DOM Elements - Navigation & Meeting Bar
  const newMeetingBtn = document.getElementById('new-meeting-btn');
  const openHistoryBtn = document.getElementById('open-history-btn');
  const historyCountPill = document.getElementById('history-count-pill');
  const meetingTitleInput = document.getElementById('meeting-title-input');
  const saveHistoryBtn = document.getElementById('save-history-btn');

  // DOM Elements - Workspace Tabs
  const tabItemSettlement = document.getElementById('tab-item-settlement');
  const tabItemDrink = document.getElementById('tab-item-drink');
  const tabBtnSettlement = document.getElementById('tab-btn-settlement');
  const tabBtnDrink = document.getElementById('tab-btn-drink');
  const panelSettlement = document.getElementById('panel-settlement');
  const panelDrink = document.getElementById('panel-drink');
  const settlementTabBadge = document.getElementById('settlement-tab-badge');
  const drinkTabBadge = document.getElementById('drink-tab-badge');

  // DOM Elements - Drawer
  const historyDrawer = document.getElementById('history-drawer');
  const historyBackdrop = document.getElementById('history-backdrop');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');
  const drawerCountBadge = document.getElementById('drawer-count-badge');
  const historyListElement = document.getElementById('history-list');

  // DOM Elements - Core App
  const roundsContainer = document.getElementById('rounds-container');
  const roundsCountBadge = document.getElementById('rounds-count-badge');
  const addRoundBtn = document.getElementById('add-round-btn');
  const resetAllBtn = document.getElementById('reset-all-btn');
  const bankInfoInput = document.getElementById('bank-info');
  const operatingFeeInput = document.getElementById('operating-fee');
  const hostSelect = document.getElementById('host-select');
  const hostSupportFeeInput = document.getElementById('host-support-fee');
  const hostSupportToggleBtn = document.getElementById('host-support-toggle-btn');
  const hostToggleBadge = document.getElementById('host-toggle-badge');
  const hostBenefitBanner = document.getElementById('host-benefit-banner');
  const hostQuickPills = document.querySelectorAll('.host-quick-pill');
  const roundRuleSelect = document.getElementById('round-rule');
  const resultTextElement = document.getElementById('result-text');
  const copyBtn = document.getElementById('copy-btn');
  const toggleDrinkReceiptBtn = document.getElementById('toggle-drink-receipt-btn');
  const drinkReceiptBadge = document.getElementById('drink-receipt-badge');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  // DOM Elements - Drink Tracker Workspace
  const shotsPerBottleSelect = document.getElementById('shots-per-bottle-select');
  const syncDrinkToRoundsBtn = document.getElementById('sync-drink-to-rounds-btn');
  const drinkTotalBottlesStat = document.getElementById('drink-total-bottles-stat');
  const drinkTotalShotsStat = document.getElementById('drink-total-shots-stat');
  const drinkMvpStat = document.getElementById('drink-mvp-stat');
  const drinkAvgStat = document.getElementById('drink-avg-stat');
  const drinkActiveCountStat = document.getElementById('drink-active-count-stat');
  const autoSyncRound1Checkbox = document.getElementById('auto-sync-round1-checkbox');
  const drinkMemberInput = document.getElementById('drink-member-input');
  const drinkAddMemberBtn = document.getElementById('drink-add-member-btn');
  const drinkFrequentWrap = document.getElementById('drink-frequent-wrap');
  const drinkFrequentChips = document.getElementById('drink-frequent-chips');
  const drinkMembersCountBadge = document.getElementById('drink-members-count-badge');
  const resetDrinkCountsBtn = document.getElementById('reset-drink-counts-btn');
  const drinkMembersGrid = document.getElementById('drink-members-grid');
  const drinkReportText = document.getElementById('drink-report-text');
  const copyDrinkReportBtn = document.getElementById('copy-drink-report-btn');
  const undoLastShotBtn = document.getElementById('undo-last-shot-btn');
  const drinkLiveLogs = document.getElementById('drink-live-logs');
  const hofMemberCountBadge = document.getElementById('hof-member-count-badge');
  const memberHallOfFame = document.getElementById('member-hall-of-fame');

  // DOM Elements - 1-Bottle Milestone Banner
  const bottleMilestoneBanner = document.getElementById('bottle-milestone-banner');
  const milestoneEmoji = document.getElementById('milestone-emoji');
  const milestoneTag = document.getElementById('milestone-tag');
  const milestoneTitle = document.getElementById('milestone-title');
  const milestoneDesc = document.getElementById('milestone-desc');
  const closeMilestoneBtn = document.getElementById('close-milestone-btn');

  // DOM Elements - Payment Tracker
  const paymentTrackerCard = document.getElementById('payment-tracker-card');
  const paymentRateBadge = document.getElementById('payment-rate-badge');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const paymentCountStat = document.getElementById('payment-count-stat');
  const unpaidAmountStat = document.getElementById('unpaid-amount-stat');
  const paymentMembersList = document.getElementById('payment-members-list');
  const copyUnpaidBtn = document.getElementById('copy-unpaid-btn');

  // DOM Elements - Smart Import Modal
  const importTextBtn = document.getElementById('import-text-btn');
  const inlineImportBtn = document.getElementById('inline-import-btn');
  const importModal = document.getElementById('import-modal');
  const importModalBackdrop = document.getElementById('import-modal-backdrop');
  const closeImportModalBtn = document.getElementById('close-import-modal-btn');
  const cancelImportBtn = document.getElementById('cancel-import-btn');
  const applyImportBtn = document.getElementById('apply-import-btn');
  const importTextInput = document.getElementById('import-text-input');
  const importPreviewBox = document.getElementById('import-preview-box');
  const previewStatusText = document.getElementById('preview-status-text');
  const previewContentDetails = document.getElementById('preview-content-details');

  // ==========================================================================
  // LocalStorage Helpers
  // ==========================================================================

  function saveCurrentStateToLocalStorage() {
    try {
      const data = {
        meetingId: state.meetingId,
        meetingTitle: state.meetingTitle,
        activeTab: state.activeTab,
        rounds: state.rounds,
        operatingFee: state.operatingFee,
        hostName: state.hostName,
        hostSupportFee: state.hostSupportFee,
        roundRule: state.roundRule,
        bankInfo: state.bankInfo,
        paidAttendees: state.paidAttendees,
        drinkTracker: state.drinkTracker
      };
      localStorage.setItem(CURRENT_STATE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  function loadCurrentStateFromLocalStorage() {
    try {
      const raw = localStorage.getItem(CURRENT_STATE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.rounds) || data.rounds.length === 0) return false;

      state.meetingId = data.meetingId || null;
      state.meetingTitle = data.meetingTitle || getDefaultMeetingTitle();
      state.activeTab = data.activeTab || 'settlement';
      state.rounds = data.rounds;
      state.operatingFee = data.operatingFee || 0;
      state.hostName = data.hostName || '';
      state.hostSupportFee = data.hostSupportFee || 0;
      state.roundRule = data.roundRule || 'floor';
      state.bankInfo = data.bankInfo !== undefined ? data.bankInfo : '기업은행 425-016501-01-019 ㄱㅅㅎ';
      state.paidAttendees = data.paidAttendees || {};
      state.drinkTracker = Object.assign(createDefaultDrinkTrackerState(), data.drinkTracker || {});
      state.drinkTracker.members = (data.drinkTracker && data.drinkTracker.members) ? data.drinkTracker.members : {};
      state.drinkTracker.logs = (data.drinkTracker && Array.isArray(data.drinkTracker.logs)) ? data.drinkTracker.logs : [];
      state.nextRoundId = Math.max(...state.rounds.map(r => r.id), 0) + 1;

      meetingTitleInput.value = state.meetingTitle;
      bankInfoInput.value = state.bankInfo;
      operatingFeeInput.value = state.operatingFee;
      if (hostSupportFeeInput) hostSupportFeeInput.value = state.hostSupportFee;
      roundRuleSelect.value = state.roundRule;
      if (shotsPerBottleSelect) shotsPerBottleSelect.value = String(state.drinkTracker.shotsPerBottle || 8);
      if (autoSyncRound1Checkbox) autoSyncRound1Checkbox.checked = state.drinkTracker.autoSyncToFirstRound !== false;
      return true;
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
      return false;
    }
  }

  // History List Storage Helpers
  function getHistoryList() {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Get history failed:', e);
      return [];
    }
  }

  function saveHistoryList(list) {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
      updateHistoryBadges();
    } catch (e) {
      console.warn('Save history list failed:', e);
    }
  }

  function updateHistoryBadges() {
    const list = getHistoryList();
    const count = list.length;
    if (historyCountPill) historyCountPill.textContent = count;
    if (drawerCountBadge) drawerCountBadge.textContent = `${count}개`;
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  function initFirstRound(keepTitle = false) {
    state.meetingId = null;
    if (!keepTitle) {
      state.meetingTitle = getDefaultMeetingTitle();
      meetingTitleInput.value = state.meetingTitle;
    }

    state.rounds = [
      {
        id: state.nextRoundId++,
        name: '1차',
        amount: 0,
        addedAttendees: [],
        removedAttendees: []
      }
    ];

    state.operatingFee = 0;
    state.hostName = '';
    state.hostSupportFee = 0;
    state.roundRule = 'floor';
    state.bankInfo = '기업은행 425-016501-01-019 ㄱㅅㅎ';
    state.paidAttendees = {};
    state.drinkTracker = createDefaultDrinkTrackerState();

    try {
      localStorage.removeItem(CURRENT_STATE_KEY);
    } catch (e) {}

    // Sync Inputs
    bankInfoInput.value = state.bankInfo;
    operatingFeeInput.value = state.operatingFee;
    if (hostSupportFeeInput) hostSupportFeeInput.value = state.hostSupportFee;
    roundRuleSelect.value = state.roundRule;
    if (shotsPerBottleSelect) shotsPerBottleSelect.value = '8';
    if (autoSyncRound1Checkbox) autoSyncRound1Checkbox.checked = true;

    renderRounds();
    calculateAndRenderResults();
  }

  // ==========================================================================
  // Reactive Core Helpers
  // ==========================================================================

  function getRoundAttendees(roundId) {
    const roundIndex = state.rounds.findIndex(r => r.id === roundId);
    if (roundIndex === -1) return [];

    let baseAttendees = [];
    if (roundIndex > 0) {
      const prevRound = state.rounds[roundIndex - 1];
      baseAttendees = getRoundAttendees(prevRound.id);
    }

    const round = state.rounds[roundIndex];
    const removedSet = new Set(round.removedAttendees);

    const filteredBase = baseAttendees.filter(name => !removedSet.has(name));
    const finalAttendees = new Set([...filteredBase, ...round.addedAttendees]);
    return Array.from(finalAttendees);
  }

  function getAllUniqueAttendees() {
    const allNames = new Set();
    state.rounds.forEach(r => {
      const attendees = getRoundAttendees(r.id);
      attendees.forEach(name => {
        if (name.trim()) allNames.add(name.trim());
      });
    });
    return Array.from(allNames);
  }

  function formatMoney(amount) {
    return amount.toLocaleString('ko-KR');
  }

  function applyRounding(val, rule) {
    switch (rule) {
      case 'floor':
        return Math.floor(val);
      case 'floor10':
        return Math.floor(val / 10) * 10;
      case 'round':
        return Math.round(val);
      case 'ceil':
        return Math.ceil(val);
      default:
        return Math.floor(val);
    }
  }

  // ==========================================================================
  // Round Actions
  // ==========================================================================

  function createNewRound() {
    const displayIndex = state.rounds.length + 1;
    const newRound = {
      id: state.nextRoundId++,
      name: `${displayIndex}차`,
      amount: 0,
      addedAttendees: [],
      removedAttendees: []
    };

    state.rounds.push(newRound);
    renderRounds();
    calculateAndRenderResults();

    const newCard = document.getElementById(`round-card-${newRound.id}`);
    if (newCard) {
      newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      newCard.querySelector('.amount-input').focus();
    }
  }

  function deleteRound(id) {
    state.rounds = state.rounds.filter(r => r.id !== id);
    renderRounds();
    calculateAndRenderResults();
  }

  function addAttendeeToRound(roundId, name) {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const round = state.rounds.find(r => r.id === roundId);
    if (!round) return;

    const currentAttendees = getRoundAttendees(roundId);
    if (currentAttendees.includes(trimmedName)) return;

    round.removedAttendees = round.removedAttendees.filter(n => n !== trimmedName);

    if (!round.addedAttendees.includes(trimmedName)) {
      round.addedAttendees.push(trimmedName);
    }

    const activeRoundId = roundId;
    renderRounds();
    calculateAndRenderResults();

    const targetInput = document.querySelector(`#round-card-${activeRoundId} .attendee-text-input`);
    if (targetInput) targetInput.focus();
  }

  function removeAttendeeFromRound(roundId, name) {
    const round = state.rounds.find(r => r.id === roundId);
    if (!round) return;

    const roundIndex = state.rounds.findIndex(r => r.id === roundId);
    round.addedAttendees = round.addedAttendees.filter(n => n !== name);

    let inherited = false;
    if (roundIndex > 0) {
      const prevRoundAttendees = getRoundAttendees(state.rounds[roundIndex - 1].id);
      if (prevRoundAttendees.includes(name)) {
        inherited = true;
      }
    }

    if (roundIndex === 0 || inherited) {
      if (!round.removedAttendees.includes(name)) {
        round.removedAttendees.push(name);
      }
    }

    renderRounds();
    calculateAndRenderResults();
  }

  // ==========================================================================
  // Render Rounds UI
  // ==========================================================================

  function renderAttendeesChips(roundId) {
    const chipsContainer = document.getElementById(`chips-container-${roundId}`);
    if (!chipsContainer) return;

    chipsContainer.innerHTML = '';
    const roundAttendees = getRoundAttendees(roundId);

    roundAttendees.forEach(name => {
      const isHost = (name === state.hostName);
      const chip = document.createElement('span');
      chip.className = `chip ${isHost ? 'is-host' : ''}`;

      // Crown button to toggle 벙주 (주최자)
      const crownBtn = document.createElement('button');
      crownBtn.type = 'button';
      crownBtn.className = 'chip-crown-btn';
      crownBtn.textContent = '👑';
      crownBtn.title = isHost ? '👑 벙주 해제' : `👑 ${name}님을 벙주로 지정`;
      crownBtn.setAttribute('aria-label', crownBtn.title);
      crownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.hostName === name) {
          state.hostName = '';
        } else {
          state.hostName = name;
          state.paidAttendees[name] = true; // 벙주는 기본 입금 완료 처리
          // If support fee is currently 0, activate default 1,000원
          if (!state.hostSupportFee || state.hostSupportFee === 0) {
            state.hostSupportFee = 1000;
          }
        }
        renderRounds();
        calculateAndRenderResults();
      });

      const nameSpan = document.createElement('span');
      nameSpan.className = 'chip-name';
      nameSpan.textContent = name;

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'chip-delete';
      deleteBtn.innerHTML = '&times;';
      deleteBtn.setAttribute('aria-label', `${name} 제외`);
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeAttendeeFromRound(roundId, name);
      });

      chip.appendChild(crownBtn);
      chip.appendChild(nameSpan);
      chip.appendChild(deleteBtn);
      chipsContainer.appendChild(chip);
    });
  }

  function renderAllRecommendations() {
    const uniqueAttendees = getAllUniqueAttendees();
    const drinkMemberNames = state.drinkTracker && state.drinkTracker.members
      ? Object.keys(state.drinkTracker.members)
      : [];
    const candidateSet = new Set([...uniqueAttendees, ...drinkMemberNames]);
    const candidates = Array.from(candidateSet);

    state.rounds.forEach(round => {
      const recContainer = document.getElementById(`recommendations-${round.id}`);
      if (!recContainer) return;

      recContainer.innerHTML = '';
      const roundAttendees = getRoundAttendees(round.id);
      const unincluded = candidates.filter(name => !roundAttendees.includes(name));

      if (unincluded.length > 0) {
        unincluded.forEach(name => {
          const isFromDrinkOnly = !uniqueAttendees.includes(name) && drinkMemberNames.includes(name);
          const recChip = document.createElement('span');
          recChip.className = 'recommend-chip';
          recChip.textContent = isFromDrinkOnly ? `+ 🍶 ${name}` : `+ ${name}`;
          recChip.title = isFromDrinkOnly ? '주량 트래커에 등록된 멤버 추가' : '다른 차수 참석자 추가';
          recChip.addEventListener('click', () => {
            addAttendeeToRound(round.id, name);
          });
          recContainer.appendChild(recChip);
        });

        const heading = document.getElementById(`rec-title-${round.id}`);
        if (heading) {
          heading.textContent = '빠른 참석자 추가 (차수 & 주량 트래커 연동)';
          heading.style.display = 'block';
        }
      } else {
        const heading = document.getElementById(`rec-title-${round.id}`);
        if (heading) heading.style.display = 'none';
      }
    });
  }

  function renderRounds() {
    const activeElement = document.activeElement;
    let activeElementId = null;
    let activeRoundCardId = null;
    let activeInputCursorPos = 0;

    if (activeElement) {
      activeElementId = activeElement.id;
      const parentCard = activeElement.closest('.round-card');
      if (parentCard) {
        activeRoundCardId = parentCard.id;
        activeInputCursorPos = activeElement.selectionStart || 0;
      }
    }

    if (roundsCountBadge) {
      roundsCountBadge.textContent = `${state.rounds.length}개 차수`;
    }

    roundsContainer.innerHTML = '';

    state.rounds.forEach((round, index) => {
      const displayIndex = index + 1;
      const card = document.createElement('article');
      card.className = 'card round-card';
      card.id = `round-card-${round.id}`;

      const roundAttendees = getRoundAttendees(round.id);

      card.innerHTML = `
        <div class="round-header">
          <input type="text" id="round-name-${round.id}" class="round-title-input" value="${round.name}" placeholder="${displayIndex}차" title="차수 이름 편집">
          ${state.rounds.length > 1 ? `<button type="button" class="delete-round-btn" data-id="${round.id}">삭제</button>` : ''}
        </div>
        
        <div class="form-group">
          <label for="amount-${round.id}">지출 금액</label>
          <div class="input-unit-wrapper">
            <input type="number" id="amount-${round.id}" class="amount-input" min="0" step="1000" value="${round.amount || ''}" placeholder="0">
            <span class="input-unit">원</span>
          </div>
        </div>

        <div class="form-group">
          <label>참석자 명단 (${roundAttendees.length}명)</label>
          <div id="chips-container-${round.id}" class="chips-container"></div>
          
          <div class="attendee-input-wrapper">
            <input type="text" id="attendee-input-${round.id}" class="attendee-text-input" placeholder="이름 입력 후 엔터, 스페이스 또는 쉼표">
          </div>
          
          <div id="rec-title-${round.id}" class="recommend-title" style="display:none;">빠른 참석자 추가</div>
          <div id="recommendations-${round.id}" class="recommendations"></div>
        </div>
      `;

      roundsContainer.appendChild(card);

      // Listeners
      const nameInput = card.querySelector('.round-title-input');
      nameInput.addEventListener('input', (e) => {
        round.name = e.target.value || `${displayIndex}차`;
        calculateAndRenderResults();
      });

      const amountInput = card.querySelector('.amount-input');
      amountInput.addEventListener('input', (e) => {
        round.amount = parseInt(e.target.value) || 0;
        calculateAndRenderResults();
      });

      const attendeeInput = card.querySelector('.attendee-text-input');
      const processAttendeeInput = (inputVal) => {
        const names = inputVal.split(/[\s,]+/);
        names.forEach(name => {
          const trimmed = name.trim();
          if (trimmed) {
            addAttendeeToRound(round.id, trimmed);
          }
        });
        attendeeInput.value = '';
      };

      attendeeInput.addEventListener('keydown', (e) => {
        if (e.isComposing) return;
        if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
          e.preventDefault();
          processAttendeeInput(attendeeInput.value);
        }
      });

      attendeeInput.addEventListener('input', (e) => {
        const inputVal = e.target.value;
        if (/[\s,]/.test(inputVal)) {
          const words = inputVal.split(/[\s,]+/).filter(w => w.trim() !== '');
          if (words.length > 1 || /[\s,]$/.test(inputVal)) {
            processAttendeeInput(inputVal);
          }
        }
      });

      attendeeInput.addEventListener('blur', () => {
        processAttendeeInput(attendeeInput.value);
      });

      renderAttendeesChips(round.id);
    });

    renderAllRecommendations();

    // Preserve Focus
    if (activeRoundCardId) {
      if (activeElementId && activeElementId.startsWith('round-name-')) {
        const restoredNameInput = document.getElementById(activeElementId);
        if (restoredNameInput) {
          restoredNameInput.focus();
          restoredNameInput.setSelectionRange(activeInputCursorPos, activeInputCursorPos);
        }
      } else if (activeElementId && activeElementId.startsWith('amount-')) {
        const restoredAmountInput = document.getElementById(activeElementId);
        if (restoredAmountInput) restoredAmountInput.focus();
      } else {
        const restoredInput = document.querySelector(`#${activeRoundCardId} .attendee-text-input`);
        if (restoredInput) {
          restoredInput.focus();
          restoredInput.setSelectionRange(activeInputCursorPos, activeInputCursorPos);
        }
      }
    }

    document.querySelectorAll('.delete-round-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        deleteRound(id);
      });
    });
  }

  // Helper: Update Host (벙주) UI, Select Options & Benefit Banner
  function updateHostUI(attendeeTotals) {
    const allAttendees = getAllUniqueAttendees();

    // 1. If currently selected host is not in attendees, clear hostName
    if (state.hostName && !allAttendees.includes(state.hostName)) {
      state.hostName = '';
    }

    // 2. Update #host-select dropdown options
    if (hostSelect) {
      const currentVal = state.hostName;
      hostSelect.innerHTML = '<option value="">(벙주 미지정)</option>';
      allAttendees.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = `👑 ${name}`;
        if (name === currentVal) opt.selected = true;
        hostSelect.appendChild(opt);
      });
      hostSelect.value = state.hostName || '';
    }

    // 3. Update hostSupportFeeInput & Toggle Button
    if (hostSupportFeeInput) {
      hostSupportFeeInput.value = state.hostSupportFee || 0;
    }

    const isSupportActive = (state.hostSupportFee || 0) > 0;
    if (hostSupportToggleBtn) {
      if (isSupportActive) {
        hostSupportToggleBtn.classList.add('is-active');
        if (hostToggleBadge) {
          hostToggleBadge.textContent = 'ON';
        }
      } else {
        hostSupportToggleBtn.classList.remove('is-active');
        if (hostToggleBadge) {
          hostToggleBadge.textContent = 'OFF';
        }
      }
    }

    // 4. Update Quick Pills active class
    if (hostQuickPills) {
      hostQuickPills.forEach(pill => {
        const pillAmount = parseInt(pill.dataset.amount, 10);
        if (pillAmount === (state.hostSupportFee || 0)) {
          pill.classList.add('active');
        } else {
          pill.classList.remove('active');
        }
      });
    }

    // 5. Update Benefit Banner
    if (hostBenefitBanner) {
      const isHostActive = state.hostName && allAttendees.includes(state.hostName);
      if (isHostActive && state.hostSupportFee > 0 && attendeeTotals && attendeeTotals.length > 0) {
        const nonHostAttendees = attendeeTotals.filter(a => !a.isHost && a.rounds.length > 0);
        const nonHostCount = nonHostAttendees.length;
        const totalHostSupport = nonHostCount * state.hostSupportFee;
        const hostAttendee = attendeeTotals.find(a => a.isHost);
        const hostBase = hostAttendee ? hostAttendee.baseWithOpFee : 0;
        const hostFinal = hostAttendee ? hostAttendee.amount : 0;

        hostBenefitBanner.style.display = 'block';
        hostBenefitBanner.innerHTML = `
          👑 <strong>벙주 [${state.hostName}]</strong>님 지원 혜택 (옵션 A 적용):<br>
          참석자 ${nonHostCount}명 × ${formatMoney(state.hostSupportFee)}원 = <strong>총 ${formatMoney(totalHostSupport)}원 할인</strong>
          <span style="display:block; margin-top:2px; font-size:0.75rem; color:#fde68a;">
            (원래 본인 몫 ${formatMoney(hostBase)}원 → 지원 차감 후 최종 ${formatMoney(hostFinal)}원 결제)
          </span>
        `;
      } else {
        hostBenefitBanner.style.display = 'none';
      }
    }
  }

  // ==========================================================================
  // Core Calculation & Output
  // ==========================================================================

  function calculateAndRenderResults() {
    const roundDetails = [];
    const attendeeRoundCosts = {};
    const allAttendees = getAllUniqueAttendees();

    allAttendees.forEach(name => {
      attendeeRoundCosts[name] = [];
    });

    state.rounds.forEach((round, index) => {
      const displayIndex = index + 1;
      const roundAttendees = getRoundAttendees(round.id);
      const count = roundAttendees.length;
      let costPerPerson = 0;

      if (count > 0) {
        costPerPerson = applyRounding(round.amount / count, state.roundRule);
      }

      roundDetails.push({
        id: round.id,
        name: round.name || `${displayIndex}차`,
        amount: round.amount,
        count: count,
        costPerPerson: costPerPerson,
        attendees: [...roundAttendees]
      });

      roundAttendees.forEach(name => {
        if (attendeeRoundCosts[name]) {
          attendeeRoundCosts[name].push({
            roundName: round.name || `${displayIndex}차`,
            roundIndex: index,
            cost: costPerPerson
          });
        }
      });
    });

    // 2. Aggregate final totals per attendee
    const isHostActive = !!(state.hostName && allAttendees.includes(state.hostName));
    const hostFee = state.hostSupportFee || 0;

    // 벙주는 기본 입금 완료 처리 (호스트가 직접 정산/수금 관리하므로)
    if (isHostActive) {
      state.paidAttendees[state.hostName] = true;
    }

    const attendeeTotals = [];
    allAttendees.forEach(name => {
      const sortedParticipation = attendeeRoundCosts[name].sort((a, b) => a.roundIndex - b.roundIndex);
      const roundsNames = sortedParticipation.map(item => item.roundName);

      const subtotal = attendeeRoundCosts[name].reduce((acc, curr) => acc + curr.cost, 0);
      const baseWithOpFee = subtotal + (roundsNames.length > 0 ? state.operatingFee : 0);

      attendeeTotals.push({
        name: name,
        rounds: roundsNames,
        originalIndices: sortedParticipation.map(item => item.roundIndex),
        subtotal: subtotal,
        baseWithOpFee: baseWithOpFee,
        amount: baseWithOpFee,
        isHost: (name === state.hostName),
        hostDiscount: 0,
        hostSupportPaid: 0
      });
    });

    // Apply Host Support (Option A: Host Discount)
    if (isHostActive && hostFee > 0) {
      const nonHostAttendees = attendeeTotals.filter(a => !a.isHost && a.rounds.length > 0);
      const nonHostCount = nonHostAttendees.length;
      const totalHostSupport = nonHostCount * hostFee;

      // 1. Each non-host attendee pays hostFee once (across all rounds)
      nonHostAttendees.forEach(a => {
        a.hostSupportPaid = hostFee;
        a.amount = a.baseWithOpFee + hostFee;
      });

      // 2. Host gets totalHostSupport deducted from their own bill
      const hostAttendee = attendeeTotals.find(a => a.isHost);
      if (hostAttendee) {
        hostAttendee.hostDiscount = totalHostSupport;
        const discounted = hostAttendee.baseWithOpFee - totalHostSupport;
        hostAttendee.amount = Math.max(0, discounted);
        hostAttendee.excessSupport = discounted < 0 ? Math.abs(discounted) : 0;
      }
    }

    latestAttendeeTotals = attendeeTotals;

    // 3. Group by (Rounds list pattern + Total amount)
    // Separate Host from Non-hosts so Host line is uniquely highlighted
    const groups = {};
    attendeeTotals.forEach(item => {
      const roundsText = item.rounds.join(' + ');
      const groupKey = item.isHost ? `HOST_${roundsText}_${item.amount}` : `NORM_${roundsText}_${item.amount}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          isHost: item.isHost,
          hostDiscount: item.hostDiscount,
          roundsText: roundsText,
          amount: item.amount,
          indicesKey: item.originalIndices.join(','),
          names: []
        };
      }
      groups[groupKey].names.push(item.name);
    });

    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      const groupA = groups[a];
      const groupB = groups[b];

      const lenA = groupA.roundsText ? groupA.roundsText.split('+').length : 0;
      const lenB = groupB.roundsText ? groupB.roundsText.split('+').length : 0;

      if (lenA !== lenB) {
        return lenA - lenB;
      }

      if (groupA.indicesKey !== groupB.indicesKey) {
        return groupA.indicesKey.localeCompare(groupB.indicesKey);
      }

      if (groupA.isHost !== groupB.isHost) {
        return groupA.isHost ? 1 : -1;
      }

      return groupA.amount - groupB.amount;
    });

    // 4. Build output template text
    let outputText = '';
    const isSingleRound = roundDetails.length === 1;

    if (isSingleRound && (!isHostActive || hostFee === 0)) {
      const detail = roundDetails[0];
      outputText += `${detail.name}\n`;
      outputText += `${detail.attendees.join(' ')}\n`;

      if (state.operatingFee > 0) {
        const totalPerPerson = detail.costPerPerson + state.operatingFee;
        outputText += `${detail.amount}/${detail.count} = ${formatMoney(detail.costPerPerson)} (+운영비 ${formatMoney(state.operatingFee)} = ${formatMoney(totalPerPerson)})\n`;
      } else {
        outputText += `${detail.amount}/${detail.count} = ${formatMoney(detail.costPerPerson)}\n`;
      }
    } else {
      roundDetails.forEach(detail => {
        outputText += `${detail.name}\n`;
        outputText += `${detail.attendees.map(n => (isHostActive && n === state.hostName) ? `${n}(👑)` : n).join(' ')}\n`;
        outputText += `${detail.amount}/${detail.count} = ${formatMoney(detail.costPerPerson)}\n\n`;
      });

      if (state.operatingFee > 0) {
        outputText += `(※ 1인당 운영비 ${formatMoney(state.operatingFee)}원이 1회 포함된 결과입니다.)\n`;
      }

      if (isHostActive && hostFee > 0) {
        const nonHostCount = attendeeTotals.filter(a => !a.isHost && a.rounds.length > 0).length;
        const totalHostSupport = nonHostCount * hostFee;
        outputText += `(※ 👑 벙주 지원: 1인당 +${formatMoney(hostFee)}원 / 👑 ${state.hostName}님 -${formatMoney(totalHostSupport)}원 할인 적용)\n`;
      }

      if (state.operatingFee > 0 || (isHostActive && hostFee > 0)) {
        outputText += '\n';
      }

      sortedGroupKeys.forEach(key => {
        const group = groups[key];
        if (group.names.length > 0) {
          if (group.isHost) {
            outputText += `👑 벙주(${group.roundsText}): ${group.names.join(' ')} = ${formatMoney(group.amount)}${group.hostDiscount > 0 ? ` (${formatMoney(group.hostDiscount)}원 지원 할인)` : ''}\n`;
          } else {
            outputText += `${group.roundsText}: ${group.names.join(' ')} = ${formatMoney(group.amount)}\n`;
          }
        }
      });
    }

    if (state.bankInfo.trim()) {
      outputText += `\n${state.bankInfo.trim()}`;
    }

    // Sync round attendees into Drink Tracker
    ensureDrinkTrackerMembersSynced(allAttendees);

    // Append Drink Report if enabled and at least one shot was recorded
    if (state.drinkTracker && state.drinkTracker.includeInReceipt) {
      const drinkSummaryBlock = buildDrinkReportSummaryText(true);
      if (drinkSummaryBlock) {
        outputText += `\n\n${drinkSummaryBlock}`;
      }
    }

    resultTextElement.textContent = outputText.trim();

    // 5. Update Payment Tracker Card, Host UI, Drink Tracker & Save
    renderPaymentTracker(latestAttendeeTotals);
    updateHostUI(latestAttendeeTotals);
    updateDrinkReceiptToggleUI();
    renderDrinkTracker();
    updateWorkspaceTabBadges();
    saveCurrentStateToLocalStorage();
  }

  // ==========================================================================
  // Payment Tracker
  // ==========================================================================

  function renderPaymentTracker(attendeeTotals) {
    if (!paymentTrackerCard) return;

    if (!attendeeTotals || attendeeTotals.length === 0) {
      paymentTrackerCard.style.display = 'none';
      return;
    }

    paymentTrackerCard.style.display = 'block';

    const totalCount = attendeeTotals.length;
    const paidCount = attendeeTotals.filter(a => state.paidAttendees[a.name]).length;
    const unpaidTotal = attendeeTotals
      .filter(a => !state.paidAttendees[a.name])
      .reduce((sum, a) => sum + a.amount, 0);

    const rate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

    paymentRateBadge.textContent = `${rate}%`;
    if (rate === 100) {
      paymentRateBadge.classList.add('all-completed');
    } else {
      paymentRateBadge.classList.remove('all-completed');
    }

    progressBarFill.style.width = `${rate}%`;
    paymentCountStat.textContent = `입금 ${paidCount} / ${totalCount}명`;

    if (unpaidTotal === 0) {
      unpaidAmountStat.textContent = '전원 입금 완료! 🎉';
      unpaidAmountStat.classList.add('all-zero');
    } else {
      unpaidAmountStat.textContent = `남은 미수금: ${formatMoney(unpaidTotal)}원`;
      unpaidAmountStat.classList.remove('all-zero');
    }

    paymentMembersList.innerHTML = '';
    attendeeTotals.forEach(member => {
      const isHost = member.name === state.hostName;
      const isPaid = !!state.paidAttendees[member.name];
      const item = document.createElement('div');
      item.className = `payment-member-item ${isPaid ? 'status-paid' : 'status-unpaid'} ${isHost ? 'is-host-item' : ''}`;
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `${member.name} 입금 상태: ${isPaid ? '입금 완료' : '미입금'}`);

      const initial = isHost ? '👑' : member.name.charAt(0);

      item.innerHTML = `
        <div class="member-item-top">
          <div class="member-name-wrap">
            <span class="member-avatar ${isHost ? 'host-avatar' : ''}">${initial}</span>
            <span class="member-name">${member.name}</span>
          </div>
          <span class="member-status-badge">${isPaid ? '완료' : '미입금'}</span>
        </div>
        <div class="member-amount-row">
          <span class="member-amount">${formatMoney(member.amount)}원</span>
          ${isHost ? '<span class="host-tag-mini">👑 벙주</span>' : ''}
        </div>
      `;

      const toggleStatus = () => {
        state.paidAttendees[member.name] = !isPaid;
        saveCurrentStateToLocalStorage();
        renderPaymentTracker(latestAttendeeTotals);
      };

      item.addEventListener('click', toggleStatus);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleStatus();
        }
      });

      paymentMembersList.appendChild(item);
    });
  }

  // ==========================================================================
  // History Board System (이전 정산 내역 보관함)
  // ==========================================================================

  function openHistoryDrawer() {
    renderHistoryList();
    historyDrawer.classList.add('open');
    historyBackdrop.classList.add('open');
  }

  function closeHistoryDrawer() {
    historyDrawer.classList.remove('open');
    historyBackdrop.classList.remove('open');
  }

  let expandedHistoryMeetingIds = new Set();

  function saveCurrentBungToHistory() {
    const title = meetingTitleInput.value.trim() || state.meetingTitle || getDefaultMeetingTitle();
    state.meetingTitle = title;

    // Calculate metrics
    const totalAmount = state.rounds.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalAttendeesCount = latestAttendeeTotals.length;
    const paidCount = latestAttendeeTotals.filter(a => state.paidAttendees[a.name]).length;
    const formattedResultText = resultTextElement.textContent;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let historyList = getHistoryList();

    if (!state.meetingId) {
      state.meetingId = 'bung_' + Date.now();
    }

    const newRecord = {
      id: state.meetingId,
      title: title,
      savedAt: formattedDate,
      rounds: JSON.parse(JSON.stringify(state.rounds)),
      operatingFee: state.operatingFee,
      hostName: state.hostName,
      hostSupportFee: state.hostSupportFee,
      roundRule: state.roundRule,
      bankInfo: state.bankInfo,
      paidAttendees: JSON.parse(JSON.stringify(state.paidAttendees)),
      attendeeTotals: JSON.parse(JSON.stringify(latestAttendeeTotals)),
      drinkTracker: JSON.parse(JSON.stringify(state.drinkTracker || createDefaultDrinkTrackerState())),
      totalAmount: totalAmount,
      totalAttendeesCount: totalAttendeesCount,
      paidCount: paidCount,
      formattedResultText: formattedResultText
    };

    // Replace if exists, or insert at top
    const existingIndex = historyList.findIndex(item => item.id === state.meetingId);
    if (existingIndex !== -1) {
      historyList[existingIndex] = newRecord;
    } else {
      historyList.unshift(newRecord);
    }

    saveHistoryList(historyList);
    updateMemberEncyclopediaFromRecord(newRecord);

    // 1. Reset main screen to blank state for next meeting
    initFirstRound(false);

    // 2. Alert user
    showToastMessage(`'${title}' 정산 및 주량 기록이 보관함에 저장되었습니다! ✨`);
  }

  function renderHistoryList() {
    const historyList = getHistoryList();
    historyListElement.innerHTML = '';

    if (historyList.length === 0) {
      historyListElement.innerHTML = `
        <div class="history-empty">
          <span class="history-empty-icon">📂</span>
          <p class="history-empty-text">저장된 이전 정산 내역이 없습니다.<br>'현재 정산 내역 저장' 버튼을 눌러 모임을 저장해 보세요!</p>
        </div>
      `;
      return;
    }

    historyList.forEach(record => {
      const card = document.createElement('div');
      card.className = 'history-card';
      card.id = `history-card-${record.id}`;

      const attendees = record.attendeeTotals || [];
      const currentPaidCount = attendees.filter(a => record.paidAttendees && record.paidAttendees[a.name]).length;
      const unpaidAttendees = attendees.filter(a => !record.paidAttendees || !record.paidAttendees[a.name]);
      const unpaidTotal = unpaidAttendees.reduce((sum, a) => sum + a.amount, 0);

      const isAllPaid = attendees.length > 0 && currentPaidCount === attendees.length;
      const rate = attendees.length > 0 ? Math.round((currentPaidCount / attendees.length) * 100) : 0;
      const isExpanded = expandedHistoryMeetingIds.has(record.id);

      // Calculate drink summary if present
      let historyDrinkPill = '';
      if (record.drinkTracker && record.drinkTracker.members) {
        const spb = record.drinkTracker.shotsPerBottle || 8;
        const totalShots = Object.values(record.drinkTracker.members).reduce((acc, m) => acc + (m.shots || 0), 0);
        if (totalShots > 0) {
          historyDrinkPill = `<span class="history-meta-pill pill-paid">🍶 총 ${formatBottlesAndShots(totalShots, spb)}</span>`;
        }
      }

      card.innerHTML = `
        <div class="history-card-header">
          <div>
            <h3 class="history-card-title">${record.title}</h3>
            <div class="history-card-date">${record.savedAt}</div>
          </div>
        </div>

        <div class="history-meta-row">
          <span class="history-meta-pill">${record.rounds.length}개 차수</span>
          <span class="history-meta-pill">${attendees.length}명 참석</span>
          ${historyDrinkPill}
          <span class="history-meta-pill ${isAllPaid ? 'pill-paid' : 'pill-unpaid'}">
            ${isAllPaid ? '전원 입금 완료 🎉' : `입금 ${currentPaidCount}/${attendees.length}명 (${rate}%)`}
          </span>
        </div>

        <div class="history-summary-row">
          <span class="history-summary-label">총 정산 금액</span>
          <span class="history-total-amt">${formatMoney(record.totalAmount)}원</span>
        </div>

        <div class="history-actions-row">
          <button type="button" class="btn-history-manage ${isExpanded ? 'active' : ''}" data-id="${record.id}">
            <span>입금 관리</span>
            <span class="arrow">${isExpanded ? '▴' : '▾'}</span>
          </button>
          <button type="button" class="btn-history-load" data-id="${record.id}">불러오기</button>
          <button type="button" class="btn-history-copy" data-id="${record.id}">카톡 복사</button>
          <button type="button" class="btn-history-delete" data-id="${record.id}">삭제</button>
        </div>

        <!-- Inline Payment Management Accordion Panel -->
        <div class="history-payment-panel ${isExpanded ? 'open' : ''}" id="history-panel-${record.id}">
          <div class="history-panel-header">
            <span>참석자 입금 체크 (${currentPaidCount}/${attendees.length}명)</span>
            <span style="color: ${unpaidTotal === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'};">
              ${unpaidTotal === 0 ? '미수금 없음' : `남은 미수금: ${formatMoney(unpaidTotal)}원`}
            </span>
          </div>

          <div class="history-members-grid">
            ${attendees.map(member => {
              const isPaid = !!(record.paidAttendees && record.paidAttendees[member.name]);
              return `
                <div class="history-member-item ${isPaid ? 'status-paid' : 'status-unpaid'}" data-meeting-id="${record.id}" data-member-name="${member.name}">
                  <div class="history-mem-info">
                    <span class="history-mem-name">${member.name}</span>
                    <span class="history-mem-amt">${formatMoney(member.amount)}원</span>
                  </div>
                  <span class="history-mem-badge">${isPaid ? '완료' : '미입금'}</span>
                </div>
              `;
            }).join('')}
          </div>

          ${unpaidAttendees.length > 0 ? `
            <button type="button" class="btn-history-unpaid-copy" data-id="${record.id}">
              <svg class="btn-icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span>미입금자 독촉 카톡 복사 (${unpaidAttendees.length}명)</span>
            </button>
          ` : ''}
        </div>
      `;

      // Button Handlers
      const manageBtn = card.querySelector('.btn-history-manage');
      manageBtn.addEventListener('click', () => {
        if (expandedHistoryMeetingIds.has(record.id)) {
          expandedHistoryMeetingIds.delete(record.id);
        } else {
          expandedHistoryMeetingIds.add(record.id);
        }
        renderHistoryList();
      });

      const loadBtn = card.querySelector('.btn-history-load');
      loadBtn.addEventListener('click', () => {
        loadHistoryRecord(record.id);
      });

      const copyRecordBtn = card.querySelector('.btn-history-copy');
      copyRecordBtn.addEventListener('click', () => {
        copyTextToClipboard(record.formattedResultText, `'${record.title}' 정산 텍스트가 복사되었습니다!`);
      });

      const deleteRecordBtn = card.querySelector('.btn-history-delete');
      deleteRecordBtn.addEventListener('click', () => {
        if (confirm(`'${record.title}' 정산 내역을 정말 삭제하시겠습니까?`)) {
          deleteHistoryRecord(record.id);
        }
      });

      // Member click handlers in history panel
      card.querySelectorAll('.history-member-item').forEach(item => {
        item.addEventListener('click', () => {
          const meetingId = item.dataset.meetingId;
          const memberName = item.dataset.memberName;
          toggleHistoryMemberPaid(meetingId, memberName);
        });
      });

      // Unpaid copy in history panel
      const unpaidCopyBtn = card.querySelector('.btn-history-unpaid-copy');
      if (unpaidCopyBtn) {
        unpaidCopyBtn.addEventListener('click', () => {
          copyHistoryUnpaidText(record);
        });
      }

      historyListElement.appendChild(card);
    });
  }

  function toggleHistoryMemberPaid(meetingId, memberName) {
    let historyList = getHistoryList();
    const record = historyList.find(m => m.id === meetingId);
    if (!record) return;

    if (!record.paidAttendees) record.paidAttendees = {};
    const currentStatus = !!record.paidAttendees[memberName];
    record.paidAttendees[memberName] = !currentStatus;

    saveHistoryList(historyList);
    renderHistoryList();

    // If currently editing this record in main screen, sync it too
    if (state.meetingId === meetingId) {
      state.paidAttendees = JSON.parse(JSON.stringify(record.paidAttendees));
      calculateAndRenderResults();
    }
  }

  function copyHistoryUnpaidText(record) {
    const attendees = record.attendeeTotals || [];
    const unpaidList = attendees.filter(a => !record.paidAttendees || !record.paidAttendees[a.name]);

    if (unpaidList.length === 0) {
      showToastMessage('모든 인원이 입금을 완료했습니다! 🎉');
      return;
    }

    let text = `[${record.title} 미입금 안내 🚨]\n아직 입금 안 하신 분들은 입금 부탁드립니다!\n\n`;
    unpaidList.forEach(member => {
      text += `${member.name} = ${formatMoney(member.amount)}원\n`;
    });

    if (record.bankInfo && record.bankInfo.trim()) {
      text += `\n${record.bankInfo.trim()}`;
    }

    copyTextToClipboard(text, `'${record.title}' 미입금자 안내 텍스트가 복사되었습니다!`);
  }

  function loadHistoryRecord(id) {
    const historyList = getHistoryList();
    const record = historyList.find(item => item.id === id);
    if (!record) return;

    state.meetingId = record.id;
    state.meetingTitle = record.title;
    state.rounds = JSON.parse(JSON.stringify(record.rounds));
    state.operatingFee = record.operatingFee || 0;
    state.hostName = record.hostName || '';
    state.hostSupportFee = record.hostSupportFee || 0;
    state.roundRule = record.roundRule || 'floor';
    state.bankInfo = record.bankInfo || '기업은행 425-016501-01-019 ㄱㅅㅎ';
    state.paidAttendees = JSON.parse(JSON.stringify(record.paidAttendees || {}));
    state.drinkTracker = Object.assign(
      createDefaultDrinkTrackerState(),
      record.drinkTracker ? JSON.parse(JSON.stringify(record.drinkTracker)) : {}
    );
    state.nextRoundId = Math.max(...state.rounds.map(r => r.id), 0) + 1;

    // Sync input fields
    meetingTitleInput.value = state.meetingTitle;
    bankInfoInput.value = state.bankInfo;
    operatingFeeInput.value = state.operatingFee;
    if (hostSupportFeeInput) hostSupportFeeInput.value = state.hostSupportFee;
    roundRuleSelect.value = state.roundRule;
    if (shotsPerBottleSelect) shotsPerBottleSelect.value = String(state.drinkTracker.shotsPerBottle || 8);
    if (autoSyncRound1Checkbox) autoSyncRound1Checkbox.checked = state.drinkTracker.autoSyncToFirstRound !== false;

    renderRounds();
    calculateAndRenderResults();
    closeHistoryDrawer();

    showToastMessage(`'${record.title}' 내역을 불러왔습니다! ⚡`);
  }

  function deleteHistoryRecord(id) {
    let historyList = getHistoryList();
    historyList = historyList.filter(item => item.id !== id);
    saveHistoryList(historyList);
    renderHistoryList();
    renderMemberHallOfFame();

    // If currently editing this record, unlink id
    if (state.meetingId === id) {
      state.meetingId = null;
      saveCurrentStateToLocalStorage();
    }

    showToastMessage('해당 기록이 삭제되었습니다.');
  }

  function startNewMeeting() {
    if (confirm('현재 작업을 비우고 새로운 벙 정산을 시작하시겠습니까?\n(보관함에 저장해 둔 이전 내역은 언제든 다시 불러올 수 있습니다)')) {
      initFirstRound(false);
      showToastMessage('새로운 벙 정산이 시작되었습니다! ✨');
    }
  }

  // ==========================================================================
  // Workspace Tab Switching & Soju Drink Tracker System
  // ==========================================================================

  function switchWorkspaceTab(tabName) {
    state.activeTab = (tabName === 'drink') ? 'drink' : 'settlement';
    const isDrink = state.activeTab === 'drink';

    if (tabItemSettlement) tabItemSettlement.classList.toggle('active', !isDrink);
    if (tabItemDrink) tabItemDrink.classList.toggle('active', isDrink);
    if (tabBtnSettlement) tabBtnSettlement.setAttribute('aria-selected', String(!isDrink));
    if (tabBtnDrink) tabBtnDrink.setAttribute('aria-selected', String(isDrink));

    if (panelSettlement) panelSettlement.hidden = isDrink;
    if (panelDrink) panelDrink.hidden = !isDrink;

    if (isDrink) {
      renderDrinkTracker();
    } else {
      renderRounds();
      calculateAndRenderResults();
    }
    saveCurrentStateToLocalStorage();
  }

  function formatShotCount(shots) {
    if (Number.isInteger(shots)) return `${shots}`;
    return shots.toFixed(1).replace(/\.0$/, '');
  }

  function formatBottlesAndShots(shots, shotsPerBottle = 8) {
    const cleanShots = Math.max(0, Number(shots) || 0);
    const spb = Math.max(1, parseInt(shotsPerBottle, 10) || 8);
    const bottles = Math.floor(cleanShots / spb);
    const remShots = Number((cleanShots - bottles * spb).toFixed(1));

    if (bottles === 0) {
      return `${formatShotCount(remShots)}잔`;
    }
    if (remShots === 0) {
      return `${bottles}병`;
    }
    return `${bottles}병 ${formatShotCount(remShots)}잔`;
  }

  function ensureDrinkTrackerMembersSynced(roundAttendees) {
    if (!state.drinkTracker) {
      state.drinkTracker = createDefaultDrinkTrackerState();
    }
    if (!state.drinkTracker.members) {
      state.drinkTracker.members = {};
    }
    const attendees = roundAttendees || getAllUniqueAttendees();
    attendees.forEach(name => {
      const trimmed = name.trim();
      if (trimmed && !state.drinkTracker.members[trimmed]) {
        state.drinkTracker.members[trimmed] = {
          shots: 0,
          updatedAt: Date.now()
        };
      }
    });
  }

  function updateWorkspaceTabBadges() {
    const uniqueRoundAttendees = getAllUniqueAttendees();
    const drinkMembers = state.drinkTracker && state.drinkTracker.members ? Object.keys(state.drinkTracker.members) : [];
    const allCount = new Set([...uniqueRoundAttendees, ...drinkMembers]).size;

    if (settlementTabBadge) {
      settlementTabBadge.textContent = `${uniqueRoundAttendees.length || allCount}명`;
    }

    if (drinkTabBadge && state.drinkTracker && state.drinkTracker.members) {
      const spb = state.drinkTracker.shotsPerBottle || 8;
      const totalShots = Object.values(state.drinkTracker.members).reduce((acc, m) => acc + (m.shots || 0), 0);
      const bottles = Math.floor(totalShots / spb);
      const rem = Number((totalShots - bottles * spb).toFixed(1));
      drinkTabBadge.textContent = `${bottles}병 ${formatShotCount(rem)}잔`;
    }
  }

  function updateDrinkReceiptToggleUI() {
    if (!toggleDrinkReceiptBtn || !drinkReceiptBadge) return;
    const isOn = !!(state.drinkTracker && state.drinkTracker.includeInReceipt);
    toggleDrinkReceiptBtn.classList.toggle('is-active', isOn);
    drinkReceiptBadge.textContent = isOn ? 'ON' : 'OFF';
  }

  function addMemberFromDrinkTracker(rawInput) {
    if (!rawInput || typeof rawInput !== 'string') return;
    const names = rawInput.split(/[\s,]+/).map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return;

    if (!state.drinkTracker.members) state.drinkTracker.members = {};
    let addedCount = 0;

    names.forEach(name => {
      if (!state.drinkTracker.members[name]) {
        state.drinkTracker.members[name] = {
          shots: 0,
          updatedAt: Date.now()
        };
        addedCount++;
      }

      // If autoSyncToFirstRound is enabled, also add to 1st round in settlement calculator
      if (state.drinkTracker.autoSyncToFirstRound && state.rounds.length > 0) {
        const firstRound = state.rounds[0];
        const currentFirstRoundAttendees = getRoundAttendees(firstRound.id);
        if (!currentFirstRoundAttendees.includes(name)) {
          firstRound.removedAttendees = firstRound.removedAttendees.filter(n => n !== name);
          if (!firstRound.addedAttendees.includes(name)) {
            firstRound.addedAttendees.push(name);
          }
        }
      }
    });

    renderRounds();
    calculateAndRenderResults();
    if (addedCount > 0) {
      showToastMessage(
        state.drinkTracker.autoSyncToFirstRound
          ? `${names.join(', ')}님이 주량 트래커 및 1차 정산에 추가되었습니다! 🍶`
          : `${names.join(', ')}님이 주량 트래커에 추가되었습니다! 🍶`
      );
    }
  }

  function syncDrinkMembersToSettlementRounds() {
    const drinkMemberNames = state.drinkTracker && state.drinkTracker.members
      ? Object.keys(state.drinkTracker.members)
      : [];

    if (drinkMemberNames.length === 0) {
      showToastMessage('주량 트래커에 등록된 인원이 없습니다.');
      return;
    }

    if (state.rounds.length === 0) {
      initFirstRound(true);
    }

    const firstRound = state.rounds[0];
    const currentAttendees = getRoundAttendees(firstRound.id);
    let newlySynced = 0;

    drinkMemberNames.forEach(name => {
      if (!currentAttendees.includes(name)) {
        firstRound.removedAttendees = firstRound.removedAttendees.filter(n => n !== name);
        if (!firstRound.addedAttendees.includes(name)) {
          firstRound.addedAttendees.push(name);
          newlySynced++;
        }
      }
    });

    renderRounds();
    calculateAndRenderResults();

    if (newlySynced > 0) {
      showToastMessage(`주량 트래커 인원 ${newlySynced}명을 [${firstRound.name}] 정산 명단에 연동했습니다! ⚡`);
    } else {
      showToastMessage(`이미 모든 인원(${drinkMemberNames.length}명)이 정산 차수에 연동되어 있습니다! ✅`);
    }
  }

  let milestoneBannerTimer = null;

  function triggerBottleMilestone(name, bottleCount, totalShots, shotsPerBottle) {
    if (!bottleMilestoneBanner) return;

    // Haptic vibration on mobile if supported
    if (navigator.vibrate) {
      try {
        navigator.vibrate([120, 60, 160]);
      } catch (e) {}
    }

    let emoji = '🍾';
    let tag = `SOJU ${bottleCount} BOTTLE MILESTONE!`;
    let title = `🎉 ${name}님 소주 ${bottleCount}병(${formatShotCount(totalShots)}잔) 돌파!`;
    let desc = '기분 좋은 1병 달성! 중간에 물도 한 잔씩 마셔주세요 💧';

    if (bottleCount === 2) {
      emoji = '🔥';
      title = `🔥 ${name}님 소주 2병(${formatShotCount(totalShots)}잔) 돌파!`;
      desc = '오늘 텐션 최고조! 주당의 품격을 보여주고 계십니다 🍶';
    } else if (bottleCount >= 3) {
      emoji = '👑';
      title = `👑 전설의 주신! ${name}님 ${bottleCount}병(${formatShotCount(totalShots)}잔) 돌파!`;
      desc = `오늘 벙의 살아있는 전설입니다! 안주와 수분 섭취 필수 🚨`;
    }

    if (milestoneEmoji) milestoneEmoji.textContent = emoji;
    if (milestoneTag) milestoneTag.textContent = tag;
    if (milestoneTitle) milestoneTitle.textContent = title;
    if (milestoneDesc) milestoneDesc.textContent = desc;

    bottleMilestoneBanner.classList.add('show');
    bottleMilestoneBanner.setAttribute('aria-hidden', 'false');

    clearTimeout(milestoneBannerTimer);
    milestoneBannerTimer = setTimeout(() => {
      hideBottleMilestoneBanner();
    }, 4500);
  }

  function hideBottleMilestoneBanner() {
    if (!bottleMilestoneBanner) return;
    bottleMilestoneBanner.classList.remove('show');
    bottleMilestoneBanner.setAttribute('aria-hidden', 'true');
  }

  function addDrinkShots(name, delta) {
    if (!state.drinkTracker.members[name]) {
      state.drinkTracker.members[name] = { shots: 0, updatedAt: Date.now() };
    }

    const spb = state.drinkTracker.shotsPerBottle || 8;
    const prevShots = state.drinkTracker.members[name].shots || 0;
    const nextShots = Math.max(0, Number((prevShots + delta).toFixed(1)));

    if (nextShots === prevShots) return;

    const prevBottles = Math.floor(prevShots / spb);
    const nextBottles = Math.floor(nextShots / spb);
    const crossedMilestone = delta > 0 && nextBottles > prevBottles && nextBottles >= 1;

    state.drinkTracker.members[name].shots = nextShots;
    state.drinkTracker.members[name].updatedAt = Date.now();

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    state.drinkTracker.logs.unshift({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: name,
      delta: delta,
      prevShots: prevShots,
      totalShots: nextShots,
      timestamp: timeStr,
      isMilestone: crossedMilestone,
      bottleNum: crossedMilestone ? nextBottles : 0
    });

    // Keep latest 40 logs
    if (state.drinkTracker.logs.length > 40) {
      state.drinkTracker.logs = state.drinkTracker.logs.slice(0, 40);
    }

    if (crossedMilestone) {
      triggerBottleMilestone(name, nextBottles, nextShots, spb);
    }

    calculateAndRenderResults();
  }

  function undoLastDrinkShot() {
    if (!state.drinkTracker || !Array.isArray(state.drinkTracker.logs) || state.drinkTracker.logs.length === 0) {
      return;
    }

    const lastLog = state.drinkTracker.logs.shift();
    if (lastLog && state.drinkTracker.members[lastLog.name]) {
      state.drinkTracker.members[lastLog.name].shots = Math.max(0, Number((lastLog.prevShots || 0).toFixed(1)));
      showToastMessage(`${lastLog.name}님의 방금 기록을 취소했습니다 (${formatShotCount(state.drinkTracker.members[lastLog.name].shots)}잔)`);
    }

    calculateAndRenderResults();
  }

  function removeDrinkMember(name) {
    if (!state.drinkTracker || !state.drinkTracker.members[name]) return;
    const uniqueRoundAttendees = getAllUniqueAttendees();
    if (uniqueRoundAttendees.includes(name)) {
      if (!confirm(`'${name}'님은 현재 정산 차수에도 포함되어 있습니다.\n주량 트래커와 정산 차수 모두에서 제외할까요?`)) {
        return;
      }
      state.rounds.forEach(r => {
        r.addedAttendees = r.addedAttendees.filter(n => n !== name);
        if (!r.removedAttendees.includes(name)) {
          r.removedAttendees.push(name);
        }
      });
    }
    delete state.drinkTracker.members[name];
    renderRounds();
    calculateAndRenderResults();
  }

  function buildDrinkReportSummaryText(isCompactForReceipt = false) {
    if (!state.drinkTracker || !state.drinkTracker.members) return '';

    const spb = state.drinkTracker.shotsPerBottle || 8;
    const entries = Object.entries(state.drinkTracker.members)
      .map(([name, info]) => ({ name, shots: Number(info.shots) || 0 }))
      .sort((a, b) => b.shots - a.shots || a.name.localeCompare(b.name, 'ko'));

    const totalShots = entries.reduce((sum, item) => sum + item.shots, 0);
    const activeDrinkers = entries.filter(item => item.shots > 0);

    if (isCompactForReceipt && totalShots === 0) {
      return '';
    }

    if (entries.length === 0 || totalShots === 0) {
      return `[🍶 ${state.meetingTitle} 음주 리포트]\n아직 기록된 소주 잔 수가 없습니다.\n술자리에서 [+1잔 마심!] 버튼을 눌러 주량을 체크해 보세요!`;
    }

    const maxShots = activeDrinkers.length > 0 ? activeDrinkers[0].shots : 0;
    const mvpNames = activeDrinkers.filter(d => d.shots === maxShots).map(d => d.name);

    let text = `[🍶 오늘의 주량 리포트 (총 ${formatBottlesAndShots(totalShots, spb)} / ${formatShotCount(totalShots)}잔)]\n`;
    if (mvpNames.length > 0 && maxShots > 0) {
      text += `🏆 오늘의 주당 MVP: ${mvpNames.join(', ')} (${formatBottlesAndShots(maxShots, spb)})\n`;
    }

    activeDrinkers.forEach(item => {
      const bottles = Math.floor(item.shots / spb);
      const fireTag = bottles >= 2 ? ' 🔥' : (bottles === 1 ? ' 🍾' : '');
      text += `• ${item.name}: ${formatBottlesAndShots(item.shots, spb)} (${formatShotCount(item.shots)}잔)${fireTag}\n`;
    });

    const nonDrinkers = entries.filter(item => item.shots === 0).map(i => i.name);
    if (!isCompactForReceipt && nonDrinkers.length > 0) {
      text += `• 비음주/0잔: ${nonDrinkers.join(', ')}\n`;
    }

    text += `(※ 1병 = ${spb}잔 기준)`;
    return text.trim();
  }

  // ==========================================================================
  // Member Drinking Encyclopedia / Cumulative LocalStorage DB
  // ==========================================================================

  function updateMemberEncyclopediaFromRecord(record) {
    try {
      const raw = localStorage.getItem(MEMBER_PROFILES_KEY);
      const profiles = raw ? JSON.parse(raw) : {};

      const spb = (record.drinkTracker && record.drinkTracker.shotsPerBottle) || 8;
      const drinkMembers = (record.drinkTracker && record.drinkTracker.members) || {};
      const attendeeNames = new Set([
        ...(record.attendeeTotals || []).map(a => a.name),
        ...Object.keys(drinkMembers)
      ]);

      attendeeNames.forEach(name => {
        if (!profiles[name]) {
          profiles[name] = {
            name: name,
            lastSeenAt: record.savedAt
          };
        } else {
          profiles[name].lastSeenAt = record.savedAt;
        }
      });

      localStorage.setItem(MEMBER_PROFILES_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.warn('Update member encyclopedia failed:', e);
    }
  }

  function getAggregatedMemberEncyclopedia() {
    const historyList = getHistoryList();
    const map = {};

    // Also include saved profile names if any
    try {
      const raw = localStorage.getItem(MEMBER_PROFILES_KEY);
      const savedProfiles = raw ? JSON.parse(raw) : {};
      Object.keys(savedProfiles).forEach(name => {
        map[name] = {
          name: name,
          meetingsCount: 0,
          drinkSessionsCount: 0,
          totalShots: 0,
          maxShotsInOneMeeting: 0,
          lastSeenAt: savedProfiles[name].lastSeenAt || ''
        };
      });
    } catch (e) {}

    // Aggregate across all saved history records
    historyList.forEach(rec => {
      const drinkMembers = (rec.drinkTracker && rec.drinkTracker.members) || {};
      const roundMembers = (rec.attendeeTotals || []).map(a => a.name);
      const allInMeeting = new Set([...roundMembers, ...Object.keys(drinkMembers)]);

      allInMeeting.forEach(name => {
        if (!name) return;
        if (!map[name]) {
          map[name] = {
            name: name,
            meetingsCount: 0,
            drinkSessionsCount: 0,
            totalShots: 0,
            maxShotsInOneMeeting: 0,
            lastSeenAt: rec.savedAt || ''
          };
        }
        map[name].meetingsCount += 1;
        if (!map[name].lastSeenAt) map[name].lastSeenAt = rec.savedAt || '';

        const shots = drinkMembers[name] ? (Number(drinkMembers[name].shots) || 0) : 0;
        if (shots > 0) {
          map[name].drinkSessionsCount += 1;
          map[name].totalShots = Number((map[name].totalShots + shots).toFixed(1));
          if (shots > map[name].maxShotsInOneMeeting) {
            map[name].maxShotsInOneMeeting = shots;
          }
        }
      });
    });

    // Also merge current active session live stats for preview
    if (state.drinkTracker && state.drinkTracker.members) {
      Object.entries(state.drinkTracker.members).forEach(([name, info]) => {
        const shots = Number(info.shots) || 0;
        if (!map[name] && shots > 0) {
          map[name] = {
            name: name,
            meetingsCount: 1,
            drinkSessionsCount: 1,
            totalShots: shots,
            maxShotsInOneMeeting: shots,
            lastSeenAt: '현재 진행 중'
          };
        } else if (map[name] && shots > map[name].maxShotsInOneMeeting) {
          map[name].maxShotsInOneMeeting = shots;
        }
      });
    }

    return Object.values(map).sort((a, b) => {
      if (b.totalShots !== a.totalShots) return b.totalShots - a.totalShots;
      return b.meetingsCount - a.meetingsCount;
    });
  }

  function renderMemberHallOfFame() {
    if (!memberHallOfFame) return;
    const encyclopedia = getAggregatedMemberEncyclopedia();
    const spb = (state.drinkTracker && state.drinkTracker.shotsPerBottle) || 8;

    if (hofMemberCountBadge) {
      hofMemberCountBadge.textContent = `${encyclopedia.length}명`;
    }

    // Render Frequent Members Quick-Add Chips in Drink Tracker
    if (drinkFrequentWrap && drinkFrequentChips) {
      const currentDrinkNames = state.drinkTracker && state.drinkTracker.members
        ? Object.keys(state.drinkTracker.members)
        : [];
      const unaddedFrequent = encyclopedia.filter(p => !currentDrinkNames.includes(p.name));

      if (unaddedFrequent.length > 0) {
        drinkFrequentWrap.style.display = 'flex';
        drinkFrequentChips.innerHTML = '';
        unaddedFrequent.slice(0, 14).forEach(prof => {
          const chip = document.createElement('span');
          chip.className = 'recommend-chip';
          const maxTag = prof.maxShotsInOneMeeting > 0
            ? ` (${formatBottlesAndShots(prof.maxShotsInOneMeeting, spb)})`
            : '';
          chip.textContent = `+ ${prof.name}${maxTag}`;
          chip.addEventListener('click', () => {
            addMemberFromDrinkTracker(prof.name);
          });
          drinkFrequentChips.appendChild(chip);
        });
      } else {
        drinkFrequentWrap.style.display = 'none';
      }
    }

    if (encyclopedia.length === 0) {
      memberHallOfFame.innerHTML = `
        <div style="text-align: center; padding: 1.4rem 0.5rem; color: var(--text-muted); font-size: 0.82rem;">
          아직 누적된 멤버 기록이 없습니다.<br>술자리 주량을 체크하거나 정산 내역을 저장하면 자동으로 주량 도감이 만들어집니다!
        </div>
      `;
      return;
    }

    memberHallOfFame.innerHTML = '';
    encyclopedia.forEach((prof, idx) => {
      const item = document.createElement('div');
      item.className = 'hof-item';
      const rankLabel = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `${idx + 1}.`));
      const totalStr = prof.totalShots > 0
        ? `누적 ${formatBottlesAndShots(prof.totalShots, spb)} (${formatShotCount(prof.totalShots)}잔)`
        : '음주 기록 0잔';
      const maxStr = prof.maxShotsInOneMeeting > 0
        ? `1회 최고: ${formatBottlesAndShots(prof.maxShotsInOneMeeting, spb)}`
        : '비음주 / 기록 전';

      item.innerHTML = `
        <div class="hof-item-left">
          <span class="hof-rank">${rankLabel}</span>
          <span class="hof-name">${prof.name}</span>
          <span class="hof-meetings-pill">${prof.meetingsCount}회 벙</span>
        </div>
        <div class="hof-item-right">
          <span class="hof-total-soju">${totalStr}</span>
          <span class="hof-max-soju">${maxStr}</span>
        </div>
      `;
      memberHallOfFame.appendChild(item);
    });
  }

  function renderDrinkTracker() {
    if (!drinkMembersGrid) return;

    ensureDrinkTrackerMembersSynced();

    const spb = state.drinkTracker.shotsPerBottle || 8;
    const membersObj = state.drinkTracker.members || {};
    const memberNames = Object.keys(membersObj);

    const encyclopedia = getAggregatedMemberEncyclopedia();
    const profMap = {};
    encyclopedia.forEach(p => {
      profMap[p.name] = p;
    });

    // Calculate overall metrics
    let totalShots = 0;
    let maxShots = 0;
    let activeDrinkersCount = 0;

    memberNames.forEach(name => {
      const s = Number(membersObj[name].shots) || 0;
      totalShots += s;
      if (s > 0) activeDrinkersCount++;
      if (s > maxShots) maxShots = s;
    });

    const mvpNames = maxShots > 0
      ? memberNames.filter(n => (Number(membersObj[n].shots) || 0) === maxShots)
      : [];

    if (drinkTotalBottlesStat) {
      drinkTotalBottlesStat.textContent = formatBottlesAndShots(totalShots, spb);
    }
    if (drinkTotalShotsStat) {
      drinkTotalShotsStat.textContent = `(${formatShotCount(totalShots)}잔)`;
    }
    if (drinkMvpStat) {
      drinkMvpStat.textContent = mvpNames.length > 0
        ? `${mvpNames.join(', ')}`
        : '-';
    }
    if (drinkAvgStat) {
      const avgShots = activeDrinkersCount > 0 ? Number((totalShots / activeDrinkersCount).toFixed(1)) : 0;
      drinkAvgStat.textContent = formatBottlesAndShots(avgShots, spb);
    }
    if (drinkActiveCountStat) {
      drinkActiveCountStat.textContent = `${activeDrinkersCount}명 음주`;
    }
    if (drinkMembersCountBadge) {
      drinkMembersCountBadge.textContent = `총 ${memberNames.length}명`;
    }

    // Render Compact App-Style Member Rows
    drinkMembersGrid.innerHTML = '';

    if (memberNames.length === 0) {
      drinkMembersGrid.innerHTML = `
        <div class="drink-member-row" style="justify-content: center; text-align: center; padding: 1.5rem 0.75rem; color: var(--text-muted); font-size: 0.8rem;">
          아직 참석자가 없습니다. 위 입력창이나 [정산 계산기]에서 인원을 추가하세요!
        </div>
      `;
    } else {
      memberNames.forEach(name => {
        const info = membersObj[name];
        const shots = Number(info.shots) || 0;
        const bottles = Math.floor(shots / spb);
        const currentBottleProgress = shots - (bottles * spb);
        const isMvp = maxShots > 0 && shots === maxShots;
        const isHost = state.hostName === name;

        const row = document.createElement('div');
        row.className = `drink-member-row ${bottles >= 1 ? 'has-bottle' : ''} ${isMvp ? 'is-mvp' : ''}`;

        // Build micro 8-segment gauge bar
        let segsHtml = '';
        for (let i = 1; i <= spb; i++) {
          const isFilled = currentBottleProgress >= i || (currentBottleProgress === 0 && bottles > 0 && shots > 0 && (shots % spb === 0));
          const isHalf = !isFilled && (currentBottleProgress >= i - 0.5);
          segsHtml += `<span class="soju-micro-seg ${isFilled ? 'filled' : (isHalf ? 'half' : '')}"></span>`;
        }

        row.innerHTML = `
          <div class="drink-row-left">
            <div class="drink-row-header">
              <div class="drink-row-name-wrap">
                <span class="drink-member-name">${isHost ? '👑 ' : ''}${name}</span>
                ${isMvp ? '<span class="drink-mvp-crown">MVP</span>' : ''}
                ${bottles > 0 ? `<span class="drink-bottle-pill-mini">🍾×${bottles}</span>` : ''}
              </div>
              <div class="drink-row-count">
                <span class="drink-bottle-badge">${formatBottlesAndShots(shots, spb)}</span>
                <span class="drink-shots-sub">(${formatShotCount(shots)}잔)</span>
              </div>
            </div>
            <div class="soju-micro-gauge" style="grid-template-columns: repeat(${spb}, 1fr);">
              ${segsHtml}
            </div>
          </div>

          <div class="drink-row-actions">
            <button type="button" class="btn-shot-minus" data-name="${name}" ${shots <= 0 ? 'disabled' : ''} title="1잔 취소">-1</button>
            <button type="button" class="btn-shot-half" data-name="${name}" title="반 잔 추가">+반</button>
            <button type="button" class="btn-shot-plus" data-name="${name}">+1잔</button>
          </div>
        `;

        const plusBtn = row.querySelector('.btn-shot-plus');
        plusBtn.addEventListener('click', () => addDrinkShots(name, 1));

        const halfBtn = row.querySelector('.btn-shot-half');
        halfBtn.addEventListener('click', () => addDrinkShots(name, 0.5));

        const minusBtn = row.querySelector('.btn-shot-minus');
        minusBtn.addEventListener('click', () => addDrinkShots(name, -1));

        drinkMembersGrid.appendChild(row);
      });
    }

    // Update Standalone Drink Report Preview
    if (drinkReportText) {
      drinkReportText.textContent = buildDrinkReportSummaryText(false);
    }

    // Update Undo Button & Live Timeline Logs
    const logs = (state.drinkTracker && state.drinkTracker.logs) || [];
    if (undoLastShotBtn) {
      undoLastShotBtn.disabled = logs.length === 0;
    }

    if (drinkLiveLogs) {
      if (logs.length === 0) {
        drinkLiveLogs.innerHTML = `
          <div style="text-align: center; padding: 1.2rem 0.5rem; color: var(--text-muted); font-size: 0.8rem;">
            아직 마신 기록이 없습니다. [+1잔 마심!]을 누르면 타임라인에 기록됩니다.
          </div>
        `;
      } else {
        drinkLiveLogs.innerHTML = logs.slice(0, 15).map(log => {
          const actionDesc = log.delta > 0
            ? `+${formatShotCount(log.delta)}잔 (누적 ${formatBottlesAndShots(log.totalShots, spb)})`
            : `${formatShotCount(log.delta)}잔 취소 (누적 ${formatBottlesAndShots(log.totalShots, spb)})`;
          const milestoneBadge = log.isMilestone ? ` 🎉 <strong>${log.bottleNum}병 돌파!</strong>` : '';
          return `
            <div class="drink-log-item ${log.isMilestone ? 'milestone-log' : ''}">
              <span>🍶 <strong>${log.name}</strong>님 ${actionDesc}${milestoneBadge}</span>
              <span class="drink-log-time">${log.timestamp}</span>
            </div>
          `;
        }).join('');
      }
    }

    // Update Cumulative Hall of Fame & Frequent Member Chips
    renderMemberHallOfFame();
  }

  // ==========================================================================
  // Clipboard Handlers
  // ==========================================================================

  function copyTextToClipboard(text, successMsg) {
    if (!text) return;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => showToastMessage(successMsg || '클립보드에 복사되었습니다!'))
        .catch(() => fallbackCopyText(text, successMsg));
    } else {
      fallbackCopyText(text, successMsg);
    }
  }

  function copyUnpaidListToClipboard() {
    if (!latestAttendeeTotals || latestAttendeeTotals.length === 0) {
      alert('참석자 명단이 없습니다.');
      return;
    }

    const unpaidList = latestAttendeeTotals.filter(a => !state.paidAttendees[a.name]);

    if (unpaidList.length === 0) {
      showToastMessage('모든 인원이 입금을 완료했습니다! 🎉');
      return;
    }

    let text = `[벙비 미입금 안내 🚨]\n아직 입금 안 하신 분들은 입금 부탁드립니다!\n\n`;
    unpaidList.forEach(member => {
      text += `${member.name} = ${formatMoney(member.amount)}원\n`;
    });

    if (state.bankInfo.trim()) {
      text += `\n${state.bankInfo.trim()}`;
    }

    copyTextToClipboard(text, '미입금자 안내 텍스트가 복사되었습니다!');
  }

  function fallbackCopyText(text, successMsg) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToastMessage(successMsg || '클립보드에 복사되었습니다!');
    } catch (err) {
      console.error('Fallback copy failed:', err);
      alert('복사에 실패했습니다. 텍스트를 드래그하여 복사해 주세요.');
    }
    document.body.removeChild(textArea);
  }

  let toastTimeout;
  function showToastMessage(msg) {
    if (!toast) return;
    if (toastMessage) {
      toastMessage.textContent = msg;
    } else {
      toast.textContent = msg;
    }
    clearTimeout(toastTimeout);
    toast.classList.add('show');
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  // ==========================================================================
  // Smart Text Parser & Import Feature
  // ==========================================================================

  function parseBungText(text) {
    if (!text || typeof text !== 'string') return null;

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;

    let title = '';
    let bankInfo = '';
    let operatingFee = 0;

    // Bank Names & Account Number Regex
    const bankNames = ['기업', '국민', '신한', '우리', '하나', '농협', '카카오', '토스', '새마을', '우체국', 'SC', '씨티', '대구', '부산', '광주', '전북', '경남', '수협', '신협', '케이뱅크'];
    const bankRegex = new RegExp(`(${bankNames.join('|')})`, 'i');
    const accountNumRegex = /\d{2,6}[-\s]\d{2,6}[-\s]\d{2,6}(?:[-\s]\d{1,6})?/;

    for (const line of lines) {
      if (accountNumRegex.test(line) || (bankRegex.test(line) && /\d{3,}/.test(line))) {
        if (!line.includes('/') && !line.includes('→') && !line.startsWith('총') && !line.startsWith('합계')) {
          bankInfo = line.replace(/^(입금\s*계좌|계좌번호|계좌|입금)\s*[:：]?\s*/i, '').trim();
          break;
        }
      }
    }

    // Operating Fee Detection
    for (const line of lines) {
      const feeMatch = line.match(/운영비\s*[:：]?\s*([0-9,]+)\s*원?/);
      if (feeMatch) {
        operatingFee = parseInt(feeMatch[1].replace(/,/g, ''), 10) || 0;
        break;
      }
    }

    // Title Detection
    for (const line of lines) {
      if (/^[📌📋⚡📢\u{1F4CC}\u{1F4CB}\u{26A1}\u{1F4E2}]\s*(.+)/u.test(line)) {
        const matched = line.replace(/^[📌📋⚡📢\u{1F4CC}\u{1F4CB}\u{26A1}\u{1F4E2}]\s*/u, '').trim();
        if (matched && !matched.includes('최종') && !matched.includes('미입금')) {
          title = (matched === '정산' || matched === '벙정산') ? `${getDefaultMeetingTitle()} (정산)` : matched;
          break;
        }
      } else if (/^\[(.+정산.*)\]$/.test(line) || /^\[(.+모임.*)\]$/.test(line)) {
        title = line.replace(/^\[|\]$/g, '').trim();
        break;
      }
    }

    // Detect Round Headers
    const roundIndices = [];
    lines.forEach((line, idx) => {
      if (line.includes('최종') || line.includes('참석') || line.includes('미입금') || line.includes('안내')) return;
      const clean = line.replace(/\s+/g, ' ');
      if (/^\[?\s*[0-9]+차(?:\s*[:\-–—][^\]]+|\s*\([^)]+\))?\s*\]?$/.test(clean)) {
        roundIndices.push({ lineIdx: idx, rawHeader: clean });
      }
    });

    const parsedRounds = [];

    if (roundIndices.length > 0) {
      for (let i = 0; i < roundIndices.length; i++) {
        const current = roundIndices[i];
        const startLine = current.lineIdx;
        const endLine = (i + 1 < roundIndices.length) ? roundIndices[i + 1].lineIdx : lines.length;
        const blockLines = lines.slice(startLine + 1, endLine);

        let roundName = current.rawHeader.replace(/^\[|\]$/g, '').trim();
        let amount = 0;
        let attendees = [];

        for (const bLine of blockLines) {
          if (bLine.includes('최종') || bLine.includes('최종 정산')) break;

          // Amount
          if (amount === 0) {
            const slashMathMatch = bLine.match(/([0-9,]{3,})\s*\/\s*[0-9]+\s*=/);
            const totalMatch = bLine.match(/(?:총|금액|합계)?\s*([0-9,]{3,})\s*원?(?:\s*\/|\s*$|\s*\(|\s*→)/);
            if (slashMathMatch) {
              amount = parseInt(slashMathMatch[1].replace(/,/g, ''), 10) || 0;
            } else if (totalMatch && !bLine.includes('1인') && !bLine.includes('→')) {
              const val = parseInt(totalMatch[1].replace(/,/g, ''), 10);
              if (val >= 100) amount = val;
            }
          }

          // Attendees
          const attPrefixMatch = bLine.match(/^(?:참가자|참석자|참석|명단|인원)\s*[:：]?\s*(.+)/i);
          if (attPrefixMatch) {
            const rawNames = attPrefixMatch[1];
            const names = rawNames.split(/[,/·•|\s]+/).map(n => n.trim()).filter(n => {
              if (!n) return false;
              if (/^\d+원?$/.test(n) || /^\d+명$/.test(n) || n === '원' || n === '명') return false;
              return true;
            });
            attendees = names;
          } else if (attendees.length === 0 && !bLine.includes('원') && !bLine.includes('/') && !bLine.includes('→') && !bLine.startsWith('총')) {
            const candidateNames = bLine.split(/[,/·•|\s]+/).map(n => n.trim()).filter(n => n.length >= 1 && n.length <= 10 && !/[0-9]/.test(n));
            if (candidateNames.length >= 1) {
              attendees = candidateNames;
            }
          }
        }

        parsedRounds.push({
          name: roundName,
          amount: amount,
          attendees: attendees
        });
      }
    }

    // Fallback: Individual settlement lines (e.g. "건우 - 67,164원")
    const attendeeTotals = [];
    for (const line of lines) {
      if (accountNumRegex.test(line)) continue;
      const memberMatch = line.match(/^([가-힣a-zA-Z][가-힣a-zA-Z0-9_]{0,9})\s*[-:=]\s*([0-9,]+)\s*원?/);
      if (memberMatch) {
        const name = memberMatch[1].trim();
        const amt = parseInt(memberMatch[2].replace(/,/g, ''), 10);
        if (name && amt > 0 && !name.includes('참석') && !name.includes('정산') && !name.includes('차')) {
          attendeeTotals.push({ name, amount: amt });
        }
      }
    }

    // Host (벙주) & Host Support Detection
    let hostName = '';
    let hostSupportFee = 0;
    for (const line of lines) {
      const hostMatch = line.match(/(?:👑|벙주)\s*[:：(]?\s*([가-힣a-zA-Z0-9]+)/);
      if (hostMatch) {
        const found = hostMatch[1].replace(/[()]/g, '').trim();
        if (found && !found.includes('지원') && !found.includes('정산') && !found.includes('모임')) {
          hostName = found;
        }
      }
      const supportMatch = line.match(/벙주\s*지원(?:금)?\s*[:：]?\s*(?:1인당\s*)?\+?([0-9,]+)\s*원?/);
      if (supportMatch) {
        hostSupportFee = parseInt(supportMatch[1].replace(/,/g, ''), 10) || 0;
      }
    }

    return {
      title: title || '',
      bankInfo: bankInfo || '',
      operatingFee: operatingFee,
      hostName: hostName,
      hostSupportFee: hostSupportFee,
      rounds: parsedRounds,
      attendeeTotals: attendeeTotals
    };
  }

  function convertParsedRoundsToStateRounds(parsedRounds) {
    const rounds = [];
    for (let i = 0; i < parsedRounds.length; i++) {
      const pr = parsedRounds[i];
      const currAttendees = pr.attendees || [];
      let addedAttendees = [];
      let removedAttendees = [];

      if (i === 0) {
        addedAttendees = [...currAttendees];
        removedAttendees = [];
      } else {
        const prevRoundAttendees = parsedRounds[i - 1].attendees || [];
        addedAttendees = currAttendees.filter(name => !prevRoundAttendees.includes(name));
        removedAttendees = prevRoundAttendees.filter(name => !currAttendees.includes(name));
      }

      rounds.push({
        id: state.nextRoundId++,
        name: pr.name || `${i + 1}차`,
        amount: pr.amount || 0,
        addedAttendees: addedAttendees,
        removedAttendees: removedAttendees
      });
    }
    return rounds;
  }

  function convertAttendeeTotalsToStateRounds(attendeeTotals) {
    // Group attendees by amount
    const amountGroups = new Map();
    attendeeTotals.forEach(item => {
      if (!amountGroups.has(item.amount)) {
        amountGroups.set(item.amount, []);
      }
      amountGroups.get(item.amount).push(item.name);
    });

    const rounds = [];
    let rIdx = 1;
    for (const [amount, members] of amountGroups.entries()) {
      rounds.push({
        id: state.nextRoundId++,
        name: `정산 (${formatMoney(amount)}원 그룹)`,
        amount: amount * members.length,
        addedAttendees: [...members],
        removedAttendees: []
      });
      rIdx++;
    }
    return rounds;
  }

  let currentParsedResult = null;

  function openImportModal() {
    if (!importModal) return;
    importModal.classList.add('open');
    if (importModalBackdrop) importModalBackdrop.classList.add('open');
    importTextInput.value = '';
    importPreviewBox.style.display = 'none';
    applyImportBtn.disabled = true;
    currentParsedResult = null;
    setTimeout(() => {
      importTextInput.focus();
    }, 80);
  }

  function closeImportModal() {
    if (!importModal) return;
    importModal.classList.remove('open');
    if (importModalBackdrop) importModalBackdrop.classList.remove('open');
  }

  function updateImportPreview() {
    const text = importTextInput.value.trim();
    if (!text) {
      importPreviewBox.style.display = 'none';
      applyImportBtn.disabled = true;
      currentParsedResult = null;
      return;
    }

    const parsed = parseBungText(text);
    currentParsedResult = parsed;

    const hasRounds = parsed && parsed.rounds && parsed.rounds.length > 0;
    const hasTotals = parsed && parsed.attendeeTotals && parsed.attendeeTotals.length > 0;

    if (!hasRounds && !hasTotals) {
      importPreviewBox.style.display = 'flex';
      previewStatusText.textContent = '인식 대기 중';
      previewStatusText.style.color = 'var(--text-muted)';
      previewContentDetails.innerHTML = `
        <div style="color: #f87171; font-size: 0.82rem;">
          ⚠️ 차수별 금액과 참석자 명단을 인식하지 못했습니다. 상단 예시 형식을 참고해 주세요.
        </div>
      `;
      applyImportBtn.disabled = true;
      return;
    }

    importPreviewBox.style.display = 'flex';
    applyImportBtn.disabled = false;

    if (hasRounds) {
      let totalSum = 0;
      const allNamesSet = new Set();
      parsed.rounds.forEach(r => {
        totalSum += (r.amount || 0);
        (r.attendees || []).forEach(name => allNamesSet.add(name));
      });
      const uniqueNames = Array.from(allNamesSet);

      previewStatusText.textContent = `${parsed.rounds.length}개 차수 감지 완료!`;
      previewStatusText.style.color = '#34d399';

      let detailsHtml = `
        <div class="preview-row">
          <span class="preview-label">총 지출:</span>
          <span class="preview-value">${formatMoney(totalSum)}원</span>
          <span style="color: var(--text-muted); font-size: 0.78rem;">(${parsed.rounds.length}개 차수 / 총 ${uniqueNames.length}명)</span>
        </div>
      `;

      if (parsed.bankInfo) {
        detailsHtml += `
          <div class="preview-row">
            <span class="preview-label">입금 계좌:</span>
            <span class="preview-value" style="color: #60a5fa;">${parsed.bankInfo}</span>
          </div>
        `;
      }

      if (parsed.title) {
        detailsHtml += `
          <div class="preview-row">
            <span class="preview-label">모임명:</span>
            <span class="preview-value">${parsed.title}</span>
          </div>
        `;
      }

      // Round badges
      detailsHtml += `
        <div style="margin-top: 0.2rem;">
          <span class="preview-label">차수별 내역:</span>
          <div class="preview-chip-group">
      `;
      parsed.rounds.forEach(r => {
        const attCount = (r.attendees || []).length;
        detailsHtml += `<span class="preview-round-pill">${r.name}: ${formatMoney(r.amount)}원 (${attCount}명)</span>`;
      });
      detailsHtml += `
          </div>
        </div>
      `;

      // Attendee badges
      if (uniqueNames.length > 0) {
        detailsHtml += `
          <div style="margin-top: 0.2rem;">
            <span class="preview-label">참석자 명단:</span>
            <div class="preview-chip-group">
        `;
        uniqueNames.forEach(name => {
          detailsHtml += `<span class="preview-member-pill">${name}</span>`;
        });
        detailsHtml += `
            </div>
          </div>
        `;
      }

      previewContentDetails.innerHTML = detailsHtml;
    } else {
      // Fallback: Individual settlement list
      let totalSum = 0;
      parsed.attendeeTotals.forEach(item => totalSum += item.amount);

      previewStatusText.textContent = `${parsed.attendeeTotals.length}명 최종 정산 감지`;
      previewStatusText.style.color = '#34d399';

      let detailsHtml = `
        <div class="preview-row">
          <span class="preview-label">정산 인원:</span>
          <span class="preview-value">${parsed.attendeeTotals.length}명 (총 ${formatMoney(totalSum)}원)</span>
        </div>
      `;

      if (parsed.bankInfo) {
        detailsHtml += `
          <div class="preview-row">
            <span class="preview-label">입금 계좌:</span>
            <span class="preview-value" style="color: #60a5fa;">${parsed.bankInfo}</span>
          </div>
        `;
      }

      detailsHtml += `
        <div class="preview-chip-group" style="margin-top: 0.3rem;">
      `;
      parsed.attendeeTotals.forEach(item => {
        detailsHtml += `<span class="preview-member-pill">${item.name}: ${formatMoney(item.amount)}원</span>`;
      });
      detailsHtml += `</div>`;

      previewContentDetails.innerHTML = detailsHtml;
    }
  }

  function applyImportedData() {
    if (!currentParsedResult) return;

    const hasRounds = currentParsedResult.rounds && currentParsedResult.rounds.length > 0;
    const hasTotals = currentParsedResult.attendeeTotals && currentParsedResult.attendeeTotals.length > 0;

    if (!hasRounds && !hasTotals) return;

    const currentHasData = state.rounds.some(r => r.amount > 0 || getRoundAttendees(r.id).length > 0);
    if (currentHasData) {
      if (!confirm('현재 작성 중이던 계산기 내용이 가져온 정산 데이터로 대체됩니다. 계속하시겠습니까?')) {
        return;
      }
    }

    // Set state
    if (currentParsedResult.title) {
      state.meetingTitle = currentParsedResult.title;
      meetingTitleInput.value = state.meetingTitle;
    }
    if (currentParsedResult.bankInfo) {
      state.bankInfo = currentParsedResult.bankInfo;
      bankInfoInput.value = state.bankInfo;
    }
    if (currentParsedResult.operatingFee) {
      state.operatingFee = currentParsedResult.operatingFee;
      operatingFeeInput.value = state.operatingFee;
    }
    if (currentParsedResult.hostName) {
      state.hostName = currentParsedResult.hostName;
    }
    if (currentParsedResult.hostSupportFee) {
      state.hostSupportFee = currentParsedResult.hostSupportFee;
      if (hostSupportFeeInput) hostSupportFeeInput.value = state.hostSupportFee;
    }

    state.paidAttendees = {};

    if (hasRounds) {
      state.rounds = convertParsedRoundsToStateRounds(currentParsedResult.rounds);
    } else {
      state.rounds = convertAttendeeTotalsToStateRounds(currentParsedResult.attendeeTotals);
    }

    renderRounds();
    calculateAndRenderResults();
    closeImportModal();

    const uniqueCount = getAllUniqueAttendees().length;
    showToastMessage(`정산 내역 ${state.rounds.length}개 차수(${uniqueCount}명)를 성공적으로 불러왔습니다! 🎉`);

    // Smoothly focus on payment tracker
    setTimeout(() => {
      if (paymentTrackerCard) {
        paymentTrackerCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 250);
  }

  // ==========================================================================
  // Event Listeners
  // ==========================================================================

  meetingTitleInput.addEventListener('input', (e) => {
    state.meetingTitle = e.target.value;
    saveCurrentStateToLocalStorage();
  });

  bankInfoInput.addEventListener('input', (e) => {
    state.bankInfo = e.target.value;
    calculateAndRenderResults();
  });

  operatingFeeInput.addEventListener('input', (e) => {
    state.operatingFee = parseInt(e.target.value) || 0;
    calculateAndRenderResults();
  });

  // Host (벙주) & Support Event Listeners
  if (hostSelect) {
    hostSelect.addEventListener('change', (e) => {
      state.hostName = e.target.value;
      if (state.hostName) {
        state.paidAttendees[state.hostName] = true;
        if (!state.hostSupportFee || state.hostSupportFee === 0) {
          state.hostSupportFee = 1000;
        }
      }
      renderRounds();
      calculateAndRenderResults();
    });
  }

  if (hostSupportFeeInput) {
    hostSupportFeeInput.addEventListener('input', (e) => {
      state.hostSupportFee = parseInt(e.target.value) || 0;
      if (state.hostSupportFee > 0 && !state.hostName) {
        const unique = getAllUniqueAttendees();
        if (unique.length > 0) state.hostName = unique[0];
      }
      renderRounds();
      calculateAndRenderResults();
    });
  }

  if (hostSupportToggleBtn) {
    hostSupportToggleBtn.addEventListener('click', () => {
      if ((state.hostSupportFee || 0) > 0) {
        state.hostSupportFee = 0;
      } else {
        state.hostSupportFee = 1000;
        if (!state.hostName) {
          const unique = getAllUniqueAttendees();
          if (unique.length > 0) state.hostName = unique[0];
        }
      }
      renderRounds();
      calculateAndRenderResults();
    });
  }

  if (hostQuickPills) {
    hostQuickPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const amt = parseInt(pill.dataset.amount, 10) || 0;
        state.hostSupportFee = amt;
        if (amt > 0 && !state.hostName) {
          const unique = getAllUniqueAttendees();
          if (unique.length > 0) state.hostName = unique[0];
        }
        renderRounds();
        calculateAndRenderResults();
      });
    });
  }

  roundRuleSelect.addEventListener('change', (e) => {
    state.roundRule = e.target.value;
    calculateAndRenderResults();
  });

  addRoundBtn.addEventListener('click', createNewRound);
  resetAllBtn.addEventListener('click', () => {
    if (confirm('현재 입력된 모든 차수와 참석자 데이터를 초기화하시겠습니까?')) {
      initFirstRound(true);
      showToastMessage('입력 데이터가 초기화되었습니다.');
    }
  });

  copyBtn.addEventListener('click', () => {
    copyTextToClipboard(resultTextElement.textContent, '카카오톡 정산 텍스트가 복사되었습니다!');
  });

  if (copyUnpaidBtn) {
    copyUnpaidBtn.addEventListener('click', copyUnpaidListToClipboard);
  }

  // History & Meeting Navigation Listeners
  saveHistoryBtn.addEventListener('click', saveCurrentBungToHistory);
  openHistoryBtn.addEventListener('click', openHistoryDrawer);
  closeDrawerBtn.addEventListener('click', closeHistoryDrawer);
  historyBackdrop.addEventListener('click', closeHistoryDrawer);
  newMeetingBtn.addEventListener('click', startNewMeeting);

  // Smart Import Listeners
  if (importTextBtn) importTextBtn.addEventListener('click', openImportModal);
  if (inlineImportBtn) inlineImportBtn.addEventListener('click', openImportModal);
  if (closeImportModalBtn) closeImportModalBtn.addEventListener('click', closeImportModal);
  if (cancelImportBtn) cancelImportBtn.addEventListener('click', closeImportModal);
  if (importModalBackdrop) importModalBackdrop.addEventListener('click', closeImportModal);
  if (importTextInput) importTextInput.addEventListener('input', updateImportPreview);
  if (applyImportBtn) applyImportBtn.addEventListener('click', applyImportedData);

  // Workspace Tab Switcher & Drink Tracker Listeners
  if (tabBtnSettlement) {
    tabBtnSettlement.addEventListener('click', () => switchWorkspaceTab('settlement'));
  }
  if (tabBtnDrink) {
    tabBtnDrink.addEventListener('click', () => switchWorkspaceTab('drink'));
  }

  if (toggleDrinkReceiptBtn) {
    toggleDrinkReceiptBtn.addEventListener('click', () => {
      if (!state.drinkTracker) state.drinkTracker = createDefaultDrinkTrackerState();
      state.drinkTracker.includeInReceipt = !state.drinkTracker.includeInReceipt;
      calculateAndRenderResults();
    });
  }

  if (shotsPerBottleSelect) {
    shotsPerBottleSelect.addEventListener('change', (e) => {
      if (!state.drinkTracker) state.drinkTracker = createDefaultDrinkTrackerState();
      state.drinkTracker.shotsPerBottle = parseInt(e.target.value, 10) || 8;
      calculateAndRenderResults();
    });
  }

  if (syncDrinkToRoundsBtn) {
    syncDrinkToRoundsBtn.addEventListener('click', syncDrinkMembersToSettlementRounds);
  }

  if (autoSyncRound1Checkbox) {
    autoSyncRound1Checkbox.addEventListener('change', (e) => {
      if (!state.drinkTracker) state.drinkTracker = createDefaultDrinkTrackerState();
      state.drinkTracker.autoSyncToFirstRound = e.target.checked;
      saveCurrentStateToLocalStorage();
    });
  }

  if (drinkAddMemberBtn && drinkMemberInput) {
    const submitDrinkMember = () => {
      const val = drinkMemberInput.value.trim();
      if (!val) return;
      addMemberFromDrinkTracker(val);
      drinkMemberInput.value = '';
      drinkMemberInput.focus();
    };

    drinkAddMemberBtn.addEventListener('click', submitDrinkMember);
    drinkMemberInput.addEventListener('keydown', (e) => {
      if (e.isComposing) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        submitDrinkMember();
      }
    });
  }

  if (resetDrinkCountsBtn) {
    resetDrinkCountsBtn.addEventListener('click', () => {
      if (!state.drinkTracker || !state.drinkTracker.members) return;
      const hasAnyShots = Object.values(state.drinkTracker.members).some(m => (m.shots || 0) > 0);
      if (!hasAnyShots) return;
      if (confirm('참석자 명단은 유지하고 마신 소주 잔 수만 모두 0잔으로 초기화하시겠습니까?')) {
        Object.keys(state.drinkTracker.members).forEach(name => {
          state.drinkTracker.members[name].shots = 0;
        });
        state.drinkTracker.logs = [];
        calculateAndRenderResults();
        showToastMessage('소주 잔 카운트가 0잔으로 초기화되었습니다.');
      }
    });
  }

  if (copyDrinkReportBtn) {
    copyDrinkReportBtn.addEventListener('click', () => {
      const text = buildDrinkReportSummaryText(false);
      copyTextToClipboard(text, '오늘의 음주 리포트가 클립보드에 복사되었습니다! 🍶');
    });
  }

  if (undoLastShotBtn) {
    undoLastShotBtn.addEventListener('click', undoLastDrinkShot);
  }

  if (closeMilestoneBtn) {
    closeMilestoneBtn.addEventListener('click', hideBottleMilestoneBanner);
  }

  // Initialize
  updateHistoryBadges();

  if (!loadCurrentStateFromLocalStorage()) {
    initFirstRound();
  } else {
    renderRounds();
    calculateAndRenderResults();
    if (state.activeTab === 'drink') {
      switchWorkspaceTab('drink');
    }
  }
});
