const arrayData = {
    384: {xAxis: [], yAxis: [], text: []},
    1536: {xAxis: [], yAxis: [], text: []}
};

(function () {
    let r, r3, c, c3;
    // TODO: could be a static file... saves on loading time

    for (let m = 0; m < 32; m++) {
        arrayData[1536]['yAxis'].push(m);

        r = Math.abs(m - 32);
        r3 = (r + 1) >> 1;
        arrayData[1536]["text"][m] = [];
        for (let n = 0; n < 48; n++) {
            if (m === 0) {
                arrayData[1536]['xAxis'].push(n);
            }

            c = n + 1;
            c3 = (c + 1) >> 1;
            arrayData[1536]["text"][m][n] = `1536 coordinate (${r}, ${c})<br>384 coordinate (${r3}, ${c3})`;
        }
    }

    for (let m = 0; m < 16; m++) {
        arrayData[384]['yAxis'].push(m);

        r = Math.abs(m - 16);
        arrayData[384]["text"][m] = [];
        for (let n = 0; n < 24; n++) {
            if (m === 0) {
                arrayData[384]['xAxis'].push(n);
            }

            c = n + 1;
            arrayData[384]["text"][m][n] = `coordinate (${r}, ${c})`;
        }
    }
})();

function compareNumbers(a, b) {
    return a - b;
}

export function getArrayData(arrayType) {
    if (arrayType === 32) {
        arrayType = 1536;
    } else if (arrayType === 16) {
        arrayType = 384;
    }

    return arrayData[arrayType];
}

/*
 * Adapted from http://www.jstips.co/en/javascript/get-file-extension/
 */
export function getBaseName(filename) {
    /*
     * Take care of gitter dat file naming bug
     */
    if (filename.match(/[.]jpg[.]dat$/i)) {
        filename = filename.replace(/[.]jpg[.]dat$/i, '.dat')
    }

    return filename.slice(0, (filename.lastIndexOf(".") - 1 >>> 0) + 1);
}

export function calculatePmm(sizes) {
    let flat = math.flatten(sizes);
    flat.sort(compareNumbers);
    return math.mean(flat.slice(flat.length * .4, flat.length * .6));
}

export function normalizeWithPmmNoClip(sizes, mm) {
    return math.chain(sizes).divide(mm).subtract(1).done();
}

export function setState(state) {
    let ele = document.getElementById('notification');
    let controls = document.getElementById("controls");
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
            if (document.querySelectorAll('[data-plate-type=heatmap]').length > 0) controls.classList.add('show');
            break;
    }
}

/**
 * Adapted from https://stackoverflow.com/questions/19262141/resize-image-with-javascript-canvas-smoothly
 * @param dataUrl
 * @param targetWidth
 * @param callback
 */
export function resizeImgData(dataUrl, targetWidth, callback) {
    let canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    let ctx = canvas.getContext("2d");
    let img = new Image();

    img.onload = () => {
        // set size proportional to image
        canvas.height = canvas.width * (img.height / img.width);

        // step 1 - resize to 50%
        let oc = document.createElement('canvas'),
            octx = oc.getContext('2d');

        oc.width = img.width * 0.5;
        oc.height = img.height * 0.5;
        octx.drawImage(img, 0, 0, oc.width, oc.height);

        // step 2
        octx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5);

        // step 3, resize to final size
        ctx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5,
            0, 0, canvas.width, canvas.height);

        callback(canvas.toDataURL(), {
            imageHeight: img.height,
            imageWidth: img.width
        });
    };
    img.src = dataUrl;
}

export async function createGif(gifType) {
    let gif = null;
    let i, added = 0;
    let plates, plate;
    const w = $("#pairs").width();
    const h = w / 1.5;

    if (gifType === 'plate') {
        plates = document.querySelectorAll('.img-plate');
    } else {
        plates = document.querySelectorAll("[data-plate-type=heatmap] > div");
    }

    if (plates.length === 0) {
        return;
    }

    for (i = 0; plate = plates[i]; i++) {
        if (gif == null) {
            gif = new GIF({
                workerScript: 'js/vendor/gif.worker.js',
                quality: 10,
                width: w,
                height: h,
                debug: true
            });
        }

        if (gifType === 'plate') {
            gif.addFrame(plate);
            added++;
        } else {
            await Plotly.toImage(plate, {format: 'jpeg', width: w, height: h}).then(dataUrl => {
                let tmpimg = document.createElement('img');
                tmpimg.setAttribute('src', dataUrl);
                gif.addFrame(tmpimg);
                added++;
            });
        }
    }

    gif.on('finished', function (blob) {
        document.getElementById('gif').setAttribute('src', URL.createObjectURL(blob));
        setTimeout(function () {
            document.getElementById('gif').scrollIntoView({behavior: "smooth", block: "center", inline: "end"});
        }, 1000);
    });

    gif.render();
}
