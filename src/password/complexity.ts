/**
 * Multi-character password complexity rules validator.
 *
 * While these classes can be used to implement chararcter presence complexity rules, the fact that
 * the rules are applied one character at a time may cause the resulting passwords to be biased.
 *
 * These rules are used to ensure that passwords generated conform to stupid complexity rules
 * enforced by stupid websites. While I do not personally agree with these rules, they're
 * unfortunately an unavoidable part of life.
 */

export interface ComplexityRule {
  computeAllowedChars(charSet: string[], previousChars: string[]): string[];
}

export abstract class AbstractComplexityRule<T> implements ComplexityRule {
  computeAllowedChars(charSet: string[], previousChars: string[]): string[] {
    const allowedChars: string[] = [];
    const processedPreviousChars = this.processPreviousChars(previousChars);
    for (const c of charSet) {
      if (!this.isCharBlacklisted(c, processedPreviousChars)) {
        allowedChars.push(c);
      } else {
        console.log('Excluding char', c, 'in partial password sequence', previousChars);
      }
    }
    return allowedChars;
  }

  protected abstract processPreviousChars(previousChars: string[]): T;

  protected abstract isCharBlacklisted(testChar: string, processedPreviousChars: T): boolean;
}

export class RuleNoRepeatingCI extends AbstractComplexityRule<string | null> {
  constructor(private readonly numRepeating: number) {
    super();
  }
  processPreviousChars(previousChars: string[]): string | null {
    const candidateSet = previousChars.slice(-(this.numRepeating - 1)).map(c => c.toLowerCase());
    if (candidateSet.length < this.numRepeating - 1) {
      return null;
    }
    if (new Set(candidateSet).size != 1) {
      return null;
    }
    return candidateSet[0];
  }
  isCharBlacklisted(c: string, processedPreviousChars: string) {
    return processedPreviousChars != null && c.toLowerCase() === processedPreviousChars;
  }
}

// Sequential as defined by ASCII-numerical value sequence. This works in sets of a-z, A-Z, 0-9, but
// not across.
export class RuleNoSequentialCI extends AbstractComplexityRule<Set<number> | null> {
  constructor(private readonly numSequential: number) {
    super();
  }
  processPreviousChars(previousChars: string[]): Set<number> | null {
    const candidateCodes = previousChars
      .slice(-(this.numSequential - 1))
      .map(c => {
        if (c.length > 1) throw new Error(`multi-char sequence ${c} not supported`);
        const codePoint = c.toLowerCase().codePointAt(0);
        if (codePoint === undefined) throw new Error('empty char sequence not supported');
        return codePoint;
      });
    if (candidateCodes.length < this.numSequential - 1) {
      return null;
    }
    const codeDifferences = [];
    for (let i = 1; i < candidateCodes.length; i++) {
      codeDifferences.push(candidateCodes[i] - candidateCodes[i - 1]);
    }
    if (codeDifferences.length === 0) {
      return new Set([candidateCodes[0] + 1, candidateCodes[0] - 1]);
    } else if (codeDifferences.every(n => n === 1)) {
      return new Set([candidateCodes[candidateCodes.length - 1] + 1]);
    } else if (codeDifferences.every(n => n === -1)) {
      return new Set([candidateCodes[candidateCodes.length - 1] - 1]);
    } else {
      return null;
    }
  }
  isCharBlacklisted(c: string, processedPreviousChars: Set<number> | null) {
    return (
      processedPreviousChars != null
      && processedPreviousChars.has(c.toLowerCase().codePointAt(0)!));
  }
}
