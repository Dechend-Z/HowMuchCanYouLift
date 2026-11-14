/**
 * ============================================
 * HOW MUCH CAN YOU LIFT — BARBELL CALCULATOR
 * ============================================
 */

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    KG_TO_LB: 2.20462,

    plates: {
        kg: [25, 20, 15, 10, 5, 2.5, 1.25],
        lb: [55, 45, 35, 25, 15, 10, 5, 2.5]
    },

    // IWF-style colour coding per unit
    plateColors: {
        kg: { 25: 'red', 20: 'blue', 15: 'yellow', 10: 'green', 5: 'white', 2.5: 'red', 1.25: 'steel' },
        lb: { 55: 'red', 45: 'blue', 35: 'yellow', 25: 'green', 15: 'steel', 10: 'white', 5: 'red', 2.5: 'steel' }
    },

    bars: {
        olympic: { kg: 20, lb: 45, name: 'Olympic Bar', maxLoad: { kg: 500, lb: 1100 } },
        womens: { kg: 15, lb: 35, name: "Women's Bar", maxLoad: { kg: 350, lb: 770 } },
        training: { kg: 10, lb: 22, name: 'Training Bar', maxLoad: { kg: 250, lb: 550 } }
    },

    // 1RM ÷ bodyweight. Source: StrengthLevel "Entire Community" standards
    // (strengthlevel.com/strength-standards, data to Mar 2026).
    // Novice = stronger than 20% of lifters, Intermediate 50%, Advanced 80%, Elite 95%.
    strengthStandards: {
        male: {
            bench: { novice: 1.0, intermediate: 1.25, advanced: 1.5, elite: 2.0 },
            squat: { novice: 1.25, intermediate: 1.75, advanced: 2.25, elite: 2.75 },
            deadlift: { novice: 1.5, intermediate: 2.0, advanced: 2.5, elite: 3.25 },
            ohp: { novice: 0.55, intermediate: 0.8, advanced: 1.05, elite: 1.35 }
        },
        female: {
            bench: { novice: 0.5, intermediate: 0.75, advanced: 1.1, elite: 1.45 },
            squat: { novice: 0.75, intermediate: 1.25, advanced: 1.75, elite: 2.25 },
            deadlift: { novice: 1.0, intermediate: 1.5, advanced: 2.0, elite: 2.5 },
            ohp: { novice: 0.35, intermediate: 0.5, advanced: 0.7, elite: 0.95 }
        }
    },

    // Ratio standards come from mostly ~60–90 kg lifters and overshoot for heavy
    // lifters, so each tier is capped at a share of the class world record.
    tierCaps: { novice: 0.35, intermediate: 0.5, advanced: 0.65, elite: 0.8 },

    // Best raw (classic) full-power lifts per IPF weight class, at IPF-affiliated
    // meets. Source: OpenIPF records (openipf.org/records/raw/ipf-classes), Nov 2026.
    // [kg, holder, year]. No federation keeps an overhead press record.
    worldRecords: {
        male: [
            { cls: '59', max: 59, squat: [250, 'Jeremy Smith', 2019], bench: [175, 'Reisei Tanaka', 2025], deadlift: [303, 'Michael Slabic', 2026] },
            { cls: '66', max: 66, squat: [278, 'Jonathan Garcia', 2024], bench: [213.5, 'Eddie Berglund', 2018], deadlift: [324.5, 'Kjell Egil Bakkelund', 2026] },
            { cls: '74', max: 74, squat: [341, 'Austin Perkins', 2026], bench: [222.5, 'Daiki Kodama', 2019], deadlift: [344, 'Austin Perkins', 2026] },
            { cls: '83', max: 83, squat: [338, 'Russel Orhii', 2025], bench: [219, 'Joseph Borenstein', 2025], deadlift: [383, 'Enahoro Asein', 2026] },
            { cls: '93', max: 93, squat: [363, 'JamaRR Royster', 2025], bench: [252, 'Jonathan Cayco', 2025], deadlift: [383, 'Chance Mitchell', 2022] },
            { cls: '105', max: 105, squat: [398, 'Joshua Joachim', 2026], bench: [263, 'Joseph Amendola', 2019], deadlift: [400.5, 'Hunter Olsen', 2026] },
            { cls: '120', max: 120, squat: [400.5, 'Ashton Rouska', 2026], bench: [270, 'Rondel Hunte', 2026], deadlift: [417.5, 'Sanchez Dillon', 2026] },
            { cls: '120+', max: Infinity, squat: [490, 'Ray Williams', 2019], bench: [322.5, 'James Henderson', 1997], deadlift: [417.5, 'Mikhail Koklyaev', 2012] }
        ],
        female: [
            { cls: '47', max: 47, squat: [170.5, 'Tiffany Chapon', 2026], bench: [107.5, 'Tiffany Chapon', 2026], deadlift: [212.5, 'Heather Connor', 2025] },
            { cls: '52', max: 52, squat: [182.5, 'Pleun Dekkers', 2026], bench: [114, 'Selma Ramberg', 2022], deadlift: [220.5, 'Farhanna Farid', 2026] },
            { cls: '57', max: 57, squat: [200.5, 'Sara Naldi', 2026], bench: [123, 'Donna Berglund', 2022], deadlift: [238, 'Joy Nnamani', 2026] },
            { cls: '63', max: 63, squat: [214.5, 'Prescillia Bavoil', 2025], bench: [144, 'Carola Garra', 2023], deadlift: [241.5, 'Alba Boström', 2026] },
            { cls: '69', max: 69, squat: [227, 'Carola Garra', 2026], bench: [158, 'Agata Sitko', 2025], deadlift: [260, 'Agata Sitko', 2025] },
            { cls: '76', max: 76, squat: [240, 'Cranon Worford', 2026], bench: [160, 'Agata Sitko', 2024], deadlift: [263, 'Chisom Ezeh', 2026] },
            { cls: '84', max: 84, squat: [256, 'Amanda Lawrence', 2020], bench: [156, 'Agata Sitko', 2024], deadlift: [270, 'Ziana Azariah', 2026] },
            { cls: '84+', max: Infinity, squat: [320, 'Sonita Muluh', 2026], bench: [175, 'Christi Rees', 2023], deadlift: [292.5, 'Aquinn Onuoha', 2026] }
        ]
    },

    levels: ['beginner', 'novice', 'intermediate', 'advanced', 'elite', 'record'],
    levelNames: {
        beginner: 'Beginner', novice: 'Novice', intermediate: 'Intermediate',
        advanced: 'Advanced', elite: 'Elite', record: 'World record'
    },

    exercises: {
        bench: 'Bench Press',
        squat: 'Squat',
        deadlift: 'Deadlift',
        ohp: 'Overhead Press'
    },

    storageKey: 'barbellCalculatorData'
};

// ============================================
// STATE
// ============================================

const state = {
    unit: 'kg',
    barType: 'olympic',
    customBarWeight: null,  // in current unit
    plates: {},             // { weight: countPerSide } in current unit
    customPlates: [],       // custom plate weights in current unit
    bodyweight: null,       // in current unit
    exercise: 'bench',
    reps: null,
    sex: 'male'
};

// ============================================
// UTILITIES
// ============================================

const kgToLb = kg => kg * CONFIG.KG_TO_LB;
const lbToKg = lb => lb / CONFIG.KG_TO_LB;
const toKg = w => (state.unit === 'kg' ? w : lbToKg(w));
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

function formatNumber(num, decimals = 1) {
    if (num === null || num === undefined || isNaN(num)) return '--';
    return num.toFixed(decimals);
}

/** Show whole numbers without a trailing .0 */
function formatWeight(num) {
    if (num === null || num === undefined || isNaN(num)) return '--';
    const r = round(num, 2);
    return Number.isInteger(r) ? String(r) : String(round(r, 2));
}

function getPlateColor(weight) {
    const name = CONFIG.plateColors[state.unit][weight];
    return name ? `var(--plate-${name})` : 'var(--plate-custom)';
}

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// ============================================
// STORAGE
// ============================================

function saveState() {
    try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify({
            ...state,
            lastSaved: new Date().toISOString()
        }));
        updateLastSavedDisplay();
    } catch (e) {
        console.warn('Failed to save state:', e);
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem(CONFIG.storageKey);
        if (!saved) return false;
        const data = JSON.parse(saved);
        state.unit = data.unit === 'lb' ? 'lb' : 'kg';
        state.barType = data.barType || 'olympic';
        state.customBarWeight = data.customBarWeight || null;
        state.plates = data.plates || {};
        state.customPlates = data.customPlates || [];
        state.bodyweight = data.bodyweight || null;
        state.exercise = data.exercise || 'bench';
        state.reps = data.reps || null;
        state.sex = data.sex === 'female' ? 'female' : 'male';
        if (data.lastSaved) updateLastSavedDisplay(new Date(data.lastSaved));
        return true;
    } catch (e) {
        console.warn('Failed to load state:', e);
    }
    return false;
}

function clearState() {
    try {
        localStorage.removeItem(CONFIG.storageKey);
    } catch (e) {
        console.warn('Failed to clear state:', e);
    }
}

// ============================================
// DOM
// ============================================

const $ = id => document.getElementById(id);

const elements = {
    unitBtns: document.querySelectorAll('.unit-btn'),
    resetBtn: $('resetBtn'),
    lastSaved: $('lastSaved'),

    barRadios: document.querySelectorAll('input[name="barType"]'),
    customBarContainer: $('customBarContainer'),
    customBarWeight: $('customBarWeight'),
    customBarUnit: $('customBarUnit'),

    plateGrid: $('plateGrid'),
    addPlateBtn: $('addPlateBtn'),
    customPlateContainer: $('customPlateContainer'),
    customPlateWeight: $('customPlateWeight'),
    customPlateUnit: $('customPlateUnit'),
    confirmPlateBtn: $('confirmPlateBtn'),
    cancelPlateBtn: $('cancelPlateBtn'),

    scoreboard: $('scoreboard'),
    totalValue: $('totalValue'),
    totalUnit: $('totalUnit'),
    totalWeightSecondary: $('totalWeightSecondary'),
    totalBreakdown: $('totalBreakdown'),
    maxLoadWarning: $('maxLoadWarning'),
    plateVisual: $('plateVisual'),
    miniTotal: $('miniTotal'),
    miniTotalValue: $('miniTotalValue'),
    miniTotalUnit: $('miniTotalUnit'),

    bodyweight: $('bodyweight'),
    bodyweightUnit: $('bodyweightUnit'),
    exercise: $('exercise'),
    reps: $('reps'),
    strengthRatio: $('strengthRatio'),
    strengthLevel: $('strengthLevel'),
    oneRmPrimary: $('oneRmPrimary'),
    oneRmSecondary: $('oneRmSecondary'),
    levelScale: $('levelScale'),
    sexRadios: document.querySelectorAll('input[name="sex"]'),
    wrLabel: $('wrLabel'),
    wrValue: $('wrValue'),
    wrSub: $('wrSub'),
    wrEnd: $('wrEnd'),
    levelMarker: $('levelMarker'),
    strengthHint: $('strengthHint')
};

// ============================================
// UI UPDATES
// ============================================

function updateUnitDisplay() {
    elements.unitBtns.forEach(btn => {
        const active = btn.dataset.unit === state.unit;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
    });

    [elements.totalUnit, elements.customBarUnit, elements.customPlateUnit,
        elements.bodyweightUnit, elements.miniTotalUnit].forEach(el => {
        el.textContent = state.unit;
    });
}

function updateBarDisplay() {
    elements.barRadios.forEach(radio => {
        radio.checked = radio.value === state.barType;
    });

    const showCustom = state.barType === 'custom';
    elements.customBarContainer.style.display = showCustom ? 'grid' : 'none';
    if (showCustom && state.customBarWeight !== null) {
        elements.customBarWeight.value = formatWeight(state.customBarWeight);
    }
}

function getBarWeightKg() {
    if (state.barType === 'custom') {
        return state.customBarWeight ? toKg(state.customBarWeight) : 0;
    }
    const bar = CONFIG.bars[state.barType];
    return bar ? bar.kg : 20;
}

function getBarWeightDisplay() {
    if (state.barType === 'custom') return state.customBarWeight || 0;
    const bar = CONFIG.bars[state.barType];
    return bar ? bar[state.unit] : 0;
}

function getPlateList() {
    return [...CONFIG.plates[state.unit], ...state.customPlates].sort((a, b) => b - a);
}

function plateSubtext(weight, count) {
    return count > 0
        ? `${formatWeight(count * weight * 2)} ${state.unit} both sides`
        : 'None loaded';
}

function renderPlateGrid() {
    elements.plateGrid.innerHTML = getPlateList().map(weight => {
        const count = state.plates[weight] || 0;
        const isCustom = state.customPlates.includes(weight);
        const label = `${formatWeight(weight)} ${state.unit}`;

        return `
            <div class="plate-item${count > 0 ? ' is-loaded' : ''}" data-weight="${weight}" style="--c: ${getPlateColor(weight)}">
                <span class="plate-swatch" aria-hidden="true"></span>
                <div class="plate-head">
                    <div>
                        <span class="plate-weight">${formatWeight(weight)}<small>${state.unit}</small></span>
                        <span class="plate-subtext">${plateSubtext(weight, count)}</span>
                    </div>
                    ${isCustom ? `
                        <button type="button" class="plate-remove" data-weight="${weight}" aria-label="Remove ${label} plate">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>` : ''}
                </div>
                <div class="plate-controls">
                    <button type="button" class="plate-btn btn-decrease" data-weight="${weight}" aria-label="Remove one ${label} plate per side" ${count === 0 ? 'disabled' : ''}>−</button>
                    <span class="plate-count" aria-live="polite" aria-label="${count} per side">${count}</span>
                    <button type="button" class="plate-btn btn-increase" data-weight="${weight}" aria-label="Add one ${label} plate per side">+</button>
                </div>
            </div>`;
    }).join('');
}

/** Update counts in place without rebuilding the grid (keeps focus) */
function updatePlateGrid() {
    elements.plateGrid.querySelectorAll('.plate-item').forEach(item => {
        const weight = parseFloat(item.dataset.weight);
        const count = state.plates[weight] || 0;
        const countEl = item.querySelector('.plate-count');
        countEl.textContent = count;
        countEl.setAttribute('aria-label', `${count} per side`);
        item.querySelector('.plate-subtext').textContent = plateSubtext(weight, count);
        item.querySelector('.btn-decrease').disabled = count === 0;
        item.classList.toggle('is-loaded', count > 0);
    });
}

/** Plate drawing size from its kg-equivalent weight */
function plateDims(weight) {
    const kg = Math.min(toKg(weight), 25);
    return {
        h: Math.round(40 + kg * 2.4),      // 25 kg → 100px, 1.25 kg → 43px
        w: Math.round(6 + kg * 0.5)        // 25 kg → 18px, 1.25 kg → 7px
    };
}

function renderPlateVisual() {
    const loaded = Object.entries(state.plates)
        .map(([w, c]) => [parseFloat(w), c])
        .filter(([, c]) => c > 0)
        .sort(([a], [b]) => b - a);

    // Heaviest plates sit closest to the collar
    const discs = [];
    loaded.forEach(([weight, count]) => {
        const { w, h } = plateDims(weight);
        for (let i = 0; i < count; i++) {
            discs.push(`<span class="bb-plate" style="--w:${w}px;--h:${h}px;--c:${getPlateColor(weight)}"></span>`);
        }
    });
    const stack = discs.join('');

    const totalPerSide = loaded.reduce((s, [, c]) => s + c, 0);
    elements.plateVisual.setAttribute('aria-label', totalPerSide === 0
        ? 'Empty barbell'
        : `Barbell with ${loaded.map(([w, c]) => `${c} × ${formatWeight(w)} ${state.unit}`).join(', ')} on each side`);

    elements.plateVisual.innerHTML = `
        <div class="bb-inner">
            <div class="bb-side left">${stack}</div>
            <span class="bb-collar"></span>
            <span class="bb-shaft"></span>
            <span class="bb-collar"></span>
            <div class="bb-side right">${stack}</div>
        </div>
        ${totalPerSide === 0 ? '<span class="barbell-empty-note">Empty bar — add plates below</span>' : ''}`;

    fitBarbell();
}

/** Scale the drawing down when a heavy load would overflow */
function fitBarbell() {
    const inner = elements.plateVisual.querySelector('.bb-inner');
    if (!inner) return;
    inner.style.setProperty('--bb-scale', 1);
    const available = elements.plateVisual.clientWidth - 8;
    const needed = inner.scrollWidth;
    const scale = needed > available ? available / needed : 1;
    inner.style.setProperty('--bb-scale', scale.toFixed(3));
}

function updateTotalDisplay(totalKg, totalLb) {
    const primary = state.unit === 'kg' ? totalKg : totalLb;
    const secondary = state.unit === 'kg' ? totalLb : totalKg;
    const secondaryUnit = state.unit === 'kg' ? 'lb' : 'kg';
    const text = formatNumber(primary, 1);

    if (elements.totalValue.textContent !== text) {
        elements.totalValue.classList.remove('updating');
        void elements.totalValue.offsetWidth; // restart animation
        elements.totalValue.classList.add('updating');
    }

    elements.totalValue.textContent = text;
    elements.miniTotalValue.textContent = text;
    elements.totalWeightSecondary.textContent = `${formatNumber(secondary, 1)} ${secondaryUnit}`;

    const platesPerSide = Object.entries(state.plates)
        .reduce((sum, [w, c]) => sum + parseFloat(w) * c, 0);
    const bar = getBarWeightDisplay();
    elements.totalBreakdown.textContent = platesPerSide > 0
        ? `Bar ${formatWeight(bar)} + ${formatWeight(platesPerSide)} × 2`
        : `Bar only (${formatWeight(bar)} ${state.unit})`;
}

/** World record for the lifter's IPF weight class, or null (e.g. overhead press) */
function getWorldRecord(bwKg) {
    const classes = CONFIG.worldRecords[state.sex];
    const cls = classes.find(c => bwKg <= c.max) || classes[classes.length - 1];
    const rec = cls[state.exercise];
    return rec ? { kg: rec[0], holder: rec[1], year: rec[2], cls: cls.cls } : null;
}

/** Tier thresholds in kg for the current sex, lift and bodyweight */
function getStandard(bwKg) {
    const ratios = CONFIG.strengthStandards[state.sex][state.exercise];
    const record = getWorldRecord(bwKg);
    const thresholds = {};
    Object.entries(ratios).forEach(([tier, ratio]) => {
        const byRatio = ratio * bwKg;
        thresholds[tier] = record ? Math.min(byRatio, record.kg * CONFIG.tierCaps[tier]) : byRatio;
    });
    return { thresholds, record, top: record ? record.kg : thresholds.elite * 1.3 };
}

function getLevel(liftKg, std) {
    const t = std.thresholds;
    if (std.record && liftKg >= std.record.kg) return 'record';
    if (liftKg >= t.elite) return 'elite';
    if (liftKg >= t.advanced) return 'advanced';
    if (liftKg >= t.intermediate) return 'intermediate';
    if (liftKg >= t.novice) return 'novice';
    return 'beginner';
}

/** Position on the 5-segment scale, 0–1. The right end is the world record. */
function getScalePosition(liftKg, std) {
    const t = std.thresholds;
    const edges = [0, t.novice, t.intermediate, t.advanced, t.elite, std.top];
    for (let i = 0; i < 5; i++) {
        if (liftKg < edges[i + 1]) {
            return (i + (liftKg - edges[i]) / (edges[i + 1] - edges[i])) / 5;
        }
    }
    return 1;
}

function updateStrengthLevel(liftKg, std) {
    const segments = elements.levelScale.querySelectorAll('.level-track span');

    if (liftKg === null) {
        elements.strengthLevel.textContent = '--';
        elements.strengthLevel.className = 'level-badge';
        segments.forEach(seg => seg.classList.remove('is-reached', 'is-current'));
        elements.levelMarker.classList.remove('is-visible');
        return;
    }

    const level = getLevel(liftKg, std);
    const idx = CONFIG.levels.indexOf(level);
    elements.strengthLevel.textContent = CONFIG.levelNames[level];
    elements.strengthLevel.className = `level-badge ${level}`;

    segments.forEach((seg, i) => {
        seg.classList.toggle('is-reached', i < idx);
        seg.classList.toggle('is-current', i === idx);
    });
    elements.levelMarker.style.left = `${(getScalePosition(liftKg, std) * 100).toFixed(2)}%`;
    elements.levelMarker.classList.add('is-visible');
}

function updateWorldRecordDisplay(liftKg, std) {
    if (!std) {
        elements.wrValue.textContent = '--';
        elements.wrSub.textContent = '';
        elements.wrLabel.textContent = 'World record';
        elements.wrEnd.textContent = 'WR';
        return;
    }
    if (!std.record) {
        elements.wrLabel.textContent = 'World record';
        elements.wrValue.textContent = 'None';
        elements.wrSub.textContent = 'No federation records this lift';
        elements.wrEnd.textContent = '';
        return;
    }
    const r = std.record;
    const shown = state.unit === 'kg' ? r.kg : kgToLb(r.kg);
    elements.wrLabel.textContent = `World record · ${r.cls} kg`;
    elements.wrValue.textContent = `${formatWeight(round(shown, 1))} ${state.unit}`;
    elements.wrSub.textContent = liftKg
        ? `${r.holder}, ${r.year} · you're at ${Math.round((liftKg / r.kg) * 100)}%`
        : `${r.holder}, ${r.year}`;
    elements.wrEnd.textContent = 'WR';
}

function updateLastSavedDisplay(date = null) {
    const d = date || new Date();
    const diffMins = Math.floor((Date.now() - d) / 60000);
    let text;
    if (diffMins < 1) text = 'just now';
    else if (diffMins < 60) text = `${diffMins} min ago`;
    else text = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    elements.lastSaved.textContent = text;
}

// ============================================
// CALCULATIONS
// ============================================

function calculateTotal() {
    const barKg = getBarWeightKg();
    const platesKg = Object.entries(state.plates)
        .reduce((sum, [w, c]) => sum + toKg(parseFloat(w)) * c * 2, 0);

    const totalKg = barKg + platesKg;
    const totalLb = kgToLb(totalKg);

    checkMaxLoad(totalKg);
    updateTotalDisplay(totalKg, totalLb);
    renderPlateVisual();
    calculateStrength(totalKg);
    calculateOneRM(totalKg);
}

function checkMaxLoad(totalKg) {
    const bar = CONFIG.bars[state.barType];
    const exceeds = !!(bar && bar.maxLoad && totalKg > bar.maxLoad.kg);
    elements.maxLoadWarning.style.display = exceeds ? 'flex' : 'none';
}

/** Epley: 1RM = weight × (1 + reps / 30). Without reps, the bar is treated as a single. */
function estimateOneRmKg(totalKg) {
    if (!state.reps || state.reps <= 1) return totalKg;
    return totalKg * (1 + state.reps / 30);
}

function calculateStrength(totalKg) {
    const hasBw = state.bodyweight && state.bodyweight > 0;

    if (!hasBw) {
        elements.strengthRatio.textContent = '--';
        updateStrengthLevel(null);
        updateWorldRecordDisplay(null, null);
        elements.strengthHint.textContent = 'Enter your bodyweight to see where this lift ranks.';
        return;
    }

    const bwKg = toKg(state.bodyweight);
    const std = getStandard(bwKg);

    if (totalKg <= 0) {
        elements.strengthRatio.textContent = '--';
        updateStrengthLevel(null);
        updateWorldRecordDisplay(null, std);
        elements.strengthHint.textContent = 'Load the bar to see where this lift ranks.';
        return;
    }

    // Standards are 1RM-based, so rank the estimated max, not a multi-rep set
    const liftKg = estimateOneRmKg(totalKg);
    elements.strengthRatio.textContent = `${formatNumber(liftKg / bwKg, 2)}×`;
    updateStrengthLevel(liftKg, std);
    updateWorldRecordDisplay(liftKg, std);

    const liftName = CONFIG.exercises[state.exercise].toLowerCase();
    const basis = state.reps > 1 ? 'on your estimated 1RM' : 'on the bar';
    const level = getLevel(liftKg, std);
    const next = CONFIG.levels[CONFIG.levels.indexOf(level) + 1];
    const targetKg = next === 'record' ? (std.record && std.record.kg) : std.thresholds[next];

    if (next && targetKg) {
        const neededKg = targetKg - liftKg;
        const needed = state.unit === 'kg' ? neededKg : kgToLb(neededKg);
        const goal = next === 'record'
            ? `match the ${std.record.cls} kg world record`
            : `reach ${CONFIG.levelNames[next].toLowerCase()}`;
        elements.strengthHint.textContent =
            `${formatNumber(needed, 1)} ${state.unit} more ${basis} to ${goal} in the ${liftName}.`;
    } else if (level === 'record') {
        elements.strengthHint.textContent = `That's at or above the ${std.record.cls} kg world record. Get to a meet.`;
    } else {
        elements.strengthHint.textContent = `Elite ${liftName}: stronger than about 95% of lifters.`;
    }
}

function calculateOneRM(totalKg) {
    if (!state.reps || state.reps < 1 || totalKg <= 0) {
        elements.oneRmPrimary.textContent = '--';
        elements.oneRmSecondary.textContent = state.reps ? '' : 'Add reps';
        return;
    }

    const oneRmKg = estimateOneRmKg(totalKg);
    const oneRmLb = kgToLb(oneRmKg);
    const [p, pu, s, su] = state.unit === 'kg'
        ? [oneRmKg, 'kg', oneRmLb, 'lb']
        : [oneRmLb, 'lb', oneRmKg, 'kg'];

    elements.oneRmPrimary.textContent = `${formatNumber(p, 1)} ${pu}`;
    elements.oneRmSecondary.textContent = `${formatNumber(s, 1)} ${su}`;
}

// ============================================
// CUSTOM PLATES
// ============================================

function addCustomPlate() {
    const weight = round(parseFloat(elements.customPlateWeight.value), 2);
    if (!weight || weight <= 0) {
        elements.customPlateWeight.focus();
        return;
    }
    const exists = getPlateList().includes(weight);
    if (!exists) {
        state.customPlates.push(weight);
        state.plates[weight] = 0;
        renderPlateGrid();
        debouncedSave();
    }
    elements.customPlateWeight.value = '';
    toggleCustomPlateInput(false);
}

function removeCustomPlate(weight) {
    state.customPlates = state.customPlates.filter(w => w !== weight);
    delete state.plates[weight];
    renderPlateGrid();
    calculateTotal();
    debouncedSave();
}

function toggleCustomPlateInput(show) {
    elements.customPlateContainer.style.display = show ? 'grid' : 'none';
    elements.addPlateBtn.style.display = show ? 'none' : 'inline-flex';
    if (show) elements.customPlateWeight.focus();
    else elements.addPlateBtn.focus();
}

// ============================================
// UNIT CONVERSION
// ============================================

/** Snap a standard plate to the nearest standard plate in the other unit */
function nearestStandard(weightInNewUnit, unit) {
    return CONFIG.plates[unit].reduce((best, w) =>
        Math.abs(w - weightInNewUnit) < Math.abs(best - weightInNewUnit) ? w : best);
}

function switchUnit(newUnit) {
    if (newUnit === state.unit) return;
    const convert = w => (newUnit === 'kg' ? lbToKg(w) : kgToLb(w));

    if (state.customBarWeight !== null) {
        state.customBarWeight = round(convert(state.customBarWeight), 1);
    }

    if (state.bodyweight) {
        state.bodyweight = round(convert(state.bodyweight), 1);
        elements.bodyweight.value = state.bodyweight;
    }

    const oldCustom = state.customPlates;
    const newCustom = oldCustom.map(w => round(convert(w), 2));

    const newPlates = {};
    Object.entries(state.plates).forEach(([w, count]) => {
        const weight = parseFloat(w);
        const customIdx = oldCustom.indexOf(weight);
        const newWeight = customIdx >= 0
            ? newCustom[customIdx]
            : nearestStandard(convert(weight), newUnit);
        newPlates[newWeight] = (newPlates[newWeight] || 0) + count;
    });

    state.customPlates = newCustom;
    state.plates = newPlates;
    state.unit = newUnit;

    updateUnitDisplay();
    updateBarDisplay();
    renderPlateGrid();
    calculateTotal();
    debouncedSave();
}

// ============================================
// EVENTS
// ============================================

function syncSexRadios() {
    elements.sexRadios.forEach(r => { r.checked = r.value === state.sex; });
}

function changePlate(weight, delta) {
    const next = Math.max(0, (state.plates[weight] || 0) + delta);
    state.plates[weight] = next;
    updatePlateGrid();
    calculateTotal();
    debouncedSave();
}

function setupEventListeners() {
    elements.unitBtns.forEach(btn => {
        btn.addEventListener('click', () => switchUnit(btn.dataset.unit));
    });

    elements.barRadios.forEach(radio => {
        radio.addEventListener('change', e => {
            state.barType = e.target.value;
            if (state.barType !== 'custom') {
                state.customBarWeight = null;
                elements.customBarWeight.value = '';
            }
            updateBarDisplay();
            calculateTotal();
            debouncedSave();
            if (state.barType === 'custom') elements.customBarWeight.focus();
        });
    });

    elements.customBarWeight.addEventListener('input', e => {
        state.customBarWeight = parseFloat(e.target.value) || null;
        calculateTotal();
        debouncedSave();
    });

    // One delegated listener for every plate tile
    elements.plateGrid.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const weight = parseFloat(btn.dataset.weight);
        if (btn.classList.contains('btn-increase')) changePlate(weight, 1);
        else if (btn.classList.contains('btn-decrease')) changePlate(weight, -1);
        else if (btn.classList.contains('plate-remove')) removeCustomPlate(weight);
    });

    elements.addPlateBtn.addEventListener('click', () => toggleCustomPlateInput(true));
    elements.confirmPlateBtn.addEventListener('click', addCustomPlate);
    elements.cancelPlateBtn.addEventListener('click', () => {
        elements.customPlateWeight.value = '';
        toggleCustomPlateInput(false);
    });
    elements.customPlateWeight.addEventListener('keydown', e => {
        if (e.key === 'Enter') addCustomPlate();
        if (e.key === 'Escape') elements.cancelPlateBtn.click();
    });

    elements.bodyweight.addEventListener('input', e => {
        state.bodyweight = parseFloat(e.target.value) || null;
        calculateTotal();
        debouncedSave();
    });

    elements.exercise.addEventListener('change', e => {
        state.exercise = e.target.value;
        calculateTotal();
        debouncedSave();
    });

    elements.sexRadios.forEach(radio => {
        radio.addEventListener('change', e => {
            state.sex = e.target.value;
            calculateTotal();
            debouncedSave();
        });
    });

    elements.reps.addEventListener('input', e => {
        const reps = parseInt(e.target.value, 10);
        state.reps = reps > 0 ? Math.min(reps, 15) : null;
        calculateTotal();
        debouncedSave();
    });

    elements.resetBtn.addEventListener('click', () => {
        if (confirm('Clear the bar, plates and strength inputs?')) {
            clearState();
            resetToDefaults();
        }
    });

    window.addEventListener('resize', debounce(fitBarbell, 100));

    // Mobile: show compact total once the scoreboard leaves the viewport
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
            elements.miniTotal.classList.toggle('is-visible', !entry.isIntersecting);
        }).observe(elements.totalValue);
    }
}

// ============================================
// RESET
// ============================================

function resetToDefaults() {
    Object.assign(state, {
        unit: 'kg',
        barType: 'olympic',
        customBarWeight: null,
        plates: {},
        customPlates: [],
        bodyweight: null,
        exercise: 'bench',
        reps: null,
        sex: 'male'
    });

    elements.customBarWeight.value = '';
    elements.bodyweight.value = '';
    elements.reps.value = '';
    elements.exercise.value = 'bench';
    syncSexRadios();
    elements.lastSaved.textContent = 'Not yet';
    toggleCustomPlateInput(false);

    updateUnitDisplay();
    updateBarDisplay();
    renderPlateGrid();
    calculateTotal();
}

// ============================================
// INIT
// ============================================

const debouncedSave = debounce(saveState, 500);

function init() {
    if (loadState()) {
        elements.customBarWeight.value = state.customBarWeight || '';
        elements.bodyweight.value = state.bodyweight || '';
        elements.exercise.value = state.exercise;
        elements.reps.value = state.reps || '';
    }
    syncSexRadios();
    updateUnitDisplay();
    updateBarDisplay();
    setupEventListeners();
    renderPlateGrid();
    calculateTotal();
}

document.addEventListener('DOMContentLoaded', init);
