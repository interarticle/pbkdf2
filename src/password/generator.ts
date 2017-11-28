import * as Complexity from './complexity';

function selectChar(charSet: string[], randomByte: number) {
  return charSet[randomByte % charSet.length];
}

function makeStringCharSet(s: string): string[] {
  return s.split('');
}

export const charSets = {
  lowerAlpha: makeStringCharSet('abcdefghijklmnopqrstuvwxyz'),
  upperAlpha: makeStringCharSet('ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
  numbers: makeStringCharSet('0123456789'),
};

export interface PasswordGenerator {
  generate(key: CryptoKey): Promise<string>;
}

export abstract class AbstractPasswordGenerator implements PasswordGenerator {

  async generate(key: CryptoKey): Promise<string> {
    const numChars = this.numChars;
    const randomBytes = new Uint8Array(
        await crypto.subtle.deriveBits(
            {name: 'PBKDF2', salt: new Uint8Array(0), iterations: 1, hash: 'SHA-512'},
            key, 8 * numChars));
    const generatedChars: string[] = [];
    for (let i = 0; i < numChars; i++) {
      let charSet = this.getCharSet(i);
      for (const rule of this.complexityRules) {
        charSet = rule.computeAllowedChars(charSet, generatedChars);
      }

      generatedChars.push(selectChar(charSet, randomBytes[i]));
    }
    return generatedChars.join('');
  }

  protected complexityRules: Complexity.ComplexityRule[] = [];

  protected abstract numChars: number;

  protected abstract getCharSet(index: number): string[];
}

export const generators: { [name: string]: (new () => PasswordGenerator) | undefined } = {
  CapitalNormalNum10: class extends AbstractPasswordGenerator {
    readonly complexityRules = [
      new Complexity.RuleNoSequentialCI(3),
      new Complexity.RuleNoRepeatingCI(3),
    ];
    readonly numChars = 10;
    getCharSet(index: number) {
      if (index == 0) {
        return charSets.upperAlpha;
      } else if (index < 9) {
        return charSets.lowerAlpha;
      } else {
        return charSets.numbers;
      }
    }
  },
  Num4: class extends AbstractPasswordGenerator {
    readonly complexityRules = [
      new Complexity.RuleNoRepeatingCI(2),
      new Complexity.RuleNoSequentialCI(3),
    ];
    readonly numChars = 4;
    getCharSet(index: number) {
      return charSets.numbers;
    }
  },
  Num6: class extends AbstractPasswordGenerator {
    readonly complexityRules = [
      new Complexity.RuleNoRepeatingCI(3),
      new Complexity.RuleNoSequentialCI(3),
    ];
    readonly numChars = 6;
    getCharSet(index: number) {
      return charSets.numbers;
    }
  },
};
