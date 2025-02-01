function drawTable(N) {
    const mainContainer = document.getElementById("main-container");
    var grid = document.createElement("div");
    grid.id = "container";
    grid.style.display = "grid";
    grid.style.gridTemplateRows = `repeat(${N}, 1fr)`; // quiet zone
    grid.style.gridTemplateColumns = `repeat(${N}, 1fr)`; // included
    grid.style.gap = "0";
    grid.style.border = "48px solid white";
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            const cell = document.createElement("div");
            cell.id = `r${i}c${j}`;
            cell.style.border = "1px solid #000"; //optional
            cell.style.aspectRatio = "1 / 1";
            cell.style.width = "12px";
            cell.style.height = "12px";
            cell.style.backgroundColor = "grey";
            grid.appendChild(cell);
        }
    }
    mainContainer.appendChild(grid);
}

function drawPixel(row, col, color) {
    var cell = document.getElementById(`r${row}c${col}`);
    cell.style.backgroundColor = color;
}

function drawFinderPatterns(row, col, size) {
    for (let i = -1; i < 8; i++)
        for (let j = -1; j < 8; j++)
            if ((0 <= row + i && row + i < size) && (0 <= col + j && col + j < size))
                drawPixel(row + i, col + j, "rgb(255, 255, 255)");
    const pattern = [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1]
    ];
    for (let i = 0; i < 7; i++)
        for (let j = 0; j < 7; j++)
            if (pattern[i][j] == 1)
                drawPixel(row + i, col + j, "rgb(0, 0, 0)");
}

function drawTimingPatterns(size) {
    for (let i = 8; i < size - 8; i++)
        if (i % 2 == 0) {
            drawPixel(i, 6, "rgb(0, 0, 0)");
            drawPixel(6, i, "rgb(0, 0, 0)");
        }
        else {
            drawPixel(i, 6, "rgb(255, 255, 255)");
            drawPixel(6, i, "rgb(255, 255, 255)");
        }
}

function drawAlignmentPattern(size) {
    const pattern = [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1]
    ];
    for (let i = 0; i < 5; i++)
        for (let j = 0; j < 5; j++)
            if (pattern[i][j] == 1)
                drawPixel(size - 6 + i, size - 6 + j, "rgb(0, 0, 0)");
            else
                drawPixel(size - 6 + i, size - 6 + j, "rgb(255, 255, 255)");
}

function eccFormatString(data) {
    var genPoly = "10100110111";
    const qrcodexor = "101010000010010";
    let eccString = data.padEnd(15, "0");
    while (eccString.length > 10) {
        if (eccString[0] === "1") {
            eccString = (parseInt(eccString, 2) ^ parseInt(genPoly.padEnd(eccString.length, "0"), 2))
                .toString(2).padStart(eccString.length, "0");
        }
        eccString = eccString.substring(1);
    }
    eccString = data + eccString.padStart(10, "0");
    eccString = (parseInt(eccString, 2) ^ parseInt(qrcodexor, 2)).toString(2);
    return eccString.padStart(15, "0");
}

function drawFormatString(size, formatString) {
    for (let i = 0; i < 6; i++) { // done
        const color = formatString[i] === "1" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
        drawPixel(8, i, color);
    }
    for (let i = 0; i < 7; i++) { // done
        const color = formatString[i] === "1" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
        drawPixel(size - 1 - i, 8, color);
    }
    for (let i = 0; i < 8; i++) { // done
        const color = formatString[i + 7] === "1" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
        drawPixel(8, size - 8 + i, color);
    }
    for (let i = 5; i >= 0; i--) { // done
        const color = formatString[i + 9] === "1" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
        drawPixel(5 - i, 8, color);
    }
    var culori = [];
    for (let i = 6; i < 9; i++)
        culori.push(formatString[i] === "1" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)");
    drawPixel(8, 7, culori[0]);
    drawPixel(8, 8, culori[1]);
    drawPixel(7, 8, culori[2]);
}

function convertToBinary() {
    const inputString = document.getElementById("textinput").value;
    let modeIndicator = 0; // 0: numeric by default, 1: alphanumeric, 2: byte

    const binaryContent = Array.from(inputString).reduce((binaryArray, char) => {
        const asciiCode = char.charCodeAt(0);
        if (modeIndicator === 0 && /[A-Za-z]/.test(char)) {
            modeIndicator = 1;
        } else if (modeIndicator !== 2 && /[^A-Za-z0-9]/.test(char)) {
            modeIndicator = 2;
        }
        binaryArray.push(asciiCode.toString(2).padStart(8, "0"));
        return binaryArray;
    }, []);
    return [modeIndicator, binaryContent.length, binaryContent];
}

window.onload = function() {
    document.getElementById("generare").addEventListener("click", () => {
        const container = document.getElementById("container");
        if (container)
            container.remove();
        var size = 17 + 4 * Number(document.getElementById("version").value);
        var eccLevel = Number(document.getElementById("error").value).toString(2).padStart(2, '0');
        var maskPattern = Number(document.getElementById("mask").value).toString(2).padStart(3, '0');
        var formatString = eccLevel + maskPattern;
        formatString = eccFormatString(formatString);
        drawTable(size);
        let Mode4Bit = ["0001", "0010", "0100"];
        let [ModeIndicator, StringLength, StringContent] = convertToBinary();
        drawPixel(size - 8, 8, "rgb(0, 0, 0)"); // dark module
        drawFinderPatterns(0, 0, size); // finder patterns
        drawFinderPatterns(0, size - 7, size);
        drawFinderPatterns(size - 7, 0, size);
        drawTimingPatterns(size);
        drawAlignmentPattern(size);
        drawFormatString(size, formatString);
    });
}