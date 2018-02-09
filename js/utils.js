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
    var controls = document.getElementById("controls");
    switch (state) {
        case "loading":
            ele.classList.remove('bg-success');
            ele.classList.add('bg-warning');
            ele.children[0].className = 'fas fa-sync fa-spin';
            controls.classList.remove('show');
            break;
        case "ready":
            ele.classList.remove('bg-warning');
            ele.classList.add('bg-success');
            ele.children[0].className = 'fas fa-check';
            if (document.querySelectorAll('.img-plate').length > 0) controls.classList.add('show');
            break;
    }
}

/**
 * Adapted from https://stackoverflow.com/questions/19262141/resize-image-with-javascript-canvas-smoothly
 * @param dataUrl
 * @param targetWidth
 * @param callback
 */
function resizeImgData(dataUrl, targetWidth, callback) {
    var canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    var ctx = canvas.getContext("2d");
    var img = new Image();

    img.onload = function () {
        // set size proportional to image
        canvas.height = canvas.width * (img.height / img.width);

        // step 1 - resize to 50%
        var oc = document.createElement('canvas'),
            octx = oc.getContext('2d');

        oc.width = img.width * 0.5;
        oc.height = img.height * 0.5;
        octx.drawImage(img, 0, 0, oc.width, oc.height);

        // step 2
        octx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5);

        // step 3, resize to final size
        ctx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5,
            0, 0, canvas.width, canvas.height);

        callback(canvas.toDataURL());
    }
    img.src = dataUrl;
}
