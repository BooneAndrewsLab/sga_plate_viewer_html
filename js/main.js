var fileData;

function handleImage(f, ele) {
    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = (function (theFile) {
        return function (e) {
            // Render thumbnail.
            ele.innerHTML = ['<img class="img-fluid fade" src="', e.target.result,
                '" title="', encodeURI(theFile.name), '" onload="this.classList.add(\'show\')"/>'].join('');
        };
    })(f);

    // Read in the image file as a data URL.
    reader.readAsDataURL(f);
}

function handleDat(f, ele) {
    var reader = new FileReader();
    var sizes, div;

    reader.onloadend = function (evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
            if (evt.target.result.slice(0, 24) == 'Colony Project Data File') {
                sizes = readColony(evt.target.result);
            } else if (evt.target.result.slice(0, 8) == '# gitter') {
                sizes = readGitter(evt.target.result);
            } else {
                console.log('Unknown data file format');
                return;
            }

            sizes = normalizeWithPmm(sizes);

            div = document.createElement('div');
            ele.insertBefore(div, null);

            var colorscaleValue = [
                [0, '#FF0000'],
                [.5, '#000000'],
                [1, '#00FF00']
            ];

            var data = [
                {
                    z: sizes,
                    type: 'heatmap',
                    colorscale: colorscaleValue,
                    showscale: false,
                    hoverinfo: 'none'
                }
            ];

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
                },
            };

            Plotly.newPlot(div, data, layout, {displayModeBar: false});
        }
    };

    reader.readAsBinaryString(f);
}

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    var base, names = [], data;
    var pairsParent, div;

    pairsParent = document.getElementById('pairs');
    pairsParent.innerHTML = ''; // Clear element
    fileData = {};

    for (var i = 0, f; f = files[i]; i++) {
        base = getBaseName(f.name);

        if (!fileData.hasOwnProperty(base)) {
            fileData[base] = {};
            names.push(base);
        }

        if (f.type.match('image.*')) {
            fileData[base]['image'] = f;
        } else {
            fileData[base]['data'] = f;
        }
    }

    names.sort();

    for (var i = 0, name; name = names[i]; i++) {
        data = fileData[name];

        div = document.createElement('div');
        div.classList.add('row');
        div.classList.add('py-2');

        div.innerHTML = [
            '<div class="col-sm-12"><h4>', name, '</h4></div>',
            '<div class="col-sm-6" id="', encodeURI(name), '-image"></div>',
            '<div class="col-sm-6" id="', encodeURI(name), '-heatmap"></div>'].join('');

        pairsParent.insertBefore(div, null);

        if (data.hasOwnProperty('image')) {
            handleImage(data['image'], document.getElementById(encodeURI(name) + '-image'));
        }

        if (data.hasOwnProperty('data')) {
            handleDat(data['data'], document.getElementById(encodeURI(name) + '-heatmap'));
        }
    }
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);
