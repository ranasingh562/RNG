const XLSX = require('xlsx');

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

function exportToExcel(dataForExcel, fileName) {
    const worksheet = XLSX.utils.aoa_to_sheet(dataForExcel); // Create sheet from array of arrays
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Random Numbers");
    XLSX.writeFile(workbook, fileName);
}

let allRandomNumbers = [];

const count = 100; 
const columns = 5; 

for (let i = 0; i < count; i++) {
    allRandomNumbers[i] = [];
}

for (let col = 0; col < columns; col++) {
    let seed = Date.now();
    const randomNumbers = generateChaoticRandomNumbers(seed, count);

    for (let row = 0; row < count; row++) {
        allRandomNumbers[row][col] = randomNumbers[row];
    }
}

exportToExcel(allRandomNumbers, 'RandomNumbers_Columns3.xlsx');
console.log("Random numbers exported to RandomNumbers_Columns.xlsx");