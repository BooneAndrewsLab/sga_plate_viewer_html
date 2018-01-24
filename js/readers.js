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

    return sizes;
}

function readGitter(data) {
    var lines = data.match(/[^\r\n]+/g);

    var arraySize = lines.length - 4;
    var sizes;

    if (arraySize == 1536) {
        sizes = math.zeros(32, 48)._data;
    }

    for (var i = 4, l; l = lines[i]; i++) {
        l = l.match(/[^\s]+/g);
        sizes[32 - parseInt(l[0])][parseInt(l[1]) - 1] = parseInt(l[2]);
    }

    return sizes;
}
