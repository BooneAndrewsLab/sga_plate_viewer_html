function compareNumbers(a, b) {
    return a - b;
}

/*
 * Adapted from http://www.jstips.co/en/javascript/get-file-extension/
 */
function getBaseName(filename) {
    /*
     * Take care of gitter dat file naming bug
     */
    if (filename.match(/[.]jpg[.]dat$/i)) {
        filename = filename.replace(/[.]jpg[.]dat$/i, '.dat')
    }

    return filename.slice(0, (filename.lastIndexOf(".") - 1 >>> 0) + 1);
}

function calculatePmm(sizes) {
    var flat = math.flatten(sizes), mm;
    flat.sort(compareNumbers);
    return math.mean(flat.slice(flat.length * .4, flat.length * .6));
}

function normalizeWithPmmNoClip(sizes, mm) {
    return math.chain(sizes).divide(mm).subtract(1).done();
}

function elementInnerWidth(element) {
    var style = element.currentStyle || window.getComputedStyle(element),
        width = element.offsetWidth, // or use style.width
        margin = parseFloat(style.marginLeft) + parseFloat(style.marginRight),
        padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight),
        border = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);

    return width + margin - padding + border;
}

function setState(state) {
    var ele = document.getElementById('notification');
    switch (state) {
        case "loading":
            ele.classList.remove('bg-success');
            ele.classList.add('bg-warning');
            ele.children[0].className = 'fas fa-sync fa-spin';
            break;
        case "ready":
            ele.classList.remove('bg-warning');
            ele.classList.add('bg-success');
            ele.children[0].className = 'fas fa-check';
            break;
    }
}
