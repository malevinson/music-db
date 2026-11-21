import { toTitleCase, titleCaseString, WORDS_ALWAYS_LOWERCASE } from './helpers';

describe('toTitleCase', () => {
  it('capitalizes the first letter of every word and lowercases the rest', () => {
    expect(toTitleCase('the BEATLES')).toBe('The Beatles');
  });

  it('leaves an empty string alone', () => {
    expect(toTitleCase('')).toBe('');
  });

  it('treats punctuation-joined text as a single word', () => {
    expect(toTitleCase("guns n' roses")).toBe("Guns N' Roses");
    expect(toTitleCase('ac/dc')).toBe('Ac/dc');
  });
});

describe('titleCaseString', () => {
  it('title-cases a simple name', () => {
    expect(titleCaseString('radiohead')).toBe('Radiohead');
    expect(titleCaseString('pink floyd')).toBe('Pink Floyd');
  });

  it('keeps small words lowercase when they are not the first word', () => {
    expect(titleCaseString('belle and sebastian')).toBe('Belle and Sebastian');
    expect(titleCaseString('death cab for cutie')).toBe('Death Cab for Cutie');
    expect(titleCaseString('rage against the machine')).toBe('Rage Against The Machine');
  });

  it('capitalizes a small word when it is the first word', () => {
    expect(titleCaseString('of monsters and men')).toBe('Of Monsters and Men');
  });

  it('keeps a small word exactly as typed (it is not lowercased)', () => {
    // Current behavior: the word is matched case-insensitively but passed through unchanged.
    expect(titleCaseString('simon AND garfunkel')).toBe('Simon AND Garfunkel');
  });

  it('preserves repeated spaces between words', () => {
    expect(titleCaseString('the  national')).toBe('The  National');
  });

  it('returns an empty string for empty input', () => {
    expect(titleCaseString('')).toBe('');
  });
});

describe('WORDS_ALWAYS_LOWERCASE', () => {
  it('contains only lowercase words', () => {
    WORDS_ALWAYS_LOWERCASE.forEach((w) => expect(w).toBe(w.toLowerCase()));
  });
});
