/**
 * Default configuration for flatpickr date pickers.
 * @returns {import('flatpickr/dist/types/options').Options}
 */
function getDefaultDatePickerConfig() {
  return {
    dateFormat: "d/m/Y",
    defaultDate: "today",
    minDate: "today",
    locale: flatpickr.l10ns.de,
    allowInput: false,
    disableMobile: true,
    onChange: (selectedDates, dateStr, instance) => {
      handlePastDate(selectedDates, instance);
    }
  };
}

/**
 * Prevent selection of past dates; reset to today.
 * @param {Date[]} selectedDates
 * @param {any} instance
 */
function handlePastDate(selectedDates, instance) {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  if (selectedDates.length > 0 && selectedDates[0] < currentDate) {
    instance.setDate("today", true);
    alert("Das ausgewählte Datum liegt in der Vergangenheit. Bitte wählen Sie ein aktuelles Datum.");
  }
}

/**
 * Toggle a date picker on an input by id.
 * @param {string} inputId
 */
function openDatePicker(inputId) {
  const dateInput = document.getElementById(inputId);
  if (!dateInput) return;
  dateInput.setAttribute("readonly", "readonly");
  if (dateInput._flatpickr) {
    dateInput._flatpickr.isOpen ? dateInput._flatpickr.close() : dateInput._flatpickr.open();
  } else {
    flatpickr(dateInput, getDefaultDatePickerConfig());
    dateInput._flatpickr.open();
  }
}

/**
 * Open date picker for Add Task flow and focus the input.
 * @param {string} inputId
 */
function openDatePickerAddTask(inputId) {
  const dateInput = document.getElementById(inputId);
  if (!dateInput) return;
  dateInput.setAttribute("readonly", "readonly");
  flatpickr(dateInput, getDefaultDatePickerConfig());
  dateInput.focus();
}

/**
 * Toggle priority buttons (urgent/medium/low) in Add Task form.
 * @param {"urgent"|"medium"|"low"} priority
 */
function setPriority(priority) {
  const allButtons = document.querySelectorAll('.priority-button-urgent, .priority-button-medium, .priority-button-low');
  const selectedButton = document.querySelector(`.priority-button-${priority}`);
  if (!selectedButton) return;
  allButtons.forEach(btn => btn.classList.remove('active'));
  selectedButton.classList.add('active');
  selectedButton.dataset.priority = priority;
  if (typeof validateForm === 'function') validateForm();
}


