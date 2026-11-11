(function () {
    'use strict';
    const selector = document.getElementById('yearSelector');
    if (selector && selector.form) {
        selector.addEventListener('change', function () {
            selector.form.requestSubmit();
        });
    }
})();
