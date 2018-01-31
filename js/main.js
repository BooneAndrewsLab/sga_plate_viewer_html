var fileData;
var colorscaleValue = [
    [0, '#FF0000'],
    [.5, '#000000'],
    [1, '#00FF00']
];

function handleImage(f, ele) {
    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = (function (theFile) {
        return function (e) {
            // Render thumbnail.
            ele.innerHTML = ['<img class="img-fluid" src="', e.target.result,
                '" title="', encodeURI(theFile.name),
                '" onload="this.parentElement.classList.add(\'show\'); initNewItem();"/>'].join('');
        };
    })(f);

    // Read in the image file as a data URL.
    reader.readAsDataURL(f);
}

function handleDat(f, ele) {
    var reader = new FileReader();
    var sizes, normalized, div;

    reader.onloadend = function (evt) {
        if (evt.target.readyState === FileReader.DONE) { // DONE == 2
            if (evt.target.result.slice(0, 24) === 'Colony Project Data File') {
                sizes = readColony(evt.target.result);
            } else if (evt.target.result.slice(0, 8) === '# gitter') {
                sizes = readGitter(evt.target.result);
            } else {
                console.log('Unknown data file format');
                return;
            }

            var pmm = calculatePmm(sizes);
            normalized = normalizeWithPmm(sizes, pmm);

            /* Save pmm in attributes */
            ele.parentElement.setAttribute('data-pmm', pmm);

            div = document.createElement('div');
            ele.insertBefore(div, null);

            var data = [{
                z: normalized,
                type: 'heatmap',
                colorscale: colorscaleValue,
                showscale: false,
                hoverinfo: 'none'
            }];

            var axisTemplate = {
                showgrid: false,
                zeroline: false,
                linecolor: 'black',
                showticklabels: false,
                fixedrange: true,
                ticks: ''
            };

            var layout = {
                xaxis: axisTemplate,
                yaxis: axisTemplate,
                showlegend: false,
                width: elementInnerWidth(ele),
                height: (elementInnerWidth(ele) / 3) * 2,
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

            ele.parentElement.addEventListener('updateHeatmap', function(evt) {
                data[0]['z'] = normalizeWithPmm(sizes, evt.detail.pmm || pmm);

                Plotly.update(div, data, layout);
            }, false);

            initNewItem();
        }
    };

    reader.readAsBinaryString(f);
}

/**
 * Called when all images and heatmaps are loaded
 */
function initListeners() {
    var pairs = document.querySelectorAll('#pairs .row');
    var i, j, ele, eme;

    for (i = 0; ele = pairs[i]; i++) {
        /* Use this plate as the reference for other heatmaps */
        ele.addEventListener('click', function () {
            this.classList.toggle("bg-warning");
            var eventData = {'detail': {}};
            if (this.classList.contains('bg-warning')) {
                eventData['detail']['pmm'] = this.getAttribute('data-pmm');
            }

            /* Dispatch update to all other heatmaps */
            for (j = 0; eme = pairs[j]; j++) {
                if (eme != this) {
                    eme.classList.remove("bg-warning");
                }

                var event = new CustomEvent('updateHeatmap', eventData);
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
        var ele = document.querySelector('.new-plate');
        if (!ele) {
            initListeners();
            return;
        }

        ele.classList.remove('new-plate');

        var name = ele.parentElement.getAttribute('data-pair-name');
        var data = fileData[name];

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
    var files = evt.target.files; // FileList object
    var base, names = [], data, i, f, name, tally = {'images': 0, 'dats': 0}, colSize;
    var pairsParent, div, inner;

    pairsParent = document.getElementById('pairs');
    pairsParent.innerHTML = ''; // Clear element
    fileData = {};

    for (i = 0; f = files[i]; i++) {
        base = getBaseName(f.name);

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

    for (i = 0; name = names[i]; i++) {
        data = fileData[name];

        div = document.createElement('div');
        div.classList.add('row');
        div.classList.add('py-2');
        div.setAttribute('data-pair-name', name);

        inner = ['<div class="col-sm-12 fade" id="', encodeURI(name), '"><h4>', name, '</h4></div>'];

        if (tally['images']) {
            inner = inner.concat(['<div class="col-sm-', colSize, ' fade new-plate" data-plate-type="image" id="', encodeURI(name), '-image"></div>']);
        }

        if (tally['dats']) {
            inner = inner.concat(['<div class="col-sm-', colSize, ' fade new-plate" data-plate-type="heatmap" id="', encodeURI(name), '-heatmap"></div>'])
        }

        div.innerHTML = inner.join('');

        pairsParent.insertBefore(div, null);
    }

    initNewItem();
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);
