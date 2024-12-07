const XLSX = require('xlsx');

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

function generateRandomNumberSheet(seed, fileName) {
    let randomNumbers = [];
    
    for (let i = 0; i < 15; i++) {
        let randomNum = generateBetRng(seed);
        randomNumbers.push({ Number: randomNum });
        
        seed = (seed * Math.random() * Math.sin(seed) + Date.now()) % (1e10 * Math.random()) + Math.random();
    }

    const worksheet = XLSX.utils.json_to_sheet(randomNumbers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Random Numbers");
    XLSX.writeFile(workbook, fileName);

    console.log(`Random numbers exported to ${fileName}`);
}

// Generate five instances of random numbers
for (let i = 1; i <= 5; i++) {
    let seed = Date.now() + Math.random() * 1000 * i; 
    generateRandomNumberSheet(seed, `random_numbers_instance_${i}.xlsx`);
}
