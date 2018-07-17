import {readColony, readGitter} from "./readers.js";
import * as utils from "./utils.js";

let fileData;
let annotation, annotationIndex;
let pairs;
let linkages;

function handleImage(f, ele) {
    const reader = new FileReader();
    let name = $(ele).parent().data('pair-name');

    // Closure to capture the file information.
    reader.onload = (theFile => {
        return e => {
            // Resize image to 2x container size for faster loading but still retain some detail
            utils.resizeImgData(e.target.result, $("#pairs").width(), (dataUrl, imageData) => {
                ele.innerHTML = `<img class="img-plate img-fluid" 
                                      src="${dataUrl}" 
                                      title="${encodeURI(theFile.name)}"/>`;
                ele.classList.add('show');
                fileData[name]["imageData"] = imageData;
                initNewItem();
            });
        };
    })(f);

    // Read in the image file as a data URL.
    reader.readAsDataURL(f);
}

function markCoordinate(ele, name, row = null, col = null) {
    let hasImage = $(ele).find("canvas").length > 0;

    if (hasImage) {
        let ctx = $(ele).find("canvas")[0].getContext("2d");
        let fd = fileData[name]["imageData"];
        let wmargin = fd.wstep / 8;
        let hmargin = fd.hstep / 8;

        ctx.clearRect(0, 0, fd.gridWidth, fd.gridHeight);

        function drawSquare(r, c, colour) {
            ctx.strokeStyle = colour;
            ctx.lineWidth = 2;
            ctx.strokeRect(
                Math.max(c * fd.wstep - wmargin, 0),
                Math.max(r * fd.hstep - hmargin, 0),
                Math.min(fd.wstep + wmargin * 2, fd.gridWidth - (c * fd.wstep - wmargin) - 1),
                Math.min(fd.hstep + hmargin * 2, fd.gridHeight - (r * fd.hstep - hmargin) - 1)
            );
        }

        fileData[name].markedStrains.map((e) => {
            drawSquare(e.imageRow, e.imageCol, "#FF0");
        });

        if (row != null) {
            drawSquare(row, col, "#00F");
        }
    }

    let pltDiv = $(ele).find(".js-plotly-plot")[0];
    let fd = fileData[name];
    let update = {
        shapes: [...fd.markedStrains]
    };

    if (row != null) {
        update.shapes.push({
            type: 'rect',
            x0: col * 2 - 0.5,
            y0: (15 - row) * 2 - 0.5,
            x1: col * 2 + 1.5,
            y1: (15 - row) * 2 + 1.5,
            line: {
                color: 'rgba(0, 0, 255, 1)',
                width: 2
            }
        });
    }

    Plotly.relayout(pltDiv, update);
}

function addImageOverlay(data, ele, name) {
    let fd = fileData[name]["imageData"];
    let img = $(ele).find('[data-plate-type=image]');

    if (img.length === 0) {
        return;
    }

    let scalingRatio = img.find("img").width() / fd.imageWidth;
    let paddingLeft = parseInt(img.css("padding-left").replace("px", ""));

    fd.gridWidth = (data.x1 - data.x0) * .862 * scalingRatio;
    fd.gridHeight = (data.y1 - data.y0) * .855 * scalingRatio;

    // Size of one window
    fd.wstep = fd.gridWidth / 24;
    fd.hstep = fd.gridHeight / 16;

    img.append(`<canvas class="image-overlay" width="${fd.gridWidth}" height="${fd.gridHeight}">`);
    let overlay = img.find("canvas");
    overlay.css({
        position: "absolute",
        top: data.y * scalingRatio - fd.hstep / 4,
        left: paddingLeft + data.x * scalingRatio - fd.wstep / 4,
    });

    let lastCol = -1, lastRow = -1;

    overlay.mousemove((evt) => {
        let col = Math.floor(evt.offsetX / fd.wstep);
        let row = Math.floor(evt.offsetY / fd.hstep);

        if (col === lastCol && row === lastRow) return;

        markCoordinate(ele, name, row, col);

        lastCol = col;
        lastRow = row;
    }).mouseout(() => {
        markCoordinate(ele, name);
        lastCol = lastRow = -1;
    });
}

function handleDat(f, ele) {
    const reader = new FileReader();
    let sizes, normalized, div;
    let name = $(ele).parent().data('pair-name');
    let plateNum = $(ele).parent().data('plate-num');
    let fd = fileData[name];

    reader.onloadend = function (evt) {
        if (evt.target.readyState === FileReader.DONE) {
            let dat;
            fd.markedStrains = [];
            div = document.createElement('div');

            if (evt.target.result.slice(0, 24) === 'Colony Project Data File') {
                dat = readColony(evt.target.result);
                sizes = dat.sizes;
                addImageOverlay(dat, ele.parentElement, name);
            } else if (evt.target.result.slice(0, 8) === '# gitter') {
                sizes = readGitter(evt.target.result);
            } else {
                console.log('Unknown data file format');
                return;
            }
            let ad = utils.getArrayData(sizes.length);

            fd['dat'] = dat;
            fd['sizes'] = sizes;

            let pmm = utils.calculatePmm(sizes);
            fd['pmm'] = pmm;

            normalized = utils.normalizeWithPmmNoClip(sizes, pmm);
            fd['normalized'] = normalized;

            /* Save pmm in attributes */
            ele.parentElement.setAttribute('data-pmm', pmm);

            ele.insertBefore(div, null);

            let data = [{
                x: ad.xAxis,
                y: ad.yAxis,
                z: normalized,
                text: ad.text,
                hoverinfo: 'text',
                type: 'heatmap',
                colorscale: [
                    [0, '#FF0000'],
                    [.5, '#000000'],
                    [1, '#00FF00']
                ],
                showscale: false,
                zauto: false,
                zmin: -.5,
                zmax: .5
            }];

            const axisTemplate = {
                showgrid: false,
                zeroline: false,
                linecolor: 'black',
                showticklabels: false,
                fixedrange: true,
                ticks: ''
            };

            const layout = {
                xaxis: axisTemplate,
                yaxis: axisTemplate,
                showlegend: false,
                width: $(ele).width(),
                height: ($(ele).width() / 3) * 2,
                margin: {
                    l: 0,
                    r: 0,
                    b: 0,
                    t: 0,
                    pad: 0
                }
            };

            Plotly.newPlot(div, data, layout, {displayModeBar: false});
            ele.classList.add('show');

            ele.parentElement.addEventListener('updateHeatmap', function (evt) {
                if (!!evt.detail['name'] && name !== evt.detail['name']) {
                    data[0]['z'] = math.subtract(
                        utils.normalizeWithPmmNoClip(sizes, pmm),
                        utils.normalizeWithPmmNoClip(fileData[evt.detail.name]['sizes'], fileData[evt.detail.name]['pmm']));
                } else {
                    data[0]['z'] = utils.normalizeWithPmmNoClip(sizes, pmm);
                }

                Plotly.update(div, data, layout);
            }, false);

            ele.parentElement.addEventListener('markStrain', function (evt) {
                if (evt.detail == null) {
                    fd.markedStrains = [];
                } else {
                    let searched = annotation[evt.detail.plate][evt.detail.item];
                    let row = 17 - searched.row;

                    fd.markedStrains.push({
                        type: 'rect',
                        x0: searched.col * 2 - 2.5,
                        y0: row * 2 - 2.5,
                        x1: searched.col * 2 - .5,
                        y1: row * 2 - .5,
                        line: {
                            color: 'rgba(255, 255, 0, 1)',
                            width: 3
                        },
                        imageRow: searched.row - 1,
                        imageCol: searched.col - 1
                    });
                }

                markCoordinate(ele.parentElement, name);
            });

            ele.parentElement.addEventListener('updateAnnotation', function () {
                let mtrx = math.ones(32, 48);

                for (let i = 0; i < annotation[plateNum].length; i++) {
                    let item = annotation[plateNum][i];
                    let row = 16 - item.row;
                    let col = item.col - 1;

                    mtrx._data[row * 2 + 1][col * 2 + 1] = item.text;
                    mtrx._data[row * 2 + 1][col * 2] = item.text;
                    mtrx._data[row * 2][col * 2 + 1] = item.text;
                    mtrx._data[row * 2][col * 2] = item.text;

                    if (linkages.hasOwnProperty(item.c)) {
                        let avgnorm = (
                            normalized[row * 2 + 1][col * 2 + 1] +
                            normalized[row * 2 + 1][col * 2] +
                            normalized[row * 2][col * 2 + 1] +
                            normalized[row * 2][col * 2]) / 4;

                        if (!linkages[item.c].hasOwnProperty(item.text)) {
                            linkages[item.c][item.text] = {loc: item.l, vals: []};
                        }

                        linkages[item.c][item.text].vals.push(avgnorm);
                    }
                }

                data[0].text = mtrx._data;
                data[0].hoverinfo = 'text';

                Plotly.update(div, data, layout);
            });

            div.on('plotly_hover', data => {
                for (let i = 0; i < data.points.length; i++) {
                    let point = data.points[i];
                    markCoordinate(ele.parentElement, name, 15 - Math.floor(point.y / 2), Math.floor(point.x / 2))
                }
            });

            div.on('plotly_unhover', () => {
                markCoordinate(ele.parentElement, name)
            });

            initNewItem();
        }
    };

    reader.readAsBinaryString(f);
}

/**
 * Called when all images and heatmaps are loaded
 */
function initListeners() {
    pairs = document.querySelectorAll('#pairs .row');
    let i, j, ele, eme;

    for (i = 0; ele = pairs[i]; i++) {
        /* Use this plate as the reference for other heatmaps */
        ele.addEventListener('click', function () {
            this.classList.toggle("bg-warning");
            let eventData = {'detail': {}};
            if (this.classList.contains('bg-warning')) {
                eventData['detail']['pmm'] = this.getAttribute('data-pmm');
                eventData['detail']['name'] = this.getAttribute('data-pair-name');
            }

            /* Dispatch update to all other heatmaps */
            for (j = 0; eme = pairs[j]; j++) {
                if (eme !== this) {
                    eme.classList.remove("bg-warning");
                }

                let event = new CustomEvent('updateHeatmap', eventData);
                eme.dispatchEvent(event);
            }
        }, false);
    }
}

/**
 * Recursively calls itself untill all new elements are loaded. Wrapped in a timeout for a smoother loading
 */
function initNewItem() {
    setTimeout(function () {
        let ele = document.querySelector('.new-plate');
        if (!ele) {
            initListeners();
            utils.setState('ready');
            return;
        }

        ele.classList.remove('new-plate');

        let name = ele.parentElement.getAttribute('data-pair-name');
        let data = fileData[name];

        document.getElementById(encodeURI(name)).classList.add('show');

        switch (ele.getAttribute('data-plate-type')) {
            case 'image':
                if (data.hasOwnProperty('image')) {
                    handleImage(data['image'], ele);
                } else {
                    initNewItem();
                }
                break;
            case 'heatmap':
                if (data.hasOwnProperty('data')) {
                    handleDat(data['data'], ele);
                } else {
                    initNewItem();
                }
                break;
        }
    }, 0);
}

function handleFileSelect(evt) {
    const files = evt.target.files; // FileList object
    const numRe = /_(plate|p)?(\d+)_?/gi;
    let base, names = [], data, tally = {'images': 0, 'dats': 0}, colSize;
    let plateNum;
    let pairsParent, div, inner;

    utils.setState('loading');

    document.getElementById('gif').src = "";
    annotation = null;
    annotationIndex = null;

    pairsParent = document.getElementById('pairs');
    pairsParent.innerHTML = ''; // Clear element
    fileData = {};

    for (let i = 0, f; f = files[i]; i++) {
        base = utils.getBaseName(f.name);

        if (!fileData.hasOwnProperty(base)) {
            fileData[base] = {};
            names.push(base);
        }

        if (f.type.match('image.*')) {
            tally['images']++;
            fileData[base]['image'] = f;
        } else {
            tally['dats']++;
            fileData[base]['data'] = f;
        }
    }

    names.sort();

    colSize = tally['images'] && tally['dats'] ? '6' : '12';

    for (let i = 0, name; name = names[i]; i++) {
        data = fileData[name];
        plateNum = '1';

        let numCandidate;

        while ((numCandidate = numRe.exec(name)) !== null) {
            if (parseInt(numCandidate[2]) < 20) { // Most likely not a plate number
                plateNum = parseInt(numCandidate[2]).toString();
            }
        }

        div = document.createElement('div');
        div.classList.add('row');
        div.classList.add('py-2');
        div.setAttribute('data-pair-name', name);
        div.setAttribute('data-plate-num', plateNum);

        inner = `<div class="col-sm-12 fade" id="${encodeURI(name)}">
                    <div>
                        <span class="h4">${name}</span>
                    </div>
                 </div>`;

        if (tally['images']) {
            inner += `<div class="col-sm-${colSize} fade new-plate" data-plate-type="image" id="${encodeURI(name)}-image"></div>`;
        }

        if (tally['dats']) {
            inner += `<div class="col-sm-${colSize} fade new-plate" data-plate-type="heatmap" id="${encodeURI(name)}-heatmap"></div>`;
        }

        div.innerHTML = inner;

        pairsParent.insertBefore(div, null);
    }

    initNewItem();
}

function dispatchAnnotationChange() {
    let i, ele;
    let event = new CustomEvent('updateAnnotation', annotation);

    for (i = 0; ele = pairs[i]; i++) {
        ele.dispatchEvent(event);
    }
}

function handleAnnotation() {
    let ele = $(this);
    let url = ele.attr("data-json");
    let genesList = $('#search-genes');
    // noinspection JSUnresolvedFunction
    let plates = $("[data-plate-num]").map((_, e) => e.getAttribute('data-plate-num')).get();

    genesList.val(null).html("").trigger('change').prop("disabled", true);
    $('#btn-linkage').prop("disabled", true);
    $('#linkages').html("");

    $.getJSON(url, function (data) {
        let i, j, chrom;
        let strains = [];

        annotation = data;
        annotationIndex = {};
        linkages = {};

        for (chrom = 0; chrom < 16; chrom++) { // Chromosomes
            linkages[chrom + 1] = {};
        }

        dispatchAnnotationChange();

        for (i in annotation) {
            if (!annotation.hasOwnProperty(i) || plates.indexOf(i) === -1) {
                continue;
            }

            for (j = 0; j < annotation[i].length; j++) {
                if (strains.indexOf(annotation[i][j].text) === -1) {
                    strains.push(annotation[i][j].text);
                    annotationIndex[annotation[i][j].text] = [];
                }

                annotationIndex[annotation[i][j].text].push({plate: i, item: j});
            }
        }

        for (i = 0; i < strains.length; i++) {
            let newOption = new Option(strains[i], strains[i], false, false);
            genesList.append(newOption);
        }

        genesList.val(null).trigger('change').prop("disabled", false);
        $('#btn-linkage').prop("disabled", false);
    });
}

function clearSearch() {
    let event = new CustomEvent('markStrain', {detail: null});

    $(`#pairs`).find(`> div`).each((_, ele) => {
        ele.dispatchEvent(event);
    });
}

(function () {
    const modal = new Modal({el: document.getElementById('gif-modal')});
    modal.on('show', function (m) {
        m.el.classList.remove('fade');
    });

    modal.on('hide', function (m) {
        m.el.classList.add('fade');
    });

    document.getElementById('files').addEventListener('change', handleFileSelect, false);
    document.getElementById('btn-gif').addEventListener('click', () => {
        modal.show();
    }, false);
    document.getElementById('btn-linkage').addEventListener('click', () => {
        let ele = $('#linkages');
        ele.html("");
        for (let chrom in linkages) {
            if (linkages.hasOwnProperty(chrom)) {
                let trace1 = {
                    x: [],
                    y: [],
                    text: [],
                    type: 'scatter',
                    mode: 'lines+markers',
                    line: {shape: 'spline'}
                };

                let sortable = [];
                for (let gene in linkages[chrom]) {
                    if (linkages[chrom].hasOwnProperty(gene)) {
                        let geneData = linkages[chrom][gene];
                        sortable.push([geneData.loc, math.mean(geneData.vals), gene]);
                    }
                }

                if (sortable.length < 3) {
                    continue;
                }

                sortable.sort((a, b) => a[0] - b[0]);

                sortable.forEach(function (item) {
                    trace1.x.push(item[0]);
                    trace1.y.push(item[1]);
                    trace1.text.push(item[2]);
                });

                ele.append(`<div class="row">
                                         <div id="chromosome-${chrom}"></div>
                                       </div>`);
                Plotly.newPlot(`chromosome-${chrom}`, [trace1], {
                    title: `Chromosome ${chrom}`,
                    xaxis: {
                        range: [0, 1600000],
                        autorange: false
                    },
                    yaxis: {
                        range: [-2, 2],
                        autorange: false
                    },
                    width: $(`#chromosome-${chrom}`).parent().width(),
                    height: $(`#chromosome-${chrom}`).parent().width() / 2,
                });
            }
        }
    }, false);

    let gifBtns = document.querySelectorAll('.gif-btn');
    for (let ib = 0, gifBtn; gifBtn = gifBtns[ib]; ib++) {
        gifBtn.addEventListener('click', function () {
            utils.createGif(this.getAttribute('data-gif')).then(() => {
                console.log("Gif created");
            });
        }, false);
    }

    let arrays = document.querySelectorAll('#annotate-array a');
    for (let i = 0, ele; ele = arrays[i]; i++) {
        // noinspection JSUnresolvedFunction
        ele.addEventListener('click', handleAnnotation, false);
    }

    $('#search-genes').select2({
        theme: "bootstrap",
        placeholder: "Search for a gene",
        disabled: true,
        width: 'style',
        dropdownAutoWidth: true,
        allowClear: true
    }).on('select2:select', e => {
        let data = annotationIndex[e.params.data.text];

        clearSearch();

        for (let i = 0, loc; loc = data[i]; i++) {
            let event = new CustomEvent('markStrain', {detail: loc});

            $(`#pairs`).find(`> div[data-plate-num=${loc['plate']}]`).each((_, ele) => {
                ele.dispatchEvent(event);
            });
        }
    }).on('select2:unselect', () => {
        clearSearch();
    });
})();
