const crypto = require('crypto');

class RandomGenerator {
  constructor(seed) {
    this.seed = seed;
  }

  // Linear Congruential Generator (PRNG)
  linearCongruential(min, max) {
    const m = 2 ** 31 - 1;
    const a = 48271;
    const c = 0;
    this.seed = (a * this.seed + c) % m;
    return min + (this.seed % (max - min));
  }

  // Chaotic PRNG
  chaoticPRNG(min, max) {
    this.seed = Math.sin(this.seed) * 10000;
    return min + (this.seed - Math.floor(this.seed)) * (max - min);
  }

  // Newton-based PRNG
  newtonPRNG(min, max) {
    const iterations = 10;
    let x = this.seed / 1000;
    for (let i = 0; i < iterations; i++) {
      x = x - (x ** 3 - this.seed) / (3 * x ** 2);
    }
    this.seed = x * 10000;
    return min + (x % (max - min));
  }

  // True Random Number Generator (TRNG) using crypto.randomBytes
  trueRandom(min, max) {
    const randomBytes = crypto.randomBytes(4); 
    const randomValue = randomBytes.readUInt32BE(0); 
    return min + (randomValue % (max - min));
  }

  // General function to call any of the methods
  getRandomNumber(type, min, max) {
    switch (type) {
      case 'linear':
        return this.linearCongruential(min, max);
      case 'chaotic':
        return this.chaoticPRNG(min, max);
      case 'newton':
        return this.newtonPRNG(min, max);
      case 'trueRandom':
        return this.trueRandom(min, max);
      default:
        throw new Error('Unknown random generator type');
    }
  }
}

// Example usage
const randomGenerator = new RandomGenerator(12345);

console.log('Linear Congruential PRNG:', randomGenerator.getRandomNumber('linear', 1, 100));
console.log('Chaotic PRNG:', randomGenerator.getRandomNumber('chaotic', 1, 100));
console.log('Newton-based PRNG:', randomGenerator.getRandomNumber('newton', 1, 100));
console.log('True Random (TRNG):', randomGenerator.getRandomNumber('trueRandom', 1, 100));
