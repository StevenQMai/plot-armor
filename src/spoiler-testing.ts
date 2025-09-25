// Testing framework for Plot Armor spoiler detection
// This module helps test and debug spoiler detection functionality

import { detectCharacterSpoiler, findCharacterMatches, findSpoilerKeywords } from './character-detection';

export interface TestCase {
  text: string;
  expectedResult: boolean;
  description: string;
  show: string;
}

export interface TestResult {
  testCase: TestCase;
  actualResult: boolean;
  passed: boolean;
  confidence: number;
  reasoning: string;
  method: string;
}

// Test cases for Breaking Bad spoiler detection
export const BREAKING_BAD_TEST_CASES: TestCase[] = [
  // Should be detected as spoilers
  {
    text: "Todd's death was shocking",
    expectedResult: true,
    description: "Character death without show title",
    show: "Breaking Bad"
  },
  {
    text: "Jesse escapes from the compound",
    expectedResult: true,
    description: "Character action without show title",
    show: "Breaking Bad"
  },
  {
    text: "Walter becomes Heisenberg in season 1",
    expectedResult: true,
    description: "Character transformation with season",
    show: "Breaking Bad"
  },
  {
    text: "Hank dies in the final season",
    expectedResult: true,
    description: "Character death with season reference",
    show: "Breaking Bad"
  },
  {
    text: "Breaking Bad spoiler: Todd's fate",
    expectedResult: true,
    description: "Explicit spoiler with character",
    show: "Breaking Bad"
  },
  {
    text: "Gus Fring's death was unexpected",
    expectedResult: true,
    description: "Character death with full name",
    show: "Breaking Bad"
  },
  {
    text: "Saul Goodman's real name is Jimmy McGill",
    expectedResult: true,
    description: "Character revelation",
    show: "Breaking Bad"
  },
  {
    text: "Mike Ehrmantraut gets killed by Walter",
    expectedResult: true,
    description: "Character death with perpetrator",
    show: "Breaking Bad"
  },

  // Should NOT be detected as spoilers
  {
    text: "Todd is a common name",
    expectedResult: false,
    description: "Character name without spoiler context",
    show: "Breaking Bad"
  },
  {
    text: "Breaking Bad is a great show",
    expectedResult: false,
    description: "General show opinion",
    show: "Breaking Bad"
  },
  {
    text: "Jesse Pinkman is played by Aaron Paul",
    expectedResult: false,
    description: "Actor information",
    show: "Breaking Bad"
  },
  {
    text: "Walter White is the main character",
    expectedResult: false,
    description: "Character identification",
    show: "Breaking Bad"
  },
  {
    text: "The show has 5 seasons",
    expectedResult: false,
    description: "General show information",
    show: "Breaking Bad"
  },
  {
    text: "Todd appears in season 5",
    expectedResult: false,
    description: "Character appearance without spoiler",
    show: "Breaking Bad"
  }
];

// Test cases for Game of Thrones
export const GAME_OF_THRONES_TEST_CASES: TestCase[] = [
  // Should be detected as spoilers
  {
    text: "Jon Snow dies in season 5",
    expectedResult: true,
    description: "Character death with season",
    show: "Game of Thrones"
  },
  {
    text: "Daenerys burns King's Landing",
    expectedResult: true,
    description: "Character action with location",
    show: "Game of Thrones"
  },
  {
    text: "Ned Stark's death was shocking",
    expectedResult: true,
    description: "Character death",
    show: "Game of Thrones"
  },
  {
    text: "The Red Wedding kills Robb Stark",
    expectedResult: true,
    description: "Event with character death",
    show: "Game of Thrones"
  },

  // Should NOT be detected as spoilers
  {
    text: "Jon Snow is a character in Game of Thrones",
    expectedResult: false,
    description: "Character identification",
    show: "Game of Thrones"
  },
  {
    text: "The show has dragons",
    expectedResult: false,
    description: "General show element",
    show: "Game of Thrones"
  }
];

// Run a single test case
export function runTestCase(testCase: TestCase): TestResult {
  const result = detectCharacterSpoiler(testCase.text, [testCase.show]);
  
  return {
    testCase,
    actualResult: result.isSpoiler,
    passed: result.isSpoiler === testCase.expectedResult,
    confidence: result.confidence,
    reasoning: result.reasoning,
    method: 'character-detection'
  };
}

// Run all test cases for a show
export function runTestSuite(testCases: TestCase[]): TestResult[] {
  return testCases.map(runTestCase);
}

// Generate a test report
export function generateTestReport(testResults: TestResult[]): string {
  const totalTests = testResults.length;
  const passedTests = testResults.filter(result => result.passed).length;
  const failedTests = totalTests - passedTests;
  const passRate = (passedTests / totalTests * 100).toFixed(1);

  let report = `\n🧪 PLOT ARMOR SPOILER DETECTION TEST REPORT\n`;
  report += `==========================================\n`;
  report += `Total Tests: ${totalTests}\n`;
  report += `Passed: ${passedTests}\n`;
  report += `Failed: ${failedTests}\n`;
  report += `Pass Rate: ${passRate}%\n\n`;

  if (failedTests > 0) {
    report += `❌ FAILED TESTS:\n`;
    report += `================\n`;
    testResults
      .filter(result => !result.passed)
      .forEach(result => {
        report += `\nTest: "${result.testCase.text}"\n`;
        report += `Expected: ${result.testCase.expectedResult ? 'SPOILER' : 'NOT SPOILER'}\n`;
        report += `Actual: ${result.actualResult ? 'SPOILER' : 'NOT SPOILER'}\n`;
        report += `Confidence: ${(result.confidence * 100).toFixed(1)}%\n`;
        report += `Reasoning: ${result.reasoning}\n`;
        report += `Description: ${result.testCase.description}\n`;
      });
  }

  report += `\n✅ PASSED TESTS:\n`;
  report += `================\n`;
  testResults
    .filter(result => result.passed)
    .forEach(result => {
      report += `✓ "${result.testCase.text}" (${(result.confidence * 100).toFixed(1)}% confidence)\n`;
    });

  return report;
}

// Debug function to analyze text step by step
export function debugSpoilerDetection(text: string, show: string): string {
  const characterMatches = findCharacterMatches(text);
  const spoilerKeywords = findSpoilerKeywords(text);
  const result = detectCharacterSpoiler(text, [show]);

  let debug = `\n🔍 SPOILER DETECTION DEBUG\n`;
  debug += `========================\n`;
  debug += `Text: "${text}"\n`;
  debug += `Show: "${show}"\n\n`;

  debug += `CHARACTER MATCHES:\n`;
  if (characterMatches.length === 0) {
    debug += `- No character matches found\n`;
  } else {
    characterMatches.forEach(match => {
      debug += `- ${match.character.name} (${match.character.show}) - "${match.matchedText}" (${(match.confidence * 100).toFixed(1)}% confidence)\n`;
    });
  }

  debug += `\nSPOILER KEYWORDS:\n`;
  if (spoilerKeywords.length === 0) {
    debug += `- No spoiler keywords found\n`;
  } else {
    spoilerKeywords.forEach(keyword => {
      debug += `- "${keyword.keyword}" (${keyword.severity} severity)\n`;
    });
  }

  debug += `\nFINAL RESULT:\n`;
  debug += `- Is Spoiler: ${result.isSpoiler ? 'YES' : 'NO'}\n`;
  debug += `- Confidence: ${(result.confidence * 100).toFixed(1)}%\n`;
  debug += `- Reasoning: ${result.reasoning}\n`;

  return debug;
}

// Quick test function for browser console
export function quickTest(text: string, show: string = "Breaking Bad"): void {
  console.log(debugSpoilerDetection(text, show));
}

// Run comprehensive test suite
export function runComprehensiveTests(): void {
  console.log("🧪 Running Breaking Bad test suite...");
  const bbResults = runTestSuite(BREAKING_BAD_TEST_CASES);
  console.log(generateTestReport(bbResults));

  console.log("\n🧪 Running Game of Thrones test suite...");
  const gotResults = runTestSuite(GAME_OF_THRONES_TEST_CASES);
  console.log(generateTestReport(gotResults));
}

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as any).plotArmorTest = {
    quickTest,
    runComprehensiveTests,
    debugSpoilerDetection,
    runTestCase,
    BREAKING_BAD_TEST_CASES,
    GAME_OF_THRONES_TEST_CASES
  };
}
