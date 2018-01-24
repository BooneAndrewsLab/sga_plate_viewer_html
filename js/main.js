function handleImage(f) {
    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = (function (theFile) {
        return function (e) {
            // Render thumbnail.
            var span = document.createElement('span');
            span.innerHTML = ['<img class="img-fluid" src="', e.target.result,
                '" title="', encodeURI(theFile.name), '"/>'].join('');
            document.getElementById('images').insertBefore(span, null);
        };
    })(f);

    // Read in the image file as a data URL.
    reader.readAsDataURL(f);

}

function compareNumbers(a, b) {
    return a - b;
}

function normalizeWithPmm(sizes) {
    var flat = math.flatten(sizes), mm;
    flat.sort(compareNumbers);
    mm = math.mean(flat.slice(flat.length * .4, flat.length * .6));

    return math.chain(sizes).divide(mm).map(function (v) {
        return v > 1 ? Math.min(v, 1.5) : Math.max(v, .5);
    }).done();
}

function readColony(data) {
    var lines = data.match(/[^\r\n]+/g);

    var arraySize = lines.length - 13;
    var sizes;

    if (arraySize == 1536) {
        sizes = math.zeros(32, 48)._data;
    }

    for (var i = 13, l; l = lines[i]; i++) {
        l = l.match(/[^\s]+/g);
        sizes[32 - parseInt(l[0])][parseInt(l[1]) - 1] = parseInt(l[2]);
    }

    sizes = normalizeWithPmm(sizes);

    var span = document.createElement('div');
    document.getElementById('heatmaps').insertBefore(span, null);

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
            showscale: false
        }
    ];

    var axisTemplate = {
        showgrid: false,
        zeroline: false,
        linecolor: 'black',
        showticklabels: false,
        ticks: ''
    };

    var layout = {
        xaxis: axisTemplate,
        yaxis: axisTemplate,
        showlegend: false,
        width: 540,
        height: 360,
        margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 0,
            pad: 0
        },
    };

    Plotly.newPlot(span, data, layout, {displayModeBar: false});
}

function handleDat(f) {
    var reader = new FileReader();

    reader.onloadend = function (evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
            if (evt.target.result.slice(0, 24) == 'Colony Project Data File') {
                readColony(evt.target.result);
            }
        }
    };

    reader.readAsBinaryString(f);
}

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {
        // Only process image files.
        if (f.type.match('image.*')) {
            handleImage(f);
        } else {
            handleDat(f);
        }
    }
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);
