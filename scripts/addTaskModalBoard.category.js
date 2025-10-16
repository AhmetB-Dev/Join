/**
 * Bind category dropdown interactions (toggle, select, outside click).
 * @returns {void}
 */
function bindCategoryDropdown() {
  const elements = getCategoryElements();
  if (!elements) return;
  setupCategoryDropdownToggle(elements);
  setupCategoryItemSelection(elements);
  setupCategoryOutsideClick(elements);
}

/**
 * Collect and validate required DOM elements for the category dropdown.
 * @returns {{categoryDropdown:HTMLElement,categorySelected:HTMLElement,categoryOptions:HTMLElement,categoryItems:NodeListOf<Element>}|null}
 */
function getCategoryElements() {
  const categoryDropdown = document.querySelector('.category-dropdown');
  const categorySelected = document.querySelector('.category-selected');
  const categoryOptions = document.querySelector('.category-options');
  const categoryItems = document.querySelectorAll('.category-item');
  if (!categoryDropdown || !categorySelected || !categoryOptions) return null;
  return { categoryDropdown, categorySelected, categoryOptions, categoryItems };
}

/**
 * Setup toggle behavior for clicking the category dropdown.
 * @param {{categoryOptions:HTMLElement,categoryDropdown:HTMLElement}} elements
 * @returns {void}
 */
function setupCategoryDropdownToggle(elements) {
  elements.categoryDropdown.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleCategoryOptions(elements.categoryOptions);
  });
}

/**
 * Toggle the category options list visibility.
 * @param {HTMLElement} categoryOptions
 * @returns {void}
 */
function toggleCategoryOptions(categoryOptions) {
  if (categoryOptions.style.display === 'block') {
    categoryOptions.style.display = 'none';
  } else {
    categoryOptions.style.display = 'block';
  }
}

/**
 * Bind click handlers for each category item.
 * @param {{categoryItems:NodeListOf<Element>}} elements
 * @returns {void}
 */
function setupCategoryItemSelection(elements) {
  elements.categoryItems.forEach(item => {
    item.addEventListener('click', function (e) {
      e.stopPropagation();
      handleCategorySelection(elements, this);
    });
  });
}

/**
 * Handle selecting a category item and update view/state.
 * @param {{categoryItems:NodeListOf<Element>,categorySelected:HTMLElement,categoryOptions:HTMLElement}} elements
 * @param {Element} selectedItem
 * @returns {void}
 */
function handleCategorySelection(elements, selectedItem) {
  selectCategoryItem(elements.categoryItems, selectedItem);
  updateCategoryDisplay(elements.categorySelected, selectedItem);
  updateCategorySelect(selectedItem);
  closeCategoryOptions(elements.categoryOptions);
  validateForm();
}

/**
 * Apply selected class to chosen category item.
 * @param {NodeListOf<Element>} categoryItems
 * @param {Element} selectedItem
 * @returns {void}
 */
function selectCategoryItem(categoryItems, selectedItem) {
  categoryItems.forEach(item => item.classList.remove('selected'));
  selectedItem.classList.add('selected');
}

/**
 * Update selected category label text.
 * @param {HTMLElement} categorySelected
 * @param {Element} selectedItem
 * @returns {void}
 */
function updateCategoryDisplay(categorySelected, selectedItem) {
  categorySelected.textContent = selectedItem.textContent;
}

/**
 * Reflect the chosen category in the hidden select element.
 * @param {Element} selectedItem
 * @returns {void}
 */
function updateCategorySelect(selectedItem) {
  const select = document.querySelector('.select-task');
  if (select) {
    select.value = selectedItem.getAttribute('data-value');
  }
}

/**
 * Hide the category options list.
 * @param {HTMLElement} categoryOptions
 * @returns {void}
 */
function closeCategoryOptions(categoryOptions) {
  categoryOptions.style.display = 'none';
}

/**
 * Close category options when clicking outside the dropdown.
 * @param {{categoryOptions:HTMLElement}} elements
 * @returns {void}
 */
function setupCategoryOutsideClick(elements) {
  document.addEventListener('click', function () {
    closeCategoryOptions(elements.categoryOptions);
  });
}
