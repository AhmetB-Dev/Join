/**
 * Validate email input on edit/add forms and toggle error display.
 * @param {HTMLInputElement} input
 */
function validateEmailInput(input) {
  const email = input.value.trim();
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(de|com|net)$/;
  let errorElement;
  if (input.id === 'editContactEmail') {
    errorElement = document.getElementById('editEmailError');
  } else if (input.id === 'addInputEmail') {
    errorElement = document.getElementById('addEmailError');
  }
  if (email && !emailPattern.test(email)) {
    input.setCustomValidity('');
    input.style.borderColor = '#ff0000';
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.add('show');
    }
  } else {
    input.setCustomValidity('');
    input.style.borderColor = '#ccc';
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('show');
    }
  }
}

/**
 * Validate required add-contact fields and format-specific errors.
 * @returns {boolean}
 */
function validateAllFields() {
  const name = document.getElementById('addInputName');
  const email = document.getElementById('addInputEmail');
  const phone = document.getElementById('addInputPhone');
  const errorElement = document.getElementById('addInputError');
  if (!validateRequiredFields(name, email, phone, errorElement)) return false;
  if (!validateEmailField(email)) return false;
  if (!validatePhoneField(phone)) return false;
  clearAllFieldErrors(name, email, phone, errorElement);
  return true;
}

/**
 * Check if required fields are non-empty; show a generic error.
 * @param {HTMLInputElement} name
 * @param {HTMLInputElement} email
 * @param {HTMLInputElement} phone
 * @param {HTMLElement|null} errorElement
 */
function validateRequiredFields(name, email, phone, errorElement) {
  if (!name.value.trim() || !email.value.trim() || !phone.value.trim()) {
    name.style.borderColor = '#ff0000';
    email.style.borderColor = '#ff0000';
    phone.style.borderColor = '#ff0000';
    if (errorElement) {
      errorElement.textContent = 'Bitte alle Felder ausfüllen';
      errorElement.classList.add('show');
    }
    return false;
  }
  return true;
}

/**
 * Validate email field and show inline error.
 * @param {HTMLInputElement} email
 * @returns {boolean}
 */
function validateEmailField(email) {
  if (!isValidEmail(email.value)) {
    email.style.borderColor = '#ff0000';
    const emailError = document.getElementById('addEmailError');
    if (emailError) {
      emailError.textContent = 'Bitte eine gültige E-Mail-Adresse eingeben';
      emailError.classList.add('show');
    }
    return false;
  }
  return true;
}

/**
 * Validate phone field and show inline error.
 * @param {HTMLInputElement} phone
 * @returns {boolean}
 */
function validatePhoneField(phone) {
  if (!isValidPhone(phone.value)) {
    phone.style.borderColor = '#ff0000';
    const phoneError = document.getElementById('addPhoneError');
    if (phoneError) {
      phoneError.textContent = 'Bitte eine gültige Telefonnummer eingeben';
      phoneError.classList.add('show');
    }
    return false;
  }
  return true;
}

/**
 * Clear all validation errors for add-contact form.
 */
function clearAllFieldErrors(name, email, phone, errorElement) {
  name.style.borderColor = '#ccc';
  email.style.borderColor = '#ccc';
  phone.style.borderColor = '#ccc';
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.classList.remove('show');
  }
  const emailError = document.getElementById('addEmailError');
  const phoneError = document.getElementById('addPhoneError');
  if (emailError) {
    emailError.textContent = '';
    emailError.classList.remove('show');
  }
  if (phoneError) {
    phoneError.textContent = '';
    phoneError.classList.remove('show');
  }
}

/**
 * Basic email validation.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(de|com|net)$/;
  return emailPattern.test(email.trim());
}

/**
 * Basic phone validation (min length 6).
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  return phone.trim().length >= 6;
}

/**
 * Validate required fields on edit modal.
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @returns {boolean}
 */
function validateEditContactFields(name, email, phone) {
  if (!name || !email || !phone) return false;
  if (!validateEditEmail(email)) return false;
  if (!validateEditPhone(phone)) return false;
  return true;
}

/**
 * Validate edit email field.
 * @param {string} email
 * @returns {boolean}
 */
function validateEditEmail(email) {
  if (!isValidEmail(email)) {
    const emailError = document.getElementById('editEmailError');
    const emailInput = document.getElementById('editContactEmail');
    emailInput.style.borderColor = '#ff0000';
    if (emailError) {
      emailError.textContent = 'Bitte eine gültige E-Mail-Adresse eingeben';
      emailError.classList.add('show');
    }
    return false;
  }
  clearEditEmailError();
  return true;
}

/**
 * Validate edit phone field.
 * @param {string} phone
 * @returns {boolean}
 */
function validateEditPhone(phone) {
  if (!isValidPhone(phone)) {
    const phoneError = document.getElementById('editPhoneError');
    const phoneInput = document.getElementById('editContactPhone');
    phoneInput.style.borderColor = '#ff0000';
    if (phoneError) {
      phoneError.textContent = 'Bitte eine gültige Telefonnummer eingeben';
      phoneError.classList.add('show');
    }
    return false;
  }
  clearEditPhoneError();
  return true;
}

/**
 * Clear edit email error.
 */
function clearEditEmailError() {
  const emailError = document.getElementById('editEmailError');
  const emailInput = document.getElementById('editContactEmail');
  emailInput.style.borderColor = '#ccc';
  if (emailError) {
    emailError.textContent = '';
    emailError.classList.remove('show');
  }
}

/**
 * Clear edit phone error.
 */
function clearEditPhoneError() {
  const phoneError = document.getElementById('editPhoneError');
  const phoneInput = document.getElementById('editContactPhone');
  phoneInput.style.borderColor = '#ccc';
  if (phoneError) {
    phoneError.textContent = '';
    phoneError.classList.remove('show');
  }
}
