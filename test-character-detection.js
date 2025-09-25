// Quick test of character detection
import { detectCharacterSpoiler } from './dist/character-detection.js';

console.log('Testing character detection...');

// Test 1: Todd's death
const test1 = detectCharacterSpoiler("Todd's death was shocking", ["breaking bad"]);
console.log('Test 1 - Todd\'s death:', test1);

// Test 2: Breaking Bad spoiler
const test2 = detectCharacterSpoiler("Breaking Bad spoiler: Walter becomes Heisenberg", ["breaking bad"]);
console.log('Test 2 - Breaking Bad spoiler:', test2);

// Test 3: Non-spoiler
const test3 = detectCharacterSpoiler("Todd is a common name", ["breaking bad"]);
console.log('Test 3 - Non-spoiler:', test3);