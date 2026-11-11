(function () {
    'use strict';
    const selector = document.getElementById('yearSelector');
    if (selector && selector.form) {
        selector.addEventListener('change', function () {
            if (typeof selector.form.requestSubmit === 'function') {
                selector.form.requestSubmit();
            } else {
                selector.form.submit();
            }
        });
    }
})();
