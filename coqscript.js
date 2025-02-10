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
            cell.style.aspectRatio = "1 / 1";
            cell.style.width = "12px";
            cell.style.height = "12px";
            cell.style.backgroundColor = "grey";
            grid.appendChild(cell);
        }
    }
    mainContainer.appendChild(grid);
}

function drawPixel(row, col, color) { // func
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
    const qrcodexor = "101010000010010", genPoly = "10100110111"; // polinomul generator si masca de 15 biti
    let eccString = data.padEnd(15, "0");
    while (eccString.length > 10) {
        if (eccString[0] === "1") {
            eccString = (parseInt(eccString, 2) ^ parseInt(genPoly.padEnd(eccString.length, "0"), 2))
                .toString(2).padStart(eccString.length, "0");
        }
        eccString = eccString.substring(1); // decrementarea marimii
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
        if (x === 0 || y === 0) // orice
            return 0;
        return this.exp[(this.log[x] + this.log[y]) % 255];
    }
}

function generatePolynomial(numErrorWords) {
    const gf = new GaloisField(); // obiectul camp Galois
    let g = [1];

    for (let i = 0; i < numErrorWords; i++) {
        let temp = new Array(g.length + 1).fill(0);

        for (let j = 0; j < g.length; j++)
            temp[j + 1] = gf.multiply(g[j], gf.exp[i]);
        for (let j = 0; j < g.length; j++)
            temp[j] ^= g[j];

        g = temp;
    }
    return g;
}

function reedSolomonEncode(dataWords, numErrorWords) {
    const gf = new GaloisField(); // obiectul camp Galois
    const generator = generatePolynomial(numErrorWords);
    let message = [...dataWords, ...new Array(numErrorWords).fill(0)];

    for (let i = 0; i < dataWords.length; i++) {
        const coef = message[i];
        if (coef !== 0)
            for (let j = 0; j < generator.length; j++)
                message[i + j] ^= gf.multiply(generator[j], coef);
    }

    return message.slice(dataWords.length);
}

function placeDataBits(bits, size) {
    let bitIndex = 0; // indexul bitilor din string-ul de informatii
    let goingUp = true; // sensul parcurgerii
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (!protected_areas.some(area => area[0] === i && area[1] === j)) {
                drawPixel(i, j, "rgb(255, 255, 255)");
            }
        }
    }
    for (let rightCol = size - 1; rightCol >= 0; rightCol -= 2) {
        let leftCol = rightCol - 1;
        if (rightCol === 6) { // omite coloana 6 (hardcoded)
            rightCol = 5;
            leftCol = 4;
        }
        let row = goingUp ? size - 1 : 0;

        while ((goingUp && row >= 0) || (!goingUp && row < size) && bitIndex < bits.length) {
            if (!protected_areas.some(area => area[0] === row && area[1] === rightCol)) {
                const color = bits[bitIndex] === "1" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
                drawPixel(row, rightCol, color);
                bitIndex++;
            }
            if (leftCol >= 0 && bitIndex < bits.length && !protected_areas.some(area => area[0] === row && area[1] === leftCol)) {
                const color = bits[bitIndex] === "1" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
                drawPixel(row, leftCol, color);
                bitIndex++;
            }
            row += goingUp ? -1 : 1;
        }
        goingUp = !goingUp;
    }
    return bitIndex;
}

function applyMask(size) {
    var maskPattern = Number(document.getElementById("mask").value);

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (protected_areas.some(area => area[0] === i && area[1] === j)) {
                continue;
            }

            let shouldFlip = false;

            switch (maskPattern) {
                case 0:
                    shouldFlip = (i + j) % 2 === 0;
                    break;
                case 1:
                    shouldFlip = i % 2 === 0;
                    break;
                case 2:
                    shouldFlip = j % 3 === 0;
                    break;
                case 3:
                    shouldFlip = (i + j) % 3 === 0;
                    break;
                case 4:
                    shouldFlip = (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
                    break;
                case 5:
                    shouldFlip = ((i * j) % 2 + (i * j) % 3) === 0;
                    break;
                case 6:
                    shouldFlip = (((i * j) % 2 + (i * j) % 3) % 2) === 0;
                    break;
                case 7:
                    shouldFlip = (((i + j) % 2 + (i * j) % 3) % 2) === 0;
                    break;
            }

            if (shouldFlip) {
                flipBit(i, j);
            }
        }
    }
}

function flipBit(row, col) {
    var cell = document.getElementById(`r${row}c${col}`); // retrieve element
    const color = cell.style.backgroundColor === "rgb(0, 0, 0)" ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)";
    cell.style.backgroundColor = color;
}

function calculatePenaltyScore(size) {
    return (
        calculatePenaltyRule1(size) +
        calculatePenaltyRule2(size) +
        calculatePenaltyRule3(size) +
        calculatePenaltyRule4(size)
    ); // calculul scorului final
}

function calculatePenaltyRule1(size) {
    let penalty = 0;

    for (let row = 0; row < size; row++) {
        let count = 1;
        let lastColor = getPixelColor(row, 0);

        for (let col = 1; col < size; col++) {
            const currentColor = getPixelColor(row, col);
            if (currentColor === lastColor) {
                count++;
            } else {
                if (count >= 5) penalty += count - 2;
                count = 1;
                lastColor = currentColor;
            }
        }
        if (count >= 5) penalty += count - 2;
    }

    for (let col = 0; col < size; col++) {
        let count = 1;
        let lastColor = getPixelColor(0, col);

        for (let row = 1; row < size; row++) {
            const currentColor = getPixelColor(row, col);
            if (currentColor === lastColor) {
                count++;
            } else {
                if (count >= 5) penalty += count - 2;
                count = 1;
                lastColor = currentColor;
            }
        }
        if (count >= 5) penalty += count - 2;
    }

    return penalty;
}

function calculatePenaltyRule2(size) {
    let penalty = 0;

    for (let row = 0; row < size - 1; row++) {
        for (let col = 0; col < size - 1; col++) {
            const topLeft = getPixelColor(row, col);
            const topRight = getPixelColor(row, col + 1);
            const bottomLeft = getPixelColor(row + 1, col);
            const bottomRight = getPixelColor(row + 1, col + 1);

            if (topLeft === topRight && topRight === bottomLeft &&
                bottomLeft === bottomRight) {
                penalty += 3;
            }
        }
    }

    return penalty;
}

function calculatePenaltyRule3(size) {
    let penalty = 0;
    const pattern1 = "10111010000";
    const pattern2 = "00001011101";

    for (let row = 0; row < size; row++) {
        let rowPattern = "";
        for (let col = 0; col < size; col++) {
            rowPattern += getPixelColor(row, col) === "rgb(0, 0, 0)" ? "1" : "0";
        }
        if (rowPattern.includes(pattern1) || rowPattern.includes(pattern2)) {
            penalty += 40;
        }
    }

    for (let col = 0; col < size; col++) {
        let colPattern = "";
        for (let row = 0; row < size; row++) {
            colPattern += getPixelColor(row, col) === "rgb(0, 0, 0)" ? "1" : "0";
        }
        if (colPattern.includes(pattern1) || colPattern.includes(pattern2)) {
            penalty += 40;
        }
    }

    return penalty;
}

function calculatePenaltyRule4(size) {
    let darkModules = 0;
    let totalModules = size * size;

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (getPixelColor(row, col) === "rgb(0, 0, 0)") {
                darkModules++;
            }
        }
    }

    const percentage = (darkModules * 100) / totalModules;
    const previousMultiple = Math.floor(percentage / 5) * 5;
    const nextMultiple = previousMultiple + 5;
    const distanceToPrevious = Math.abs(percentage - previousMultiple);
    const distanceToNext = Math.abs(percentage - nextMultiple);
    const nearestMultiple = distanceToPrevious < distanceToNext ? previousMultiple : nextMultiple;

    return Math.abs(nearestMultiple - 50) * 2;
}

function getPixelColor(row, col) {
    const cell = document.getElementById(`r${row}c${col}`);
    return cell ? cell.style.backgroundColor : "rgb(255, 255, 255)";
}

function findBestMask(size, bits) {
    console.log(bits.length);
    let bestMask = 0;
    let bestScore = Infinity;

    const initialState = Array(size).fill().map(() => Array(size).fill());
    for (let i = 0; i < size; i++)
        for (let j = 0; j < size; j++)
            initialState[i][j] = getPixelColor(i, j);

    for (let mask = 0; mask < 8; mask++) {
        console.log(`testing mask ${mask}`);
        for (let i = 0; i < size; i++)
            for (let j = 0; j < size; j++)
                if (!protected_areas.some(area => area[0] === i && area[1] === j))
                    drawPixel(i, j, initialState[i][j]);

        document.getElementById("mask").value = mask;
        applyMask(size);

        const score = calculatePenaltyScore(size);
        console.log(`mask ${mask} score: ${score}`);

        if (score < bestScore) {
            bestScore = score;
            bestMask = mask;
        }
        applyMask(size);
    }

    console.log(`best mask: ${bestMask} score ${bestScore}`);
    return bestMask;
}

window.onload = function() {
    document.getElementById("generare").addEventListener("click", () => {
        const container = document.getElementById("container");
        if (container) { // daca a fost deja generat un cod qr anterior, sunt sterse datele anterioare
            container.remove();
            protected_areas = [];
        }
        var size = 17 + 4 * Number(document.getElementById("version").value);
        var eccLevel = Number(document.getElementById("error").value).toString(2).padStart(2, "0");
        var maskSelect = document.getElementById("mask");
        var maskPattern, formatString;
        var numEccCodewords = errorCorrectionTable[Number(document.getElementById("version").value)][Number(document.getElementById("error").value)];
        let Mode4Bit = ["0001", "0010", "0100"];
        let [ModeIndicator, StringLength, StringContent] = convertToBinary();
        let paddedStringContent = padData(Mode4Bit[ModeIndicator], StringLength.toString(2).padStart(8, "0"), StringContent, Number(document.getElementById("version").value) - 1);
        let StringContentToDecimal = paddedStringContent.map(bin => parseInt(bin, 2));
        let ecc = reedSolomonEncode(StringContentToDecimal, numEccCodewords).map(num => num.toString(2).padStart(8, "0").split("").reverse().join(""));
        let completeDataBits = [...StringContentToDecimal.map(num => num.toString(2).padStart(8, "0")), ...ecc];
        let flippy = completeDataBits.map(s => s.split("").reverse().join("")); // bitii sunt inversati pentru algoritmul de umplere a matricei
        let bits = flippy.join("") + "0000000";

        console.log(bits); // check
        if (StringLength + numEccCodewords + 2 <= nrOfBytes[Number(document.getElementById("version").value)]) {
            drawTable(size);
            drawPixel(size - 8, 8, "rgb(0, 0, 0)"); // dark module
            protected_areas.push([size - 8, 8]);
            drawFinderPatterns(0, 0, size);
            drawFinderPatterns(0, size - 7, size);
            drawFinderPatterns(size - 7, 0, size);
            drawTimingPatterns(size);
            if (Number(document.getElementById("version").value) !== 1)
                drawAlignmentPattern(size);
            placeDataBits(bits, size); // algoritmul de encodare in sine

            if (maskSelect.value === "auto") {
                const bestMask = findBestMask(size, bits);
                maskSelect.value = bestMask.toString();
                maskPattern = bestMask.toString(2).padStart(3, "0");
            } else maskPattern = Number(maskSelect.value).toString(2).padStart(3, "0");

            formatString = eccLevel + maskPattern; // cei 5 biti pentru calculul Format String
            formatString = eccFormatString(formatString); // rezultatul de 15 biti
            drawFormatString(size, formatString);
            applyMask(size); // aplicarea mastii in sine
        } else alert("Version too small or error correction level too high for this version."); // eroare
    });
    document.getElementById("decoder").addEventListener("click", () => {
       alert("Feature yet to be implemented.");
    });
}
