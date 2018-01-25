function readColony(data) {
    var lines = data.match(/[^\r\n]+/g);

    var arraySize = lines.length - 13;
    var sizes, rows;

    if (arraySize == 1536) {
        sizes = math.zeros(32, 48)._data;
        rows = 32;
    } else if (arraySize == 384) {
        sizes = math.zeros(16, 24)._data;
        rows = 16;
    }

    for (var i = 13, l; l = lines[i]; i++) {
        l = l.match(/[^\s]+/g);
        sizes[rows - parseInt(l[0])][parseInt(l[1]) - 1] = parseInt(l[2]);
    }

    return sizes;
}

function readGitter(data) {
    var lines = data.match(/[^\r\n]+/g);

    var headerSize = 0;
    for (var i = 0, l; l = lines[i]; i++) {
        if (l.indexOf('#') == 0) { // Ignore commented lines, header size might vary
            headerSize++;
        } else {
            break;
        }
    }

    var arraySize = lines.length - headerSize;
    var sizes, rows;

    if (arraySize == 1536) {
        sizes = math.zeros(32, 48)._data;
        rows = 32;
    } else if (arraySize == 384) {
        sizes = math.zeros(16, 24)._data;
        rows = 16;
    }

    for (var i = headerSize, l; l = lines[i]; i++) {
        l = l.match(/[^\s]+/g);
        sizes[rows - parseInt(l[0])][parseInt(l[1]) - 1] = parseInt(l[2]);
    }

    return sizes;
}
