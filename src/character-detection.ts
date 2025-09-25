// Character detection system for Plot Armor
// This module handles character recognition and spoiler detection

export interface Character {
  name: string;
  aliases: string[];
  show: string;
  importance: 'major' | 'minor' | 'recurring';
}

export interface CharacterMatch {
  character: Character;
  matchedText: string;
  confidence: number;
}

export interface SpoilerKeyword {
  keyword: string;
  severity: 'high' | 'medium' | 'low';
  context: string[];
}

// Character database for popular shows
export const CHARACTER_DATABASE: Character[] = [
  // Breaking Bad characters
  { name: 'Walter White', aliases: ['walt', 'heisenberg', 'mr. white'], show: 'breaking bad', importance: 'major' },
  { name: 'Jesse Pinkman', aliases: ['jesse', 'pinkman'], show: 'breaking bad', importance: 'major' },
  { name: 'Skyler White', aliases: ['skyler', 'skyler white'], show: 'breaking bad', importance: 'major' },
  { name: 'Hank Schrader', aliases: ['hank', 'hank schrader', 'asac schrader'], show: 'breaking bad', importance: 'major' },
  { name: 'Marie Schrader', aliases: ['marie', 'marie schrader'], show: 'breaking bad', importance: 'recurring' },
  { name: 'Saul Goodman', aliases: ['saul', 'saul goodman', 'jimmy mcgill'], show: 'breaking bad', importance: 'major' },
  { name: 'Mike Ehrmantraut', aliases: ['mike', 'mike ehrmantraut'], show: 'breaking bad', importance: 'major' },
  { name: 'Gus Fring', aliases: ['gus', 'gus fring', 'gustavo fring'], show: 'breaking bad', importance: 'major' },
  { name: 'Todd Alquist', aliases: ['todd', 'todd alquist'], show: 'breaking bad', importance: 'recurring' },
  { name: 'Lydia Rodarte-Quayle', aliases: ['lydia', 'lydia rodarte-quayle'], show: 'breaking bad', importance: 'recurring' },
  { name: 'Jack Welker', aliases: ['jack', 'jack welker', 'uncle jack'], show: 'breaking bad', importance: 'minor' },
  { name: 'Hector Salamanca', aliases: ['hector', 'hector salamanca', 'tio'], show: 'breaking bad', importance: 'recurring' },
  { name: 'Tuco Salamanca', aliases: ['tuco', 'tuco salamanca'], show: 'breaking bad', importance: 'recurring' },
  { name: 'Krazy-8', aliases: ['krazy-8', 'krazy 8', 'domingo molina'], show: 'breaking bad', importance: 'minor' },
  { name: 'Emilio Koyama', aliases: ['emilio', 'emilio koyama'], show: 'breaking bad', importance: 'minor' },
  { name: 'Combo', aliases: ['combo'], show: 'breaking bad', importance: 'minor' },
  { name: 'Badger', aliases: ['badger', 'brandon mayhew'], show: 'breaking bad', importance: 'minor' },
  { name: 'Skinny Pete', aliases: ['skinny pete', 'pete'], show: 'breaking bad', importance: 'minor' },
  { name: 'Jane Margolis', aliases: ['jane', 'jane margolis'], show: 'breaking bad', importance: 'recurring' },
  { name: 'Andrea Cantillo', aliases: ['andrea', 'andrea cantillo'], show: 'breaking bad', importance: 'recurring' },
  { name: 'Brock Cantillo', aliases: ['brock', 'brock cantillo'], show: 'breaking bad', importance: 'minor' },
  { name: 'Steven Gomez', aliases: ['steve', 'steven gomez', 'gomey'], show: 'breaking bad', importance: 'recurring' },
  { name: 'Donald Margolis', aliases: ['don', 'donald margolis'], show: 'breaking bad', importance: 'minor' },
  { name: 'Ted Beneke', aliases: ['ted', 'ted beneke'], show: 'breaking bad', importance: 'minor' },

  // Game of Thrones characters
  { name: 'Jon Snow', aliases: ['jon', 'jon snow', 'aegon targaryen'], show: 'game of thrones', importance: 'major' },
  { name: 'Daenerys Targaryen', aliases: ['daenerys', 'dany', 'khaleesi', 'mother of dragons'], show: 'game of thrones', importance: 'major' },
  { name: 'Tyrion Lannister', aliases: ['tyrion', 'tyrion lannister', 'imp'], show: 'game of thrones', importance: 'major' },
  { name: 'Arya Stark', aliases: ['arya', 'arya stark'], show: 'game of thrones', importance: 'major' },
  { name: 'Sansa Stark', aliases: ['sansa', 'sansa stark'], show: 'game of thrones', importance: 'major' },
  { name: 'Bran Stark', aliases: ['bran', 'bran stark', 'three-eyed raven'], show: 'game of thrones', importance: 'major' },
  { name: 'Cersei Lannister', aliases: ['cersei', 'cersei lannister'], show: 'game of thrones', importance: 'major' },
  { name: 'Jaime Lannister', aliases: ['jaime', 'jaime lannister', 'kingslayer'], show: 'game of thrones', importance: 'major' },
  { name: 'Ned Stark', aliases: ['ned', 'ned stark', 'eddard stark'], show: 'game of thrones', importance: 'major' },
  { name: 'Robb Stark', aliases: ['robb', 'robb stark', 'young wolf'], show: 'game of thrones', importance: 'major' },
  { name: 'Theon Greyjoy', aliases: ['theon', 'theon greyjoy', 'reek'], show: 'game of thrones', importance: 'recurring' },
  { name: 'Yara Greyjoy', aliases: ['yara', 'yara greyjoy'], show: 'game of thrones', importance: 'recurring' },
  { name: 'Samwell Tarly', aliases: ['sam', 'samwell tarly', 'samwell'], show: 'game of thrones', importance: 'recurring' },
  { name: 'Jorah Mormont', aliases: ['jorah', 'jorah mormont'], show: 'game of thrones', importance: 'recurring' },
  { name: 'Brienne of Tarth', aliases: ['brienne', 'brienne of tarth'], show: 'game of thrones', importance: 'recurring' },

  // The Walking Dead characters
  { name: 'Rick Grimes', aliases: ['rick', 'rick grimes'], show: 'the walking dead', importance: 'major' },
  { name: 'Daryl Dixon', aliases: ['daryl', 'daryl dixon'], show: 'the walking dead', importance: 'major' },
  { name: 'Michonne', aliases: ['michonne'], show: 'the walking dead', importance: 'major' },
  { name: 'Carl Grimes', aliases: ['carl', 'carl grimes'], show: 'the walking dead', importance: 'major' },
  { name: 'Glenn Rhee', aliases: ['glenn', 'glenn rhee'], show: 'the walking dead', importance: 'major' },
  { name: 'Maggie Greene', aliases: ['maggie', 'maggie greene'], show: 'the walking dead', importance: 'major' },
  { name: 'Negan', aliases: ['negan'], show: 'the walking dead', importance: 'major' },
  { name: 'Carol Peletier', aliases: ['carol', 'carol peletier'], show: 'the walking dead', importance: 'major' }
];

// Spoiler keywords with severity levels
export const SPOILER_KEYWORDS: SpoilerKeyword[] = [
  // High severity - major plot points
  { keyword: 'death', severity: 'high', context: ['dies', 'died', 'killed', 'murdered', 'executed', 'assassinated'] },
  { keyword: 'betrayal', severity: 'high', context: ['betrayed', 'traitor', 'double cross', 'backstab'] },
  { keyword: 'reveals', severity: 'high', context: ['revealed', 'discovered', 'found out', 'learned'] },
  { keyword: 'twist', severity: 'high', context: ['plot twist', 'shocking', 'unexpected', 'surprise'] },
  { keyword: 'ending', severity: 'high', context: ['finale', 'season finale', 'series finale', 'conclusion'] },
  
  // Medium severity - significant events
  { keyword: 'pregnancy', severity: 'medium', context: ['pregnant', 'baby', 'child', 'birth'] },
  { keyword: 'marriage', severity: 'medium', context: ['married', 'wedding', 'engaged'] },
  { keyword: 'resurrection', severity: 'medium', context: ['resurrected', 'comes back', 'returns', 'alive'] },
  { keyword: 'transformation', severity: 'medium', context: ['changed', 'becomes', 'turns into'] },
  
  // Low severity - minor spoilers
  { keyword: 'relationship', severity: 'low', context: ['dating', 'together', 'couple'] },
  { keyword: 'job', severity: 'low', context: ['work', 'career', 'profession'] },
  { keyword: 'location', severity: 'low', context: ['moves', 'travels', 'goes to'] }
];

// Find character matches in text
export function findCharacterMatches(text: string): CharacterMatch[] {
  const lowerText = text.toLowerCase();
  const matches: CharacterMatch[] = [];
  
  for (const character of CHARACTER_DATABASE) {
    // Check main name
    if (lowerText.includes(character.name.toLowerCase())) {
      matches.push({
        character,
        matchedText: character.name,
        confidence: 1.0
      });
    }
    
    // Check aliases
    for (const alias of character.aliases) {
      if (lowerText.includes(alias.toLowerCase())) {
        matches.push({
          character,
          matchedText: alias,
          confidence: 0.8 // Slightly lower confidence for aliases
        });
      }
    }
  }
  
  return matches;
}

// Find spoiler keywords in text
export function findSpoilerKeywords(text: string): SpoilerKeyword[] {
  const lowerText = text.toLowerCase();
  const foundKeywords: SpoilerKeyword[] = [];
  
  for (const spoilerKeyword of SPOILER_KEYWORDS) {
    // Check main keyword
    if (lowerText.includes(spoilerKeyword.keyword)) {
      foundKeywords.push(spoilerKeyword);
    }
    
    // Check context words
    for (const contextWord of spoilerKeyword.context) {
      if (lowerText.includes(contextWord)) {
        foundKeywords.push(spoilerKeyword);
        break; // Don't add the same keyword multiple times
      }
    }
  }
  
  return foundKeywords;
}

// Calculate spoiler severity based on character importance and keyword severity
export function calculateSpoilerSeverity(characterMatch: CharacterMatch, spoilerKeyword: SpoilerKeyword): number {
  let severity = 0;
  
  // Character importance weight
  switch (characterMatch.character.importance) {
    case 'major': severity += 0.4; break;
    case 'recurring': severity += 0.3; break;
    case 'minor': severity += 0.2; break;
  }
  
  // Keyword severity weight
  switch (spoilerKeyword.severity) {
    case 'high': severity += 0.4; break;
    case 'medium': severity += 0.3; break;
    case 'low': severity += 0.2; break;
  }
  
  // Character match confidence
  severity += characterMatch.confidence * 0.2;
  
  return Math.min(severity, 1.0);
}

// Main function to detect character-based spoilers
export function detectCharacterSpoiler(text: string, trackedShows: string[]): {
  isSpoiler: boolean;
  confidence: number;
  character?: Character;
  keyword?: SpoilerKeyword;
  show?: string;
  reasoning: string;
} {
  console.log(`Character Detection: Testing "${text}" against shows:`, trackedShows);
  const characterMatches = findCharacterMatches(text);
  const spoilerKeywords = findSpoilerKeywords(text);
  console.log(`Character Detection: Found ${characterMatches.length} character matches:`, characterMatches);
  console.log(`Character Detection: Found ${spoilerKeywords.length} spoiler keywords:`, spoilerKeywords);
  
  // Check if any character matches are from tracked shows
  const relevantCharacters = characterMatches.filter(match => 
    trackedShows.some(show => {
      const showLower = show.toLowerCase();
      const characterShowLower = match.character.show.toLowerCase();
      return showLower === characterShowLower || 
             showLower.includes(characterShowLower) || 
             characterShowLower.includes(showLower);
    })
  );
  
  console.log(`Character Detection: Relevant characters for tracked shows:`, relevantCharacters);
  
  if (relevantCharacters.length === 0 || spoilerKeywords.length === 0) {
    console.log(`Character Detection: No spoiler detected - relevant chars: ${relevantCharacters.length}, keywords: ${spoilerKeywords.length}`);
    return {
      isSpoiler: false,
      confidence: 0,
      reasoning: 'No relevant character-spoiler keyword combination found'
    };
  }
  
  // Find the highest severity combination
  let maxSeverity = 0;
  let bestCharacter: CharacterMatch | undefined;
  let bestKeyword: SpoilerKeyword | undefined;
  
  for (const character of relevantCharacters) {
    for (const keyword of spoilerKeywords) {
      const severity = calculateSpoilerSeverity(character, keyword);
      if (severity > maxSeverity) {
        maxSeverity = severity;
        bestCharacter = character;
        bestKeyword = keyword;
      }
    }
  }
  
  // Threshold for considering it a spoiler
  const spoilerThreshold = 0.6;
  
  return {
    isSpoiler: maxSeverity >= spoilerThreshold,
    confidence: maxSeverity,
    character: bestCharacter?.character,
    keyword: bestKeyword,
    show: bestCharacter?.character.show,
    reasoning: `Character "${bestCharacter?.matchedText}" from "${bestCharacter?.character.show}" with spoiler keyword "${bestKeyword?.keyword}" (severity: ${maxSeverity.toFixed(2)})`
  };
}
