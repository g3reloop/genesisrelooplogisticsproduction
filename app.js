/* global supabase */
(function () {
  'use strict';

  // ====== Configuration ======
  // Replace with your Supabase project details
  const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
  const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';

  // Days and time slots configuration
  const DAYS = ['Wednesday', 'Thursday', 'Friday'];
  const TIME_START = '09:00';
  const TIME_END = '18:00';
  const SLOT_MINUTES = 60;

  // Event type to color fallback (if color_code not provided)
  const TYPE_TO_CLASS = {
    lecture: 'lecture',
    seminar: 'seminar',
    dissertation: 'dissertation'
  };

  const state = {
    client: null,
    slots: [],
  };

  // ====== Utilities ======
  function parseTimeToMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  function minutesToHHMM(mins) {
    const h = String(Math.floor(mins / 60)).padStart(2, '0');
    const m = String(mins % 60).padStart(2, '0');
    return `${h}:${m}`;
  }

  function generateTimeSlots(startHHMM, endHHMM, intervalMinutes) {
    const start = parseTimeToMinutes(startHHMM);
    const end = parseTimeToMinutes(endHHMM);
    const slots = [];
    for (let t = start; t < end; t += intervalMinutes) {
      slots.push(minutesToHHMM(t));
    }
    return slots;
  }

  function setStatus(message, type = 'info') {
    const el = document.getElementById('status-message');
    if (!el) return;
    el.textContent = message || '';
    el.dataset.type = type;
  }

  function setLastUpdated(date = new Date()) {
    const timeEl = document.getElementById('last-updated');
    if (!timeEl) return;
    timeEl.dateTime = date.toISOString();
    timeEl.textContent = date.toLocaleString();
  }

  // ====== Table Generation ======
  function buildEmptyTable(slots) {
    const tbody = document.getElementById('timetable-body');
    tbody.innerHTML = '';

    for (const slot of slots) {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = `${slot}`;
      tr.appendChild(th);

      // Create an empty cell for each day
      for (let d = 0; d < DAYS.length; d += 1) {
        const td = document.createElement('td');
        td.dataset.day = DAYS[d];
        td.dataset.time = slot;
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }
  }

  // Locate a cell by day and time
  function getCell(day, timeHHMM) {
    return document.querySelector(`td[data-day="${day}"][data-time="${timeHHMM}"]`);
  }

  // Remove cells for rowSpan handling below a starting row
  function removeCellsBelow(dayColIndex, startRowIndex, span) {
    const tbody = document.getElementById('timetable-body');
    for (let i = 1; i < span; i += 1) {
      const row = tbody.rows[startRowIndex + i];
      if (!row) break;
      // dayColIndex accounts for the leading time th
      const cell = row.cells[dayColIndex];
      if (cell) {
        row.deleteCell(dayColIndex);
      }
    }
  }

  function createEventElement(event) {
    const el = document.createElement('div');
    const typeClass = TYPE_TO_CLASS[event.event_type] || 'lecture';
    el.className = `event ${typeClass}`;
    if (event.color_code) {
      el.style.backgroundColor = event.color_code;
    }
    el.tabIndex = 0;
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', `${event.event_type} ${event.module_name} from ${event.start_time} to ${event.end_time} at ${event.location}`);

    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = `${event.module_name}${event.module_code ? ` (${event.module_code})` : ''}`;
    el.appendChild(title);

    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = `${event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)} · ${event.start_time}–${event.end_time}${event.lecturer ? ` · ${event.lecturer}` : ''}`;
    el.appendChild(meta);

    const location = document.createElement('span');
    location.className = 'location';
    location.textContent = `${event.location}`;
    el.appendChild(location);

    return el;
  }

  function renderEvents(slots, events) {
    // Build base table first
    buildEmptyTable(slots);

    const tbody = document.getElementById('timetable-body');
    const timeToRowIndex = new Map(slots.map((t, i) => [t, i]));

    // Column index per day in tbody rows: 0 is time th, then 1..DAYS.length
    const dayToColIndex = new Map(DAYS.map((d, idx) => [d, idx + 1]));

    // Sort events by day and start time
    const dayOrder = new Map(DAYS.map((d, i) => [d, i]));
    events.sort((a, b) => {
      const dayCmp = (dayOrder.get(a.day) ?? 0) - (dayOrder.get(b.day) ?? 0);
      if (dayCmp !== 0) return dayCmp;
      return a.start_time.localeCompare(b.start_time);
    });

    for (const evt of events) {
      const start = evt.start_time.slice(0,5);
      const end = evt.end_time.slice(0,5);
      const startRow = timeToRowIndex.get(start);
      if (startRow === undefined) continue; // out of visible range
      const endRowMaybe = timeToRowIndex.get(end);
      const startMin = parseTimeToMinutes(start);
      const endMin = parseTimeToMinutes(end);
      const span = Math.max(1, Math.ceil((endMin - startMin) / SLOT_MINUTES));

      const colIndex = dayToColIndex.get(evt.day);
      if (!colIndex) continue;

      const row = tbody.rows[startRow];
      const cell = row.cells[colIndex];
      if (!cell) continue;

      const eventEl = createEventElement(evt);
      cell.appendChild(eventEl);
      cell.rowSpan = span;

      // Remove cells below for correct rowSpan display
      removeCellsBelow(colIndex, startRow, span);
    }
  }

  // ====== Data fetching ======
  async function fetchEvents() {
    if (!state.client) throw new Error('Supabase client not initialized');
    const { data, error } = await state.client
      .from('timetable_events')
      .select('*')
      .in('day', DAYS)
      .order('day', { ascending: true })
      .order('start_time', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function refresh() {
    try {
      setStatus('Loading timetable…');
      const slots = state.slots;
      const events = await fetchEvents();
      renderEvents(slots, events);
      setLastUpdated(new Date());
      setStatus('');
    } catch (err) {
      console.error(err);
      setStatus('Failed to load timetable. Check your network or Supabase keys.', 'error');
    }
  }

  // ====== Init ======
  function init() {
    if (!window.supabase) {
      setStatus('Supabase library not loaded');
      return;
    }
    if (SUPABASE_URL.includes('YOUR-PROJECT') || SUPABASE_ANON_KEY === 'YOUR-ANON-KEY') {
      setStatus('Configure Supabase URL and anon key in app.js to load data.');
    }

    state.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    state.slots = generateTimeSlots(TIME_START, TIME_END, SLOT_MINUTES);

    // Build an empty table initially
    buildEmptyTable(state.slots);

    // Initial load
    refresh();

    // Auto-refresh every 30 minutes
    const THIRTY_MINUTES = 30 * 60 * 1000;
    setInterval(refresh, THIRTY_MINUTES);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

