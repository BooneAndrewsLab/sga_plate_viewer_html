export function readColony(data) {
    let lines = data.match(/[^\r\n]+/g);
    let arraySize = lines.length - 13;
    let sizes, rows;

    if (arraySize === 1536) {
        sizes = math.zeros(32, 48)._data;
        rows = 32;
    } else if (arraySize === 384) {
        sizes = math.zeros(16, 24)._data;
        rows = 16;
    }

    let [x0, x1, y0, y1] = lines[7].match(/[^\s]+/g).map(v => parseInt(v));
    let [x, y] = lines[11].match(/[^\s]+/g).map(v => parseInt(v));

    for (let i = 13, l; l = lines[i]; i++) {
        l = l.match(/[^\s]+/g);
        sizes[rows - parseInt(l[0])][parseInt(l[1]) - 1] = parseInt(l[2]);
    }

    return {sizes, x0, y0, x1, y1, x, y};
}

export function readGitter(data) {
    let lines = data.match(/[^\r\n]+/g);
    let headerSize = 0;
    let sizes, rows;

    for (let i = 0, l; l = lines[i]; i++) {
        if (l.indexOf('#') === 0) { // Ignore commented lines, header size might vary
            headerSize++;
        } else {
            break;
        }
    }

    let arraySize = lines.length - headerSize;

    if (arraySize === 1536) {
        sizes = math.zeros(32, 48)._data;
        rows = 32;
    } else if (arraySize === 384) {
        sizes = math.zeros(16, 24)._data;
        rows = 16;
    }

    for (let i = headerSize, l; l = lines[i]; i++) {
        l = l.match(/[^\s]+/g);
        sizes[rows - parseInt(l[0])][parseInt(l[1]) - 1] = parseInt(l[2]);
    }

    return sizes;
}

export function readPyGitterV1(data) {
    let lines = data.match(/[^\r\n]+/g);
    let arraySize = lines.length - 5;
    let sizes, rows;

    if (arraySize === 1536) {
        sizes = math.zeros(32, 48)._data;
        rows = 32;
    } else if (arraySize === 384) {
        sizes = math.zeros(16, 24)._data;
        rows = 16;
    }

    for (let i = 5, l; l = lines[i]; i++) {
        l = l.match(/[^\s]+/g);
        console.log(parseInt(l[0]), parseInt(l[1]), parseInt(l[2]));
        sizes[rows - parseInt(l[1])][parseInt(l[0]) - 1] = parseInt(l[2]);
    }

    return sizes;
}
