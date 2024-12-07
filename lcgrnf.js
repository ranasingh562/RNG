    const XLSX = require('xlsx');

    function lcg(seed) {
    const a = 1664525; 
    const c = 1013904223;
    const m = Math.pow(2, 32); 

    seed = (a * seed + c) % m;

    return seed / m;
    }

    function generateRandomNumbers(seed, count) {
    const numbers = [];
    for (let i = 0; i < count; i++) {
        const randomValue = lcg(seed);
        numbers.push(Math.floor(randomValue * 11));
        seed = (seed + Math.random() * 1000) | 0; 
    }
    return numbers;
    }

    function exportToExcel(data, filename) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Random Numbers");
    
    XLSX.writeFile(workbook, filename);
    }

  


    
// Generate five instances of random numbers
for (let i = 1; i <= 5; i++) {
    let seed = Date.now();  
    const count = 100;   
    const randomNumbers = generateRandomNumbers(seed, count);

    const dataForExcel = randomNumbers.map((num, index) => ({
    "Random Numbers": num
    }));

    exportToExcel(dataForExcel, `RandomNumbers${i}.xlsx`);
    console.log("Random numbers exported to RandomNumbers.xlsx");
}