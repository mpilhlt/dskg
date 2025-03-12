
// shorthand for document selectors
const $ = (selector, node) => (node||document).querySelector(selector);
const $$ = (selector, node) => (node||document).querySelectorAll(selector);

export function setupLiveEditing(onSaveFunc) {
    const liveEditElements = $$('.live-edit');
  
    liveEditElements.forEach(element => {
      // Setup double-click and long-tap event listeners
      element.addEventListener('dblclick', startEditing);
      element.addEventListener('taphold', startEditing);
      element.addEventListener('blur', onBlur);

      let originalValue;

      function startEditing() {
        // save original value
        originalValue = element.textContent;

        // Add data-edit attribute
        element.setAttribute('data-edit', '');
      
        // Enable in-place editing
        element.contentEditable = 'true';
        element.focus();
        //element.alt = 'Press enter to save, ESC to cancel';
      
        // Setup keypress event listener
        element.addEventListener('keydown', handleKeyPress);
      }
  
      function handleKeyPress(event) {
        if (event.key === 'Escape') {
          revertEditing();
        } else if (event.key === 'Enter') {
          saveEditing();
        }
      }

      function endEditing() {
        // Remove data-edit attribute and disable contentEditable attribute
        element.removeAttribute('data-edit');
        element.contentEditable = 'false';
        // Remove keypress event listener
        element.removeEventListener('keydown', handleKeyPress);
      }

      function onBlur() {
        if (element.textContent !== originalValue) {
          revertEditing();
        } else {
          endEditing();
        }
      }

      function revertEditing() {
        endEditing();
        element.textContent = originalValue;
      }
  
      function saveEditing() {
        endEditing();
  
        // Call onSaveFunc with the edited element and its new value
        const prop = element.getAttribute('data-prop');
        const value = element.textContent;
        const previousValue = originalValue;
        originalValue = value;
        onSaveFunc(prop, value, previousValue);
      }
    });
  }