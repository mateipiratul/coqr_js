const errorCorrectionTable = {
    1: { 1: 7, 0: 10, 3: 13, 2: 17 },
    2: { 1: 10, 0: 16, 3: 22, 2: 28 },
    3: { 1: 15, 0: 26, 3: 36, 2: 44 },
    4: { 1: 20, 0: 36, 3: 52, 2: 64 },
    5: { 1: 26, 0: 48, 3: 72, 2: 88 },
},
nrOfBytes = [26, 44, 70, 100, 136];

let protected_areas = [];

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
            cell.style.border = "1px solid red"; //optional
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
            if ((0 <= row + i && row + i < size) && (0 <= col + j && col + j < size)) {
                drawPixel(row + i, col + j, "rgb(255, 255, 255)");
                protected_areas.push([row + i, col + j]);
            }

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
    for (let i = 8; i < size - 8; i++) {
        if (i % 2 == 0) {
            drawPixel(i, 6, "rgb(0, 0, 0)");
            drawPixel(6, i, "rgb(0, 0, 0)");
        }
        else {
            drawPixel(i, 6, "rgb(255, 255, 255)");
            drawPixel(6, i, "rgb(255, 255, 255)");
        }
        protected_areas.push([i, 6]);
        protected_areas.push([6, i]);
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
        for (let j = 0; j < 5; j++) {
            if (pattern[i][j] == 1)
                drawPixel(size - 9 + i, size - 9 + j, "rgb(0, 0, 0)");
            else
                drawPixel(size - 9 + i, size - 9 + j, "rgb(255, 255, 255)");
            protected_areas.push([size - 9 + i, size - 9 + j]);
        }
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
    for (let i = 0; i < 6; i++) {
        const color = formatString[i] === "1" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
        drawPixel(8, i, color);
        protected_areas.push([8, i]);
    }
    for (let i = 0; i < 7; i++) {
        const color = formatString[i] === "1" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
        drawPixel(size - 1 - i, 8, color);
        protected_areas.push([size - 1 - i, 8]);
    }
    for (let i = 0; i < 8; i++) {
        const color = formatString[i + 7] === "1" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
        drawPixel(8, size - 8 + i, color);
        protected_areas.push([8, size - 8 + i]);
    }
    for (let i = 5; i >= 0; i--) {
        const color = formatString[i + 9] === "1" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
        drawPixel(5 - i, 8, color);
        protected_areas.push([5 - i, 8]);
    }
    var culori = [];
    for (let i = 6; i < 9; i++)
        culori.push(formatString[i] === "1" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)");
    drawPixel(8, 7, culori[0]);
    drawPixel(8, 8, culori[1]);
    drawPixel(7, 8, culori[2]);
    protected_areas.push([8, 7]);
    protected_areas.push([8, 8]);
    protected_areas.push([7, 8]);
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

function padData(mode, length, content, sizemax) {
    var result = [mode, length, ...content, "0000"].join(""), contor = 0, returnArray = [];
    while (result.length < (nrOfBytes[sizemax] - errorCorrectionTable[Number(document.getElementById("version").value)][Number(document.getElementById("error").value)]) * 8) {
        if (contor % 2 === 0)
            result += "11101100";
        else result += "00010001";
        contor++;
    }
    for (let i = 0; i < result.length; i += 8)
        returnArray.push(result.slice(i, i + 8));
    return returnArray;
}

class GaloisField {
    constructor() {
        this.exp = new Array(512);
        this.log = new Array(256);
        let x = 1;

        for (let i = 0; i < 255; i++) {
            this.exp[i] = x;
            this.log[x] = i;
            x <<= 1;
            if (x & 0x100) {
                x ^= 0x11D;
            }
        }

        for (let i = 255; i < 512; i++) {
            this.exp[i] = this.exp[i - 255];
        }
    }

    multiply(x, y) {
        if (x === 0 || y === 0)
            return 0;
        return this.exp[(this.log[x] + this.log[y]) % 255];
    }
}

function generatePolynomial(numErrorWords) {
    const gf = new GaloisField();
    let g = [1];

    for (let i = 0; i < numErrorWords; i++) {
        let temp = new Array(g.length + 1).fill(0);

        for (let j = 0; j < g.length; j++) {
            temp[j] ^= g[j]; // Copy existing terms
            temp[j + 1] ^= gf.multiply(g[j], gf.exp[i]); // Multiply by α^i
        }
        g = temp;
    }
    return g;
}

function reedSolomonEncode(dataWords, numErrorWords) {
    const gf = new GaloisField();
    const generator = generatePolynomial(numErrorWords);
    let message = [...dataWords, ...new Array(numErrorWords).fill(0)];

    for (let i = 0; i < dataWords.length; i++) {
        let coef = message[i];
        if (coef !== 0)
            for (let j = 1; j < generator.length; j++)
                message[i + j] ^= gf.multiply(generator[j], coef);
    }

    return [...dataWords, ...message.slice(dataWords.length)];
}

function placeDataBits(bits, size) {
    let bitIndex = 0;
    let goingUp = true;  // First column pair goes up

    // Start from the right, moving left in pairs of columns
    for (let rightCol = size - 1; rightCol >= 0; rightCol -= 2) {
        let leftCol = rightCol - 1;

        // Handle vertical timing pattern
        if (rightCol === 6) {
            rightCol = 5;
            leftCol = 4;
        }

        // Determine starting row based on direction
        let row = goingUp ? size - 1 : 0;

        while ((goingUp && row >= 0) || (!goingUp && row < size) && bitIndex < bits.length) {
            // Place bit in right column
            if (!protected_areas.some(area => area[0] === row && area[1] === rightCol)) {
                const color = bits[bitIndex] === "1" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
                drawPixel(row, rightCol, color);
                bitIndex++;
            }

            // Place bit in left column (if it exists)
            if (leftCol >= 0 && bitIndex < bits.length && !protected_areas.some(area => area[0] === row && area[1] === leftCol)) {
                const color = bits[bitIndex] === "1" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
                drawPixel(row, leftCol, color);
                bitIndex++;
            }

            // Move row in current direction
            row += goingUp ? -1 : 1;
        }

        // Switch direction for next column pair
        goingUp = !goingUp;
    }

    return bitIndex;
}

function applyMask(size) {
    for (let i = 0; i < size; i++)
        for (let j = 0; j < size; j++)
            switch (maskPattern) {
                case 0:
                    condition = (i + j) % 2 === 0;
                    break;
                case 1:

            }
}

function flipBit(row, col) {
    var cell = document.getElementById(`r${row}c${col}`);
    const color = cell.style.backgroundColor === "rgb(0, 0, 0)" ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)";
    cell.style.backgroundColor = color;
}

window.onload = function() {
    document.getElementById("generare").addEventListener("click", () => {
        const container = document.getElementById("container");
        if (container)
            container.remove();
        var size = 17 + 4 * Number(document.getElementById("version").value);
        var eccLevel = Number(document.getElementById("error").value).toString(2).padStart(2, "0");
        var maskPattern = Number(document.getElementById("mask").value).toString(2).padStart(3, "0");
        var formatString = eccLevel + maskPattern;
        formatString = eccFormatString(formatString);
        var numEccCodewords = errorCorrectionTable[Number(document.getElementById("version").value)][Number(document.getElementById("error").value)];
        let Mode4Bit = ["0001", "0010", "0100"];
        let [ModeIndicator, StringLength, StringContent] = convertToBinary();
        let paddedStringContent = padData(Mode4Bit[ModeIndicator], StringLength.toString(2).padStart(8, "0"), StringContent, Number(document.getElementById("version").value) - 1);
        let StringContentToDecimal = paddedStringContent.map(bin => parseInt(bin, 2));
        let completeDataBits = reedSolomonEncode(StringContentToDecimal, numEccCodewords).map(num => num.toString(2).padStart(8, "0"));
        let flippy = completeDataBits.map(s => s.split("").reverse().join(""));
        let bits = flippy.join("") + "0000000";

        drawTable(size);
        drawPixel(size - 8, 8, "rgb(0, 0, 0)"); // dark module
        protected_areas.push([size - 8, 8]);
        drawFinderPatterns(0, 0, size); // finder patterns
        drawFinderPatterns(0, size - 7, size);
        drawFinderPatterns(size - 7, 0, size);
        drawTimingPatterns(size);
        if (Number(document.getElementById("version").value) !== 1)
            drawAlignmentPattern(size);
        drawFormatString(size, formatString);
        placeDataBits(bits, size);

        // smadu butonul ala de html punel cu value 10 si numele "automask" sau cv de genu
        if (Number(document.getElementById("mask").value) !== 10) // best mask algorithm to be applied if value is 10
            applyMask(size, Number(document.getElementById("mask").value));
        else // de aici tte descurci tu
    });
}