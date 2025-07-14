// Constants
const TOTAL_TREATMENT_DAYS = 90;
const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const HEBREW_MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

// DOM Elements
const setupContainer = document.getElementById('setup-container');
const mainContainer = document.getElementById('main-container');
const startDateInput = document.getElementById('start-date');
const saveStartDateBtn = document.getElementById('save-start-date');
const prevDayBtn = document.getElementById('prev-day');
const nextDayBtn = document.getElementById('next-day');
const currentDateEl = document.getElementById('current-date');
const medicationsContainer = document.getElementById('medications-container');
const progressGrid = document.getElementById('progress-grid');

// State variables
let startDate = null;
let currentViewDate = new Date();
let medicationData = {
    // Structure will be: {day1: {med1: [true, false, true, false], med2: [...]}, day2: {...}}
};

// Initialize app
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    // Check if we have a start date saved
    const savedStartDate = localStorage.getItem('medicationStartDate');
    
    if (savedStartDate) {
        startDate = new Date(savedStartDate);
        loadMedicationData();
        showMainView();
        renderCurrentDay();
        renderProgressGrid();
    } else {
        // Set default date to today
        const today = new Date();
        startDateInput.value = formatDateForInput(today);
        showSetupView();
    }
    
    // Event listeners
    saveStartDateBtn.addEventListener('click', handleStartDateSave);
    prevDayBtn.addEventListener('click', navigateToPreviousDay);
    nextDayBtn.addEventListener('click', navigateToNextDay);
}

// Date handling functions
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateForDisplay(date) {
    const dayOfWeek = HEBREW_DAYS[date.getDay()];
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `יום ${dayOfWeek}, ${dayOfMonth}.${String(month).padStart(2, '0')}.${year}`;
}

function getDayNumber(date) {
    const startTime = startDate.getTime();
    const currentTime = date.getTime();
    const diffTime = currentTime - startTime;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
}

// View management
function showSetupView() {
    setupContainer.classList.remove('hidden');
    mainContainer.classList.add('hidden');
}

function showMainView() {
    setupContainer.classList.add('hidden');
    mainContainer.classList.remove('hidden');
}

// Event handlers
function handleStartDateSave() {
    const inputDate = startDateInput.value;
    if (!inputDate) {
        alert('נא להזין תאריך תחילת טיפול');
        return;
    }
    
    startDate = new Date(inputDate);
    localStorage.setItem('medicationStartDate', startDate.toISOString());
    
    // Initialize with empty medication data
    medicationData = {};
    saveMedicationData();
    
    // Show main view and set current view to start date
    currentViewDate = new Date(startDate);
    showMainView();
    renderCurrentDay();
    renderProgressGrid();
}

function navigateToPreviousDay() {
    const newDate = new Date(currentViewDate);
    newDate.setDate(currentViewDate.getDate() - 1);
    
    // Don't go before start date
    if (newDate >= startDate) {
        currentViewDate = newDate;
        renderCurrentDay();
    }
}

function navigateToNextDay() {
    const newDate = new Date(currentViewDate);
    newDate.setDate(currentViewDate.getDate() + 1);
    
    // Don't go beyond 90 days of treatment
    const dayNumber = getDayNumber(newDate);
    if (dayNumber <= TOTAL_TREATMENT_DAYS) {
        currentViewDate = newDate;
        renderCurrentDay();
    }
}

function navigateToDay(dayNumber) {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + dayNumber - 1);
    currentViewDate = newDate;
    renderCurrentDay();
}

// Medication data management
function getMedicationsForDay(dayNumber) {
    const medications = [];
    
    // FML (Steroids)
    if (dayNumber <= 30) {
        medications.push({
            id: 'fml',
            name: 'FML (סטרואידים)',
            doses: 4
        });
    } else if (dayNumber <= 60) {
        medications.push({
            id: 'fml',
            name: 'FML (סטרואידים)',
            doses: 2
        });
    } else if (dayNumber <= 90) {
        medications.push({
            id: 'fml',
            name: 'FML (סטרואידים)',
            doses: 1
        });
    }
    
    // Vigamox (Antibiotics)
    if (dayNumber <= 7) {
        medications.push({
            id: 'vigamox',
            name: 'Vigamox (אנטיביוטיקה)',
            doses: 4
        });
    }
    
    // Artificial Tears
    if (dayNumber <= 90) {
        medications.push({
            id: 'tears',
            name: 'דמעות מלאכותיות',
            doses: 5
        });
    }
    
    // Pain Relief Drops
    if (dayNumber <= 3) {
        medications.push({
            id: 'pain',
            name: 'Dicloftil/Nevanac (משכך כאבים)',
            doses: 6
        });
    }
    
    return medications;
}

function loadMedicationData() {
    const savedData = localStorage.getItem('medicationData');
    if (savedData) {
        medicationData = JSON.parse(savedData);
    }
}

function saveMedicationData() {
    localStorage.setItem('medicationData', JSON.stringify(medicationData));
}

function getDosesForDay(dateKey, medicationId) {
    if (!medicationData[dateKey]) {
        medicationData[dateKey] = {};
    }
    
    if (!medicationData[dateKey][medicationId]) {
        // Initialize with all doses not taken
        const dayNumber = getDayNumber(new Date(dateKey));
        const medication = getMedicationsForDay(dayNumber).find(med => med.id === medicationId);
        if (medication) {
            medicationData[dateKey][medicationId] = Array(medication.doses).fill(false);
        } else {
            medicationData[dateKey][medicationId] = [];
        }
    }
    
    return medicationData[dateKey][medicationId];
}

function toggleDose(dateKey, medicationId, doseIndex) {
    const doses = getDosesForDay(dateKey, medicationId);
    doses[doseIndex] = !doses[doseIndex];
    saveMedicationData();
    renderCurrentDay();
    renderProgressGrid();
}

// Rendering functions
function renderCurrentDay() {
    const dayNumber = getDayNumber(currentViewDate);
    
    // Format and display the current date
    const dateFormatted = formatDateForDisplay(currentViewDate);
    currentDateEl.textContent = `${dateFormatted} - יום ${dayNumber} לטיפול`;
    
    // Clear medications container
    medicationsContainer.innerHTML = '';
    
    // Only show medications if we're in the treatment period
    if (dayNumber > 0 && dayNumber <= TOTAL_TREATMENT_DAYS) {
        const dateKey = formatDateForInput(currentViewDate);
        const medications = getMedicationsForDay(dayNumber);
        
        medications.forEach(medication => {
            const doses = getDosesForDay(dateKey, medication.id);
            
            const medicationCard = document.createElement('div');
            medicationCard.className = 'medication-card';
            
            const medicationHeader = document.createElement('div');
            medicationHeader.className = 'medication-header';
            
            const medicationName = document.createElement('h3');
            medicationName.textContent = medication.name;
            
            medicationHeader.appendChild(medicationName);
            medicationCard.appendChild(medicationHeader);
            
            const doseList = document.createElement('ul');
            doseList.className = 'dose-list';
            
            for (let i = 0; i < medication.doses; i++) {
                const doseItem = document.createElement('li');
                doseItem.className = 'dose-item';
                
                const doseLabel = document.createElement('span');
                doseLabel.textContent = `מנה ${i + 1}`;
                if (doses[i]) {
                    doseLabel.classList.add('dose-taken');
                }
                
                const doseButton = document.createElement('button');
                if (doses[i]) {
                    doseButton.textContent = 'נלקח ✓';
                    doseButton.className = 'btn taken-btn';
                } else {
                    doseButton.textContent = 'לקחתי';
                    doseButton.className = 'btn take-btn';
                }
                doseButton.addEventListener('click', () => toggleDose(dateKey, medication.id, i));
                
                doseItem.appendChild(doseLabel);
                doseItem.appendChild(doseButton);
                doseList.appendChild(doseItem);
            }
            
            medicationCard.appendChild(doseList);
            medicationsContainer.appendChild(medicationCard);
        });
    } else if (dayNumber <= 0) {
        const message = document.createElement('p');
        message.textContent = 'הטיפול טרם התחיל';
        medicationsContainer.appendChild(message);
    } else {
        const message = document.createElement('p');
        message.textContent = 'הטיפול הסתיים';
        medicationsContainer.appendChild(message);
    }
}

function renderProgressGrid() {
    progressGrid.innerHTML = '';
    
    for (let day = 1; day <= TOTAL_TREATMENT_DAYS; day++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + day - 1);
        const dateKey = formatDateForInput(dayDate);
        
        const dayBox = document.createElement('div');
        dayBox.className = 'day-box';
        dayBox.textContent = day;
        dayBox.addEventListener('click', () => navigateToDay(day));
        
        // Calculate day status
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (dayDate > today) {
            // Future day
            dayBox.classList.add('day-future');
        } else {
            // Current or past day
            const medications = getMedicationsForDay(day);
            let totalDoses = 0;
            let takenDoses = 0;
            
            medications.forEach(med => {
                const doses = getDosesForDay(dateKey, med.id);
                totalDoses += doses.length;
                takenDoses += doses.filter(taken => taken).length;
            });
            
            if (totalDoses === 0) {
                dayBox.classList.add('day-empty');
            } else if (takenDoses === 0) {
                dayBox.classList.add('day-empty');
            } else if (takenDoses < totalDoses) {
                dayBox.classList.add('day-partial');
            } else {
                dayBox.classList.add('day-complete');
            }
        }
        
        // Highlight current view day
        if (formatDateForInput(dayDate) === formatDateForInput(currentViewDate)) {
            dayBox.classList.add('day-current');
        }
        
        progressGrid.appendChild(dayBox);
    }
}
