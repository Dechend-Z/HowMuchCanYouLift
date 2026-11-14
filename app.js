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

    // Ratio = lift weight / bodyweight
    strengthStandards: {
        bench: { beginner: 0.75, novice: 1.0, intermediate: 1.5, advanced: 2.0, elite: 2.5 },
        squat: { beginner: 0.8, novice: 1.2, intermediate: 1.6, advanced: 2.2, elite: 2.8 },
        deadlift: { beginner: 1.0, novice: 1.5, intermediate: 2.0, advanced: 2.5, elite: 3.0 },
        ohp: { beginner: 0.5, novice: 0.75, intermediate: 1.0, advanced: 1.3, elite: 1.6 }
    },

    levels: ['beginner', 'novice', 'intermediate', 'advanced', 'elite'],

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
    reps: null
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

function getLevel(ratio) {
    const s = CONFIG.strengthStandards[state.exercise];
    if (ratio >= s.elite) return 'elite';
    if (ratio >= s.advanced) return 'advanced';
    if (ratio >= s.intermediate) return 'intermediate';
    if (ratio >= s.novice) return 'novice';
    return 'beginner';
}

/** Position on the 5-segment scale, 0–1 */
function getScalePosition(ratio) {
    const s = CONFIG.strengthStandards[state.exercise];
    const edges = [0, s.novice, s.intermediate, s.advanced, s.elite, s.elite * 1.3];
    for (let i = 0; i < 5; i++) {
        if (ratio < edges[i + 1]) {
            return (i + (ratio - edges[i]) / (edges[i + 1] - edges[i])) / 5;
        }
    }
    return 1;
}

function updateStrengthLevel(ratio) {
    const segments = elements.levelScale.querySelectorAll('.level-track span');

    if (ratio === null) {
        elements.strengthLevel.textContent = '--';
        elements.strengthLevel.className = 'level-badge';
        segments.forEach(seg => seg.classList.remove('is-reached', 'is-current'));
        elements.levelMarker.classList.remove('is-visible');
        return;
    }

    const level = getLevel(ratio);
    const idx = CONFIG.levels.indexOf(level);
    elements.strengthLevel.textContent = level;
    elements.strengthLevel.className = `level-badge ${level}`;

    segments.forEach((seg, i) => {
        seg.classList.toggle('is-reached', i < idx);
        seg.classList.toggle('is-current', i === idx);
    });
    elements.levelMarker.style.left = `${(getScalePosition(ratio) * 100).toFixed(2)}%`;
    elements.levelMarker.classList.add('is-visible');
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

function calculateStrength(totalKg) {
    const hasBw = state.bodyweight && state.bodyweight > 0;

    if (!hasBw || totalKg <= 0) {
        elements.strengthRatio.textContent = '--';
        updateStrengthLevel(null);
        elements.strengthHint.textContent = hasBw
            ? 'Load the bar to see where this lift ranks.'
            : 'Enter your bodyweight to see where this lift ranks.';
        return;
    }

    const ratio = totalKg / toKg(state.bodyweight);
    elements.strengthRatio.textContent = `${formatNumber(ratio, 2)}×`;
    updateStrengthLevel(ratio);

    const s = CONFIG.strengthStandards[state.exercise];
    const level = getLevel(ratio);
    const next = CONFIG.levels[CONFIG.levels.indexOf(level) + 1];
    if (next) {
        const neededKg = s[next] * toKg(state.bodyweight) - totalKg;
        const needed = state.unit === 'kg' ? neededKg : kgToLb(neededKg);
        elements.strengthHint.textContent =
            `${formatNumber(needed, 1)} ${state.unit} more on the bar to reach ${next} for ${CONFIG.exercises[state.exercise].toLowerCase()}.`;
    } else {
        elements.strengthHint.textContent = `Elite ${CONFIG.exercises[state.exercise].toLowerCase()}. Nothing left to unlock.`;
    }
}

/** Epley: 1RM = weight × (1 + reps / 30) */
function calculateOneRM(totalKg) {
    if (!state.reps || state.reps < 1 || totalKg <= 0) {
        elements.oneRmPrimary.textContent = '--';
        elements.oneRmSecondary.textContent = state.reps ? '' : 'Add reps';
        return;
    }

    const oneRmKg = state.reps === 1 ? totalKg : totalKg * (1 + state.reps / 30);
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
        reps: null
    });

    elements.customBarWeight.value = '';
    elements.bodyweight.value = '';
    elements.reps.value = '';
    elements.exercise.value = 'bench';
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
    updateUnitDisplay();
    updateBarDisplay();
    setupEventListeners();
    renderPlateGrid();
    calculateTotal();
}

document.addEventListener('DOMContentLoaded', init);
