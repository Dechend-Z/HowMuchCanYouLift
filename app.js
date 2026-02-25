/**
 * ============================================
 * BARBELL CALCULATOR
 * Modular JavaScript Application
 * ============================================
 */

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    // Conversion factor
    KG_TO_LB: 2.20462,

    // Default plate weights
    plates: {
        kg: [25, 20, 15, 10, 5, 2.5, 1.25],
        lb: [55, 45, 35, 25, 15, 10, 5, 2.5]
    },

    // Bar definitions (weights in kg and lb)
    bars: {
        olympic: { kg: 20, lb: 45, name: 'Olympic Bar', maxLoad: { kg: 500, lb: 1100 } },
        womens: { kg: 15, lb: 35, name: "Women's Bar", maxLoad: { kg: 350, lb: 770 } },
        training: { kg: 10, lb: 22, name: 'Training Bar', maxLoad: { kg: 250, lb: 550 } }
    },

    // Strength standards (ratio = lift weight / bodyweight)
    strengthStandards: {
        bench: {
            beginner: 0.75,
            novice: 1.0,
            intermediate: 1.5,
            advanced: 2.0,
            elite: 2.5
        },
        squat: {
            beginner: 0.8,
            novice: 1.2,
            intermediate: 1.6,
            advanced: 2.2,
            elite: 2.8
        },
        deadlift: {
            beginner: 1.0,
            novice: 1.5,
            intermediate: 2.0,
            advanced: 2.5,
            elite: 3.0
        },
        ohp: {
            beginner: 0.5,
            novice: 0.75,
            intermediate: 1.0,
            advanced: 1.3,
            elite: 1.6
        }
    },

    // Exercise display names
    exercises: {
        bench: 'Bench Press',
        squat: 'Squat',
        deadlift: 'Deadlift',
        ohp: 'Overhead Press'
    },

    // LocalStorage key
    storageKey: 'barbellCalculatorData'
};

// ============================================
// APPLICATION STATE
// ============================================

const state = {
    unit: 'kg',                    // Current unit: 'kg' or 'lb'
    barType: 'olympic',            // Selected bar type
    customBarWeight: null,         // Custom bar weight in current unit
    plates: {},                    // Plate counts: { weight: count }
    customPlates: [],              // Array of custom plate weights
    bodyweight: null,              // User's bodyweight
    exercise: 'bench',             // Selected exercise
    reps: null                     // Reps for 1RM calculation
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert kilograms to pounds
 */
function kgToLb(kg) {
    return kg * CONFIG.KG_TO_LB;
}

/**
 * Convert pounds to kilograms
 */
function lbToKg(lb) {
    return lb / CONFIG.KG_TO_LB;
}

/**
 * Format number for display
 */
function formatNumber(num, decimals = 1) {
    if (num === null || num === undefined || isNaN(num)) return '--';
    return num.toFixed(decimals);
}

/**
 * Get plate color based on weight (IWF standard for kg)
 */
function getPlateColor(weight) {
    const colorMap = {
        25: 'var(--plate-25)',
        20: 'var(--plate-20)',
        15: 'var(--plate-15)',
        10: 'var(--plate-10)',
        5: 'var(--plate-5)',
        2.5: 'var(--plate-2-5)',
        1.25: 'var(--plate-1-25)'
    };
    return colorMap[weight] || 'var(--plate-2-5)';
}

/**
 * Debounce function for save operations
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// LOCAL STORAGE FUNCTIONS
// ============================================

/**
 * Save application state to localStorage
 */
function saveState() {
    try {
        const dataToSave = {
            unit: state.unit,
            barType: state.barType,
            customBarWeight: state.customBarWeight,
            plates: state.plates,
            customPlates: state.customPlates,
            bodyweight: state.bodyweight,
            exercise: state.exercise,
            reps: state.reps,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(dataToSave));
        updateLastSavedDisplay();
    } catch (e) {
        console.warn('Failed to save state:', e);
    }
}

/**
 * Load application state from localStorage
 */
function loadState() {
    try {
        const saved = localStorage.getItem(CONFIG.storageKey);
        if (saved) {
            const data = JSON.parse(saved);
            state.unit = data.unit || 'kg';
            state.barType = data.barType || 'olympic';
            state.customBarWeight = data.customBarWeight || null;
            state.plates = data.plates || {};
            state.customPlates = data.customPlates || [];
            state.bodyweight = data.bodyweight || null;
            state.exercise = data.exercise || 'bench';
            state.reps = data.reps || null;
            
            if (data.lastSaved) {
                updateLastSavedDisplay(new Date(data.lastSaved));
            }
            return true;
        }
    } catch (e) {
        console.warn('Failed to load state:', e);
    }
    return false;
}

/**
 * Clear application state from localStorage
 */
function clearState() {
    try {
        localStorage.removeItem(CONFIG.storageKey);
    } catch (e) {
        console.warn('Failed to clear state:', e);
    }
}

// ============================================
// DOM ELEMENTS
// ============================================

const elements = {
    // Header
    unitBtns: document.querySelectorAll('.unit-btn'),
    resetBtn: document.getElementById('resetBtn'),
    lastSaved: document.getElementById('lastSaved'),
    
    // Bar selection
    barRadios: document.querySelectorAll('input[name="barType"]'),
    customBarContainer: document.getElementById('customBarContainer'),
    customBarWeight: document.getElementById('customBarWeight'),
    customBarUnit: document.getElementById('customBarUnit'),
    
    // Plates
    plateGrid: document.getElementById('plateGrid'),
    addPlateBtn: document.getElementById('addPlateBtn'),
    customPlateContainer: document.getElementById('customPlateContainer'),
    customPlateWeight: document.getElementById('customPlateWeight'),
    customPlateUnit: document.getElementById('customPlateUnit'),
    confirmPlateBtn: document.getElementById('confirmPlateBtn'),
    cancelPlateBtn: document.getElementById('cancelPlateBtn'),
    
    // Total display
    totalValue: document.getElementById('totalValue'),
    totalUnit: document.getElementById('totalUnit'),
    totalWeightSecondary: document.getElementById('totalWeightSecondary'),
    maxLoadWarning: document.getElementById('maxLoadWarning'),
    plateVisual: document.getElementById('plateVisual'),
    
    // Strength calculator
    bodyweight: document.getElementById('bodyweight'),
    bodyweightUnit: document.getElementById('bodyweightUnit'),
    exercise: document.getElementById('exercise'),
    reps: document.getElementById('reps'),
    strengthRatio: document.getElementById('strengthRatio'),
    strengthLevel: document.getElementById('strengthLevel'),
    oneRmPrimary: document.getElementById('oneRmPrimary'),
    oneRmSecondary: document.getElementById('oneRmSecondary')
};

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

/**
 * Update unit toggle display
 */
function updateUnitDisplay() {
    elements.unitBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.unit === state.unit);
    });
    
    // Update all unit labels
    elements.totalUnit.textContent = state.unit;
    elements.customBarUnit.textContent = state.unit;
    elements.customPlateUnit.textContent = state.unit;
    elements.bodyweightUnit.textContent = state.unit;
}

/**
 * Update bar selection display
 */
function updateBarDisplay() {
    elements.barRadios.forEach(radio => {
        radio.checked = radio.value === state.barType;
    });
    
    // Show/hide custom bar input
    const showCustom = state.barType === 'custom';
    elements.customBarContainer.style.display = showCustom ? 'block' : 'none';
    
    if (showCustom && state.customBarWeight !== null) {
        elements.customBarWeight.value = state.customBarWeight;
    }
}

/**
 * Get current bar weight in kg
 */
function getBarWeightKg() {
    if (state.barType === 'custom' && state.customBarWeight !== null) {
        return state.unit === 'kg' 
            ? state.customBarWeight 
            : lbToKg(state.customBarWeight);
    }
    
    const bar = CONFIG.bars[state.barType];
    return bar ? bar.kg : 20;
}

/**
 * Render plate grid
 */
function renderPlateGrid() {
    const currentPlates = state.unit === 'kg'
        ? [...CONFIG.plates.kg, ...state.customPlates]
        : [...CONFIG.plates.lb, ...state.customPlates];
    
    // Sort plates descending
    currentPlates.sort((a, b) => b - a);
    
    elements.plateGrid.innerHTML = currentPlates.map(weight => {
        const count = state.plates[weight] || 0;
        const displayWeight = formatNumber(weight, weight % 1 !== 0 ? 1 : 0);
        const isCustom = state.customPlates.includes(weight);
        
        return `
            <div class="plate-item" data-weight="${weight}">
                <div class="plate-header">
                    <span class="plate-weight">${displayWeight} ${state.unit}</span>
                    ${isCustom ? `
                        <button class="plate-remove" data-weight="${weight}" title="Remove plate">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
                <div class="plate-controls">
                    <button class="plate-btn btn-decrease" data-weight="${weight}">−</button>
                    <span class="plate-count">${count}</span>
                    <button class="plate-btn btn-increase" data-weight="${weight}">+</button>
                </div>
                <div class="plate-subtext">${count > 0 ? formatNumber(count * weight * 2, 1) : '0'} ${state.unit} total</div>
            </div>
        `;
    }).join('');
    
    setupPlateEventListeners();
}

/**
 * Setup plate event listeners
 */
function setupPlateEventListeners() {
    // Increase buttons
    document.querySelectorAll('.btn-increase').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const weight = parseFloat(e.target.dataset.weight);
            state.plates[weight] = (state.plates[weight] || 0) + 1;
            updatePlateGrid();
            calculateTotal();
            debouncedSave();
        });
    });
    
    // Decrease buttons
    document.querySelectorAll('.btn-decrease').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const weight = parseFloat(e.target.dataset.weight);
            if (state.plates[weight] > 0) {
                state.plates[weight]--;
                updatePlateGrid();
                calculateTotal();
                debouncedSave();
            }
        });
    });
    
    // Remove custom plates
    document.querySelectorAll('.plate-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const weight = parseFloat(e.target.dataset.weight);
            removeCustomPlate(weight);
        });
    });
}

/**
 * Update plate grid counts only (for performance)
 */
function updatePlateGrid() {
    document.querySelectorAll('.plate-item').forEach(item => {
        const weight = parseFloat(item.dataset.weight);
        const count = state.plates[weight] || 0;
        item.querySelector('.plate-count').textContent = count;
        item.querySelector('.plate-subtext').textContent = 
            `${count > 0 ? formatNumber(count * weight * 2, 1) : '0'} ${state.unit} total`;
    });
}

/**
 * Render plate visual (barbell with plates - mirrored left side)
 */
function renderPlateVisual() {
    const platesWithCount = Object.entries(state.plates)
        .filter(([_, count]) => count > 0)
        .sort(([a], [b]) => parseFloat(b) - parseFloat(a));
    
    if (platesWithCount.length === 0) {
        elements.plateVisual.innerHTML = `
            <div class="plate-visual-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="7" width="20" height="10" rx="1"/>
                    <path d="M12 7v10"/>
                </svg>
                <span>No plates loaded</span>
            </div>
        `;
        return;
    }
    
    const createPlateDiscs = (weight, count) => {
        const weightKg = state.unit === 'kg' ? weight : lbToKg(weight);
        const color = getPlateColor(weightKg);
        
        // Determine size based on weight (heavier = thicker & taller)
        let size = '5';
        if (weight >= 25) size = '25';
        else if (weight >= 20) size = '20';
        else if (weight >= 15) size = '15';
        else if (weight >= 10) size = '10';
        else if (weight >= 5) size = '5';
        else if (weight >= 2.5) size = '2.5';
        else if (weight >= 1.25) size = '1.25';
        
        return Array(count).fill(0).map(() => 
            `<div class="plate-disc" data-size="${size}" style="background: ${color};"></div>`
        ).join('');
    };
    
    // Calculate total sleeve width for barbell sleeve
    let totalSleeveWidth = 0;
    platesWithCount.forEach(([weight, count]) => {
        const weightKg = state.unit === 'kg' ? weight : lbToKg(weight);
        let size = '5';
        if (weightKg >= 25) size = '25';
        else if (weightKg >= 20) size = '20';
        else if (weightKg >= 15) size = '15';
        else if (weightKg >= 10) size = '10';
        else if (weightKg >= 5) size = '5';
        else if (weightKg >= 2.5) size = '2.5';
        else if (weightKg >= 1.25) size = '1.25';
        
        const widths = { '25': 20, '20': 18, '15': 16, '10': 14, '5': 12, '2.5': 10, '1.25': 8 };
        totalSleeveWidth += (widths[size] || 12) * count;
    });
    
    // Sleeve width = total plates width + small gaps
    const sleeveWidth = totalSleeveWidth + (platesWithCount.reduce((sum, [_, c]) => sum + c, 0) * 2);
    
    elements.plateVisual.innerHTML = `
        <!-- Barbell sleeve behind plates -->
        <div class="barbell-sleeve" style="width: ${sleeveWidth * 2 + 30}px;"></div>
        
        <!-- Left plate stack -->
        <div class="plate-stack left">
            ${platesWithCount.map(([weight, count]) => createPlateDiscs(weight, count)).join('')}
        </div>
        
        <!-- Center barbell collar -->
        <div class="barbell-center"></div>
        
        <!-- Right plate stack -->
        <div class="plate-stack right">
            ${platesWithCount.map(([weight, count]) => createPlateDiscs(weight, count)).join('')}
        </div>
    `;
}

/**
 * Update total weight display with animation
 */
function updateTotalDisplay(totalKg, totalLb) {
    const primaryValue = state.unit === 'kg' ? totalKg : totalLb;
    const secondaryValue = state.unit === 'kg' ? totalLb : totalKg;
    const secondaryUnit = state.unit === 'kg' ? 'lb' : 'kg';
    
    // Animate if value changed significantly
    const currentValue = parseFloat(elements.totalValue.textContent);
    if (Math.abs(currentValue - primaryValue) > 0.01) {
        elements.totalValue.classList.add('updating');
        setTimeout(() => {
            elements.totalValue.classList.remove('updating');
        }, 300);
    }
    
    elements.totalValue.textContent = formatNumber(primaryValue, 1);
    elements.totalWeightSecondary.textContent = `${formatNumber(secondaryValue, 1)} ${secondaryUnit}`;
}

/**
 * Update strength level badge
 */
function updateStrengthLevel(ratio) {
    const standards = CONFIG.strengthStandards[state.exercise];
    let level = 'beginner';
    
    if (ratio >= standards.elite) level = 'elite';
    else if (ratio >= standards.advanced) level = 'advanced';
    else if (ratio >= standards.intermediate) level = 'intermediate';
    else if (ratio >= standards.novice) level = 'novice';
    
    elements.strengthLevel.textContent = level;
    elements.strengthLevel.className = `result-badge ${level}`;
}

/**
 * Update last saved display
 */
function updateLastSavedDisplay(date = null) {
    const d = date || new Date();
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    
    let text;
    if (diffMins < 1) {
        text = 'Just now';
    } else if (diffMins < 60) {
        text = `${diffMins} min ago`;
    } else {
        text = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    elements.lastSaved.textContent = text;
}

// ============================================
// CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate total barbell weight
 */
function calculateTotal() {
    // Get bar weight in kg
    const barWeightKg = getBarWeightKg();
    
    // Calculate plates weight (per side × 2)
    let platesWeightKg = 0;
    Object.entries(state.plates).forEach(([weight, count]) => {
        const weightKg = state.unit === 'kg' 
            ? parseFloat(weight) 
            : lbToKg(parseFloat(weight));
        platesWeightKg += weightKg * count * 2;
    });
    
    const totalKg = barWeightKg + platesWeightKg;
    const totalLb = kgToLb(totalKg);
    
    // Check max load
    checkMaxLoad(totalKg, totalLb);
    
    updateTotalDisplay(totalKg, totalLb);
    renderPlateVisual();
    
    // Update strength calculation if bodyweight is set
    if (state.bodyweight && state.bodyweight > 0) {
        calculateStrength(totalKg, totalLb);
    }
    
    // Update 1RM if reps are set
    if (state.reps && state.reps >= 1) {
        calculateOneRM(totalKg, totalLb);
    }
}

/**
 * Check if load exceeds bar maximum
 */
function checkMaxLoad(totalKg, totalLb) {
    const bar = CONFIG.bars[state.barType];
    if (!bar || !bar.maxLoad) {
        elements.maxLoadWarning.style.display = 'none';
        return;
    }
    
    const maxLoadKg = bar.maxLoad.kg;
    const maxLoadLb = bar.maxLoad.lb;
    
    const exceeds = state.unit === 'kg' 
        ? totalKg > maxLoadKg 
        : totalLb > maxLoadLb;
    
    elements.maxLoadWarning.style.display = exceeds ? 'flex' : 'none';
}

/**
 * Calculate strength ratio and level
 */
function calculateStrength(totalKg, totalLb) {
    const bodyweightKg = state.unit === 'kg'
        ? state.bodyweight
        : lbToKg(state.bodyweight);
    
    const ratio = totalKg / bodyweightKg;
    elements.strengthRatio.textContent = formatNumber(ratio, 2) + '×';
    updateStrengthLevel(ratio);
}

/**
 * Calculate estimated 1RM using Epley formula
 * Formula: 1RM = weight × (1 + reps/30)
 */
function calculateOneRM(totalKg, totalLb) {
    const reps = state.reps;
    if (reps < 1) return;
    
    const oneRmKg = totalKg * (1 + reps / 30);
    const oneRmLb = kgToLb(oneRmKg);
    
    if (state.unit === 'kg') {
        elements.oneRmPrimary.textContent = `${formatNumber(oneRmKg, 1)} kg`;
        elements.oneRmSecondary.textContent = `${formatNumber(oneRmLb, 1)} lb`;
    } else {
        elements.oneRmPrimary.textContent = `${formatNumber(oneRmLb, 1)} lb`;
        elements.oneRmSecondary.textContent = `${formatNumber(oneRmKg, 1)} kg`;
    }
}

// ============================================
// CUSTOM PLATE FUNCTIONS
// ============================================

/**
 * Add custom plate
 */
function addCustomPlate() {
    const weight = parseFloat(elements.customPlateWeight.value);
    
    if (weight && weight > 0 && !state.customPlates.includes(weight)) {
        state.customPlates.push(weight);
        state.plates[weight] = 0;
        elements.customPlateWeight.value = '';
        renderPlateGrid();
        debouncedSave();
    }
}

/**
 * Remove custom plate
 */
function removeCustomPlate(weight) {
    state.customPlates = state.customPlates.filter(w => w !== weight);
    delete state.plates[weight];
    renderPlateGrid();
    calculateTotal();
    debouncedSave();
}

/**
 * Toggle custom plate input visibility
 */
function toggleCustomPlateInput(show) {
    elements.customPlateContainer.style.display = show ? 'block' : 'none';
    elements.addPlateBtn.style.display = show ? 'none' : 'inline-flex';
    
    if (show) {
        elements.customPlateWeight.focus();
    }
}

// ============================================
// UNIT CONVERSION
// ============================================

/**
 * Switch between kg and lb
 */
function switchUnit(newUnit) {
    if (newUnit === state.unit) return;
    
    // Convert custom bar weight
    if (state.barType === 'custom' && state.customBarWeight !== null) {
        state.customBarWeight = newUnit === 'kg'
            ? lbToKg(state.customBarWeight)
            : kgToLb(state.customBarWeight);
    }
    
    // Convert bodyweight
    if (state.bodyweight) {
        state.bodyweight = newUnit === 'kg'
            ? lbToKg(state.bodyweight)
            : kgToLb(state.bodyweight);
        elements.bodyweight.value = formatNumber(state.bodyweight, 1);
    }
    
    // Convert custom plates
    state.customPlates = state.customPlates.map(w =>
        newUnit === 'kg' ? lbToKg(w) : kgToLb(w)
    );
    
    // Convert existing plates
    const newPlates = {};
    Object.entries(state.plates).forEach(([weight, count]) => {
        const newWeight = newUnit === 'kg'
            ? lbToKg(parseFloat(weight))
            : kgToLb(parseFloat(weight));
        newPlates[newWeight] = count;
    });
    state.plates = newPlates;
    
    state.unit = newUnit;
    updateUnitDisplay();
    renderPlateGrid();
    calculateTotal();
    debouncedSave();
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Unit toggle
    elements.unitBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchUnit(btn.dataset.unit);
        });
    });
    
    // Bar selection
    elements.barRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.barType = e.target.value;
            if (state.barType !== 'custom') {
                state.customBarWeight = null;
                elements.customBarWeight.value = '';
            }
            updateBarDisplay();
            calculateTotal();
            debouncedSave();
        });
    });
    
    // Custom bar weight input
    elements.customBarWeight.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        state.customBarWeight = value || null;
        calculateTotal();
        debouncedSave();
    });
    
    // Add custom plate button
    elements.addPlateBtn.addEventListener('click', () => {
        toggleCustomPlateInput(true);
    });
    
    // Confirm custom plate
    elements.confirmPlateBtn.addEventListener('click', addCustomPlate);
    
    // Cancel custom plate
    elements.cancelPlateBtn.addEventListener('click', () => {
        elements.customPlateWeight.value = '';
        toggleCustomPlateInput(false);
    });
    
    // Custom plate input enter key
    elements.customPlateWeight.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addCustomPlate();
    });
    
    // Bodyweight input
    elements.bodyweight.addEventListener('input', (e) => {
        state.bodyweight = parseFloat(e.target.value) || null;
        calculateTotal();
        debouncedSave();
    });
    
    // Exercise selection
    elements.exercise.addEventListener('change', (e) => {
        state.exercise = e.target.value;
        calculateTotal();
        debouncedSave();
    });
    
    // Reps input
    elements.reps.addEventListener('input', (e) => {
        state.reps = parseInt(e.target.value) || null;
        calculateTotal();
        debouncedSave();
    });
    
    // Reset button
    elements.resetBtn.addEventListener('click', () => {
        if (confirm('Reset all values to default?')) {
            clearState();
            resetToDefaults();
        }
    });
}

// ============================================
// RESET FUNCTION
// ============================================

function resetToDefaults() {
    state.unit = 'kg';
    state.barType = 'olympic';
    state.customBarWeight = null;
    state.plates = {};
    state.customPlates = [];
    state.bodyweight = null;
    state.exercise = 'bench';
    state.reps = null;
    
    // Reset UI inputs
    elements.customBarWeight.value = '';
    elements.bodyweight.value = '';
    elements.reps.value = '';
    elements.exercise.value = 'bench';
    elements.strengthRatio.textContent = '--';
    elements.strengthLevel.textContent = '--';
    elements.strengthLevel.className = 'result-badge';
    elements.oneRmPrimary.textContent = '--';
    elements.oneRmSecondary.textContent = '--';
    elements.lastSaved.textContent = 'Never saved';
    
    updateUnitDisplay();
    updateBarDisplay();
    renderPlateGrid();
    calculateTotal();
}

// ============================================
// DEBOUNCED SAVE
// ============================================

const debouncedSave = debounce(saveState, 500);

// ============================================
// INITIALIZATION
// ============================================

function init() {
    // Try to load saved state
    const loaded = loadState();
    
    if (loaded) {
        // Restore UI from loaded state
        updateUnitDisplay();
        updateBarDisplay();
        elements.customBarWeight.value = state.customBarWeight || '';
        elements.bodyweight.value = state.bodyweight || '';
        elements.exercise.value = state.exercise;
        elements.reps.value = state.reps || '';
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Initial render
    renderPlateGrid();
    calculateTotal();
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
