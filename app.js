// QMUL BA Politics International Relations Timetable Application
// Supabase Integration and Dynamic Timetable Generation

// Supabase Configuration
// Replace these with your actual Supabase project URL and anon key
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Application State
let timetableData = [];
let lastUpdated = null;
let refreshInterval = null;

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const timetableSectionEl = document.getElementById('timetable-section');
const errorMessageEl = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const refreshBtn = document.getElementById('refresh-btn');
const lastUpdatedEl = document.getElementById('last-updated');
const timetableGridEl = document.getElementById('timetable-grid');
const timeSlotsEl = document.getElementById('time-slots');
const dayColumnsEl = document.getElementById('day-columns');
const eventModalEl = document.getElementById('event-modal');
const closeModalBtn = document.getElementById('close-modal');

// Configuration
const CONFIG = {
    days: ['Wednesday', 'Thursday', 'Friday'],
    timeSlots: {
        start: '09:00',
        end: '18:00',
        interval: 60 // minutes
    },
    eventTypes: {
        lecture: {
            color: '#8B1A3D',
            label: 'Lecture'
        },
        seminar: {
            color: '#00539B',
            label: 'Seminar'
        },
        dissertation: {
            color: '#2E8B57',
            label: 'Dissertation Meeting'
        }
    },
    autoRefreshInterval: 30 * 60 * 1000 // 30 minutes
};

// Utility Functions
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
}

function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    return parseInt(hours) * 60 + parseInt(minutes);
}

function formatTimeFromMinutes(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function generateTimeSlots() {
    const slots = [];
    const startMinutes = parseTime(CONFIG.timeSlots.start);
    const endMinutes = parseTime(CONFIG.timeSlots.end);
    const interval = CONFIG.timeSlots.interval;
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += interval) {
        slots.push({
            time: formatTimeFromMinutes(minutes),
            minutes: minutes
        });
    }
    
    return slots;
}

function calculateEventPosition(event) {
    const startMinutes = parseTime(event.start_time);
    const endMinutes = parseTime(event.end_time);
    const slotHeight = 60; // pixels
    const minutesPerPixel = CONFIG.timeSlots.interval / slotHeight;
    
    const top = (startMinutes - parseTime(CONFIG.timeSlots.start)) / minutesPerPixel;
    const height = (endMinutes - startMinutes) / minutesPerPixel;
    
    return {
        top: `${top}px`,
        height: `${height}px`
    };
}

// Data Fetching
async function fetchTimetableData() {
    try {
        showLoading();
        
        const { data, error } = await supabase
            .from('timetable_events')
            .select('*')
            .order('day', { ascending: true })
            .order('start_time', { ascending: true });
        
        if (error) {
            throw error;
        }
        
        timetableData = data || [];
        lastUpdated = new Date();
        
        hideLoading();
        hideError();
        showTimetable();
        generateTimetable();
        updateLastUpdated();
        
    } catch (error) {
        console.error('Error fetching timetable data:', error);
        hideLoading();
        showError(error.message);
    }
}

// UI State Management
function showLoading() {
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    timetableSectionEl.style.display = 'none';
}

function hideLoading() {
    loadingEl.style.display = 'none';
}

function showError(message) {
    errorMessageEl.textContent = message;
    errorEl.style.display = 'block';
    timetableSectionEl.style.display = 'none';
}

function hideError() {
    errorEl.style.display = 'none';
}

function showTimetable() {
    timetableSectionEl.style.display = 'block';
}

function updateLastUpdated() {
    if (lastUpdated) {
        lastUpdatedEl.textContent = lastUpdated.toLocaleString();
    }
}

// Timetable Generation
function generateTimetable() {
    generateTimeSlotsColumn();
    generateDayColumns();
    populateEvents();
}

function generateTimeSlotsColumn() {
    const timeSlots = generateTimeSlots();
    timeSlotsEl.innerHTML = '';
    
    timeSlots.forEach(slot => {
        const timeSlotEl = document.createElement('div');
        timeSlotEl.className = 'time-slot';
        timeSlotEl.textContent = formatTime(slot.time);
        timeSlotsEl.appendChild(timeSlotEl);
    });
}

function generateDayColumns() {
    dayColumnsEl.innerHTML = '';
    
    CONFIG.days.forEach(day => {
        const dayColumnEl = document.createElement('div');
        dayColumnEl.className = 'day-column';
        dayColumnEl.innerHTML = `
            <div class="day-header">${day}</div>
            <div class="day-slots" id="slots-${day.toLowerCase()}">
                ${generateDaySlots()}
            </div>
        `;
        dayColumnsEl.appendChild(dayColumnEl);
    });
}

function generateDaySlots() {
    const timeSlots = generateTimeSlots();
    return timeSlots.map(() => '<div class="day-slot"></div>').join('');
}

function populateEvents() {
    // Clear existing events
    document.querySelectorAll('.event').forEach(event => event.remove());
    
    // Group events by day
    const eventsByDay = {};
    CONFIG.days.forEach(day => {
        eventsByDay[day] = [];
    });
    
    timetableData.forEach(event => {
        if (eventsByDay[event.day]) {
            eventsByDay[event.day].push(event);
        }
    });
    
    // Create event elements
    Object.entries(eventsByDay).forEach(([day, events]) => {
        const daySlotsEl = document.getElementById(`slots-${day.toLowerCase()}`);
        if (!daySlotsEl) return;
        
        events.forEach(event => {
            const eventEl = createEventElement(event);
            const position = calculateEventPosition(event);
            
            eventEl.style.top = position.top;
            eventEl.style.height = position.height;
            
            daySlotsEl.appendChild(eventEl);
        });
    });
}

function createEventElement(event) {
    const eventEl = document.createElement('div');
    eventEl.className = `event ${event.event_type}`;
    eventEl.innerHTML = `
        <div class="event-title">${event.module_name}</div>
        <div class="event-time">${formatTime(event.start_time)} - ${formatTime(event.end_time)}</div>
        <div class="event-location">${event.location}</div>
    `;
    
    // Add click handler for modal
    eventEl.addEventListener('click', () => showEventModal(event));
    
    return eventEl;
}

// Modal Management
function showEventModal(event) {
    const modal = eventModalEl;
    const title = modal.querySelector('#modal-title');
    const module = modal.querySelector('#modal-module');
    const code = modal.querySelector('#modal-code');
    const type = modal.querySelector('#modal-type');
    const time = modal.querySelector('#modal-time');
    const location = modal.querySelector('#modal-location');
    const lecturer = modal.querySelector('#modal-lecturer');
    
    title.textContent = event.module_name;
    module.textContent = event.module_name;
    code.textContent = event.module_code || 'N/A';
    type.textContent = CONFIG.eventTypes[event.event_type]?.label || event.event_type;
    time.textContent = `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`;
    location.textContent = event.location;
    lecturer.textContent = event.lecturer || 'TBA';
    
    modal.style.display = 'flex';
}

function hideEventModal() {
    eventModalEl.style.display = 'none';
}

// Auto-refresh functionality
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(() => {
        fetchTimetableData();
    }, CONFIG.autoRefreshInterval);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Event Listeners
function setupEventListeners() {
    // Retry button
    retryBtn.addEventListener('click', () => {
        fetchTimetableData();
    });
    
    // Refresh button
    refreshBtn.addEventListener('click', () => {
        fetchTimetableData();
    });
    
    // Modal close
    closeModalBtn.addEventListener('click', hideEventModal);
    
    // Modal backdrop click
    eventModalEl.addEventListener('click', (e) => {
        if (e.target === eventModalEl) {
            hideEventModal();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && eventModalEl.style.display === 'flex') {
            hideEventModal();
        }
    });
    
    // Page visibility change (pause/resume auto-refresh)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoRefresh();
        } else {
            startAutoRefresh();
        }
    });
}

// Error Handling
function handleError(error) {
    console.error('Application error:', error);
    
    let errorMessage = 'An unexpected error occurred.';
    
    if (error.message) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    
    showError(errorMessage);
}

// Application Initialization
async function init() {
    try {
        setupEventListeners();
        
        // Check if Supabase is configured
        if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
            showError('Please configure your Supabase URL and API key in the JavaScript file.');
            return;
        }
        
        // Load initial data
        await fetchTimetableData();
        
        // Start auto-refresh
        startAutoRefresh();
        
    } catch (error) {
        handleError(error);
    }
}

// Initialize application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatTime,
        parseTime,
        generateTimeSlots,
        calculateEventPosition
    };
}