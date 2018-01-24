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

function normalizeWithPmm(sizes) {
    var flat = math.flatten(sizes), mm;
    flat.sort(compareNumbers);
    mm = math.mean(flat.slice(flat.length * .4, flat.length * .6));

    return math.chain(sizes).divide(mm).map(function (v) {
        return v > 1 ? Math.min(v, 1.5) : Math.max(v, .5);
    }).done();
}

function elementInnerWidth(element) {
    var style = element.currentStyle || window.getComputedStyle(element),
        width = element.offsetWidth, // or use style.width
        margin = parseFloat(style.marginLeft) + parseFloat(style.marginRight),
        padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight),
        border = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);

    return width + margin - padding + border;
}
