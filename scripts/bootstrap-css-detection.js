/**
 * Detect whether Bootstrap CSS loaded successfully.
 * If not, show a warning banner at the top of the page with a refresh link.
 */

function isBootstrapCSSLoaded() {
    // Bootstrap 5 defines --bs-blue on :root. If the stylesheet failed
    // to load (or was blocked), this custom property will be empty.
    var bsBlue = getComputedStyle(document.documentElement).getPropertyValue('--bs-blue').trim();
    return bsBlue !== '';
}

function showBootstrapCSSWarning() {
    // Inline styles are used because Bootstrap CSS may not be available.
    var wrapper = document.createElement('div');
    wrapper.id = 'bootstrap-css-warning';
    wrapper.setAttribute('role', 'alert');
    wrapper.innerHTML =
        '<div style="' +
            'background:#fff3cd;' +
            'color:#664d03;' +
            'text-align:center;' +
            'padding:10px 16px;' +
            'font-family:system-ui,-apple-system,\'Segoe UI\',Roboto,sans-serif;' +
            'font-size:14px;' +
            'line-height:1.5;' +
            'border-bottom:1px solid #ffecb5;' +
        '">' +
            '<strong>&#x26A0;&#xFE0F; Bootstrap CSS failed to load.</strong> ' +
            'This may affect your browsing experience. ' +
            '<a href="javascript:location.reload()" style="' +
                'color:#664d03;' +
                'font-weight:600;' +
                'text-decoration:underline;' +
                'text-underline-offset:2px;' +
            '">Refresh the page</a> to try again.' +
        '</div>';
    document.body.prepend(wrapper);
}

document.addEventListener('DOMContentLoaded', function () {
    if (!isBootstrapCSSLoaded()) {
        showBootstrapCSSWarning();
    }
});
