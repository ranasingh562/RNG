const XLSX = require('xlsx');

function lcg(seed) {
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    seed = (a * seed + c) % m;
    return seed / m;
}

function generateRandomNumbers(seed, count, max) {
    const numbers = [];
    for (let i = 0; i < count; i++) {
        const randomValue = lcg(seed);
        numbers.push(Math.floor(randomValue * max));
        seed = (seed + 1) % Math.pow(2, 32);
    }
    return numbers;
}
function chaoticRandom(seed) {
    const noise = Math.sin(seed) * 10000; 
    const randomValue = (Math.random() + noise) % 1;

    return Math.abs(randomValue); 
}

function generateChaoticRandomNumbers(seed, count) {
    const numbers = [];
    for (let i = 0; i < count; i++) {
        const randomValue = chaoticRandom(seed);
        numbers.push(Math.floor(randomValue * 11));
        seed = (seed * Math.random() * Math.sin(Date.now())) | 0; 
    }
    return numbers;
}


function newtonRng(seed, maxIterations = 10) {
    let x = seed;
    const constant = 71; 
    const epsilon = 1e-10;

    for (let i = 0; i < maxIterations; i++) {
        let fx = Math.sin(x * x) - constant; 
        let fpx = 2 * x * Math.cos(x);

        let nextX = x - fx / (fpx + epsilon);
      
        if (Math.abs(nextX - x) < epsilon) {
            break;
        }
        
        x = nextX + Math.random(); 
    }
    
    return Math.abs(x % 1); 
}

function generateBetRng(seed, maxIterations = 20) {
    const randomValue = newtonRng(seed, maxIterations);
    return Math.floor(randomValue * 11);
}

function trng(seed) {
    const currentTime = Date.now(); 
    const noise = Math.sin(seed + currentTime) * 10000; 
    const randomValue = (Math.random() + noise) % 1; 
    return Math.abs(randomValue); 
}

function generateTrngNumbers(seed, count, max) {
    const numbers = [];
    for (let i = 0; i < count; i++) {
        const randomValue = trng(seed);
        numbers.push(Math.floor(randomValue * max));
        seed = (seed + Math.random() * Date.now()) | 0; 
    }
    return numbers;
}

class Player {
    constructor(initialBalance) {
        this.balance = initialBalance;
    }

    updateBalance(amount) {
        this.balance += amount;
    }

    placeBet(betAmount) {
        if (betAmount > this.balance) {
            throw new Error("Insufficient balance to place the bet.");
        }
        this.balance -= betAmount;
    }
}

function createReelStrips(symbols, reelLength = 72) {
    const reelStrips = {};
    for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
        let reelStrip = [];
        for (let symbol of symbols) {
            reelStrip = reelStrip.concat(Array(symbol.reelInstance[reelIndex]).fill(symbol.Id));
        }
        reelStrip = reelStrip.slice(0, reelLength);
        reelStrips[reelIndex] = reelStrip;
    }
    return reelStrips;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function generateResultMatrix(reelStrips, seed) {
    const resultMatrix = [];
    const numRows = 3; 
    const numColumns = 5; 

    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
        const row = [];

        for (let reelIndex of Object.keys(reelStrips)) {
            const reelStrip = [...reelStrips[reelIndex]];
            shuffleArray(reelStrip);

            const randomIndex = Math.floor(generateTrngNumbers(seed, 1, reelStrip.length)[0]);  

            row.push(reelStrip[randomIndex]);
        }

        resultMatrix.push(row);
        seed += 1; 
    }

    return resultMatrix;
}

function evaluateLines(resultMatrix, linesApiData, symbols, betPerLine) {
    let totalPayout = 0;
    const winningPaylines = [];

    linesApiData.forEach(line => {
        const matchedSymbols = line.map((index, i) => {
            if (index >= 0 && index < resultMatrix.length) {
                return resultMatrix[index][i];
            } else {
                console.warn(`Invalid index in resultMatrix: ${index} at line position ${i}.`);
                return null;
            }
        }).filter(symbol => symbol !== null);

        let firstSymbol = null;
        let count = 0;

        for (let symbol of matchedSymbols) {
            if (symbol === undefined || symbol === null) {
                console.warn("Encountered an undefined or null symbol. Skipping.");
                continue;
            }

            if (symbol < 0 || symbol >= symbols.length) {
                console.warn(`Invalid symbol index: ${symbol}. Skipping.`);
                break;
            }

            const symbolName = symbols[symbol].Name;
            if (['Scatter', 'Bonus', 'Jackpot', 'FreeSpin'].includes(symbolName)) break;

            if (symbolName === 'Wild') {
                count++;
            } else if (!firstSymbol) {
                firstSymbol = symbol;
                count++;
            } else if (symbol === firstSymbol) {
                count++;
            } else {
                break;
            }
        }

        if (count >= 3 && firstSymbol !== null) {
            const multiplierIndex = 5 - count;
            if (symbols[firstSymbol].multiplier && symbols[firstSymbol].multiplier[multiplierIndex]) {
                totalPayout += symbols[firstSymbol].multiplier[multiplierIndex][0] * betPerLine;
            }
            winningPaylines.push(line);
        }
    });

    return totalPayout;
}

function main(parsheet, betPerLine, player, nSpins) {
    const { Symbols, linesApiData } = parsheet;
    const numberOfLines = linesApiData.length;
    const totalBet = betPerLine * numberOfLines;
    const reelStrips = createReelStrips(Symbols);

    let seed = Date.now();
    const rngWins = [];
   
    for (let spin = 0; spin < nSpins; spin++) {
        const resultMatrix = generateResultMatrix(reelStrips, seed);
        console.log(resultMatrix, "result matrix");

        const linePayout = evaluateLines(resultMatrix, linesApiData, Symbols, betPerLine);
        rngWins.push(linePayout);
        seed += 1;
    }

    return rngWins;
}

const parsheet = {
    "id": "SL-AQUA",
    "matrix": {
        "x": 5,
        "y": 3
    },
    "linesApiData": [
        [
            1,
            1,
            1,
            1,
            1
        ],
        [
            0,
            0,
            0,
            0,
            0
        ],
        [
            2,
            2,
            2,
            2,
            2
        ],
        [
            0,
            1,
            2,
            1,
            0
        ],
        [
            2,
            1,
            0,
            1,
            2
        ],
        [
            1,
            0,
            1,
            0,
            1
        ],
        [
            1,
            2,
            1,
            2,
            1
        ],
        [
            0,
            0,
            1,
            2,
            2
        ],
        [
            2,
            2,
            1,
            0,
            0
        ],
        [
            1,
            2,
            1,
            0,
            1
        ],
        [
            1,
            0,
            1,
            2,
            1
        ],
        [
            0,
            1,
            1,
            1,
            0
        ],
        [
            2,
            1,
            1,
            1,
            2
        ],
        [
            0,
            1,
            0,
            1,
            0
        ],
        [
            2,
            1,
            2,
            1,
            2
        ],
        [
            1,
            1,
            0,
            1,
            1
        ],
        [
            1,
            1,
            2,
            1,
            1
        ],
        [
            0,
            0,
            2,
            0,
            0
        ],
        [
            2,
            2,
            0,
            2,
            2
        ],
        [
            0,
            2,
            2,
            2,
            0
        ]
    ],
    "linesCount": [
        1,
        5,
        15,
        20
    ],
    "bets": [
        0.1,
        0.25,
        0.5,
        0.75,
        1
    ],
    "bonus": {
        "type": "tap",
        "isEnabled": true,
        "noOfItem": 5,
        "payOut": [
            50,
            40,
            30,
            20,
            0
        ],
        "payOutProb": [

        ]
    },
    "gamble": {
        "type": "card",
        "isEnabled": false
    },
    "Symbols": [
        {
            "Name": "0",
            "Id": 0,
            "reelInstance": {
                "0": 7,
                "1": 7,
                "2": 7,
                "3": 7,
                "4": 7
            },
            "useWildSub": true,
            "multiplier": [
                [
                    150,
                    0
                ],
                [
                    70,
                    0
                ],
                [
                    30,
                    0
                ]
            ]
        },
        {
            "Name": "1",
            "Id": 1,
            "reelInstance": {
                "0": 7,
                "1": 7,
                "2": 7,
                "3": 7,
                "4": 7
            },
            "useWildSub": true,
            "multiplier": [
                [
                    150,
                    0
                ],
                [
                    70,
                    0
                ],
                [
                    30,
                    0
                ]
            ]
        },
        {
            "Name": "2",
            "Id": 2,
            "reelInstance": {
                "0": 7,
                "1": 7,
                "2": 7,
                "3": 7,
                "4": 7
            },
            "useWildSub": true,
            "multiplier": [
                [
                    150,
                    0
                ],
                [
                    70,
                    0
                ],
                [
                    30,
                    0
                ]
            ]
        },
        {
            "Name": "3",
            "Id": 3,
            "reelInstance": {
                "0": 7,
                "1": 7,
                "2": 7,
                "3": 7,
                "4": 7
            },
            "useWildSub": true,
            "multiplier": [
                [
                    150,
                    0
                ],
                [
                    70,
                    0
                ],
                [
                    30,
                    0
                ]
            ]
        },
        {
            "Name": "4",
            "Id": 4,
            "reelInstance": {
                "0": 7,
                "1": 7,
                "2": 7,
                "3": 7,
                "4": 7
            },
            "useWildSub": true,
            "multiplier": [
                [
                    150,
                    0
                ],
                [
                    70,
                    0
                ],
                [
                    30,
                    0
                ]
            ]
        },
        {
            "Name": "5",
            "Id": 5,
            "reelInstance": {
                "0": 7,
                "1": 7,
                "2": 7,
                "3": 7,
                "4": 7
            },
            "useWildSub": true,
            "multiplier": [
                [
                    150,
                    0
                ],
                [
                    70,
                    0
                ],
                [
                    30,
                    0
                ]
            ]
        },
        {
            "Name": "6",
            "Id": 6,
            "reelInstance": {
                "0": 3,
                "1": 3,
                "2": 3,
                "3": 3,
                "4": 3
            },
            "useWildSub": true,
            "multiplier": [
                [
                    250,
                    0
                ],
                [
                    125,
                    0
                ],
                [
                    60,
                    0
                ]
            ]
        },
        {
            "Name": "7",
            "Id": 7,
            "reelInstance": {
                "0": 3,
                "1": 3,
                "2": 3,
                "3": 3,
                "4": 3
            },
            "useWildSub": true,
            "multiplier": [
                [
                    250,
                    0
                ],
                [
                    125,
                    0
                ],
                [
                    60,
                    0
                ]
            ]
        },
        {
            "Name": "8",
            "Id": 8,
            "reelInstance": {
                "0": 3,
                "1": 3,
                "2": 3,
                "3": 3,
                "4": 3
            },
            "useWildSub": true,
            "multiplier": [
                [
                    250,
                    0
                ],
                [
                    125,
                    0
                ],
                [
                    60,
                    0
                ]
            ]
        },
        {
            "Name": "9",
            "Id": 9,
            "reelInstance": {
                "0": 3,
                "1": 3,
                "2": 3,
                "3": 3,
                "4": 3
            },
            "useWildSub": false,
            "multiplier": [
                [
                    250,
                    0
                ],
                [
                    125,
                    0
                ],
                [
                    60,
                    0
                ]
            ]
        },
        {
            "Name": "10",
            "Id": 10,
            "reelInstance": {
                "0": 3,
                "1": 3,
                "2": 3,
                "3": 3,
                "4": 3
            },
            "useWildSub": false,
            "multiplier": [
                [
                    250,
                    0
                ],
                [
                    125,
                    0
                ],
                [
                    60,
                    0
                ]
            ]
        },
        {
            "Name": "11",
            "Id": 11,
            "reelInstance": {
                "0": 3,
                "1": 3,
                "2": 3,
                "3": 3,
                "4": 3
            },
            "useWildSub": false,
            "multiplier": [
                [
                    250,
                    0
                ],
                [
                    125,
                    0
                ],
                [
                    60,
                    0
                ]
            ]
        },
        {
            "Name": "Bonus",
            "Id": 12,
            "reelInstance": {
                "0": 3,
                "1": 3,
                "2": 3,
                "3": 3,
                "4": 3
            },
            "description": "Starts a Bonus game for a pay out when <color=#000000>3</color> or more symbols appear anywhere on the result matrix.",
            "useWildSub": false,
            "symbolCount": 3
        },
        {
            "Name": "Wild",
            "Id": 13,
            "reelInstance": {
                "0": 5,
                "1": 5,
                "2": 5,
                "3": 5,
                "4": 5
            },
            "description": "Substitutes for all symbols except<color=#000000> Jackpot, Free Spin, Bonus, and Scatter.",
            "useWildSub": false
        },
        {
            "Name": "Scatter",
            "Id": 14,
            "reelInstance": {
                "0": 3,
                "1": 3,
                "2": 3,
                "3": 3,
                "4": 3
            },
            "description": "Scatter: Offers higher pay outs when <color=#000000>3</color> or more symbols appear anywhere on the result matrix. Payout: 5x - 800, 4x - 400, 3x- 200",
            "useWildSub": false,
            "multiplier": [
                [
                    800,
                    0
                ],
                [
                    400,
                    0
                ],
                [
                    200,
                    0
                ]
            ]
        },
        {
            "Name": "FreeSpin",
            "Id": 15,
            "reelInstance": {
                "0": 3,
                "1": 3,
                "2": 3,
                "3": 3,
                "4": 3
            },
            "description": "Activates <color=#000000>3</color>, <color=#000000>5</color>, or <color=#000000>10</color> free spins when <color=#000000>3</color>, <color=#000000>4</color>, or <color=#000000>5</color> symbols appear anywhere on the result matrix.",
            "useWildSub": false,
            "multiplier": [
                [
                    0,
                    10
                ],
                [
                    0,
                    5
                ],
                [
                    0,
                    3
                ]
            ]
        },
        {
            "Name": "Jackpot",
            "Id": 16,
            "reelInstance": {
                "0": 1,
                "1": 1,
                "2": 1,
                "3": 1,
                "4": 1
            },
            "description": "Jackpot triggered by <color=#000000> 5 </color> Jackpot symbols anywhere on the result matrix. payout: <color=#000000> 5000x</color>",
            "useWildSub": false,
            "defaultAmount": 5000,
            "symbolsCount": 5,
            "increaseValue": 5
        }
    ]
}

const player = new Player(100);

const allResults = [];

for (let i = 0; i < 100; i++) {
    const nSpins =50;
    const betPerLine = 1;

    const results = main(parsheet, betPerLine, player, nSpins);
    console.log("Results of Spins:", results);

    allResults.push({
        iteration: i + 1,
        results: results
    });
}

const excelData = allResults.flatMap(({ iteration, results }) =>
    results.map((result, index) => ({
        Iteration: iteration,
        Spin: index + 1,
        Payout: result.toFixed(2)
    }))
);

// exportToExcel(excelData, "SpinResults.xlsx");

function exportToExcel(data, filename) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Spin Results");

    const headerRow = worksheet['!ref'];
    const headerCellRange = XLSX.utils.decode_range(headerRow);

    for (let C = headerCellRange.s.c; C <= headerCellRange.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ c: C, r: 0 });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = {
            fill: { fgColor: { rgb: "FFFF00" } },
            font: { bold: true }
        };
    }

    const colWidths = [
        { wch: 10 },
        { wch: 5 },
        { wch: 10 }
    ];

    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, filename);
}
