package passwordgen

import (
	"crypto/sha512"

	"github.com/interarticle/pbkdf2/gopbkdf2/crypto"
)

func pickChar(charSet []rune, randomByte byte) rune {
	return charSet[int(randomByte)%len(charSet)]
}

func generatePassword(charSets [][]rune, rules []ruleFunction, derivedBytes []byte) string {
	derivePRF := crypto.NewCachedHMAC(sha512.New, derivedBytes)
	genBytes := crypto.PBKDF2DeriveBytes(derivePRF, nil, 1, len(charSets))
	genChars := make([]rune, 0, len(charSets))
	for i, charSet := range charSets {
		for _, rule := range rules {
			charSet = rule(charSet, genChars)
		}
		genChars = append(genChars, pickChar(charSet, genBytes[i]))
	}
	return string(genChars)
}

func GenAlpha2NumDot11(derivedBytes []byte) string {
	return generatePassword([][]rune{
		upperCase, lowerCase, lowerCase, lowerCase, lowerCase, lowerCase,
		lowerCase, lowerCase, numbers, numbers, []rune{'.'},
	}, []ruleFunction{
		excludeRepeats(3), excludeSequential(3),
	}, derivedBytes)
}

func GenAlphaNum10(derivedBytes []byte) string {
	return generatePassword([][]rune{
		upperCase, lowerCase, lowerCase, lowerCase, lowerCase, lowerCase,
		lowerCase, lowerCase, lowerCase, numbers,
	}, []ruleFunction{
		excludeRepeats(3), excludeSequential(3),
	}, derivedBytes)
}

func GenAlpha2Num10(derivedBytes []byte) string {
	return generatePassword([][]rune{
		upperCase, lowerCase, lowerCase, lowerCase, lowerCase, lowerCase,
		lowerCase, lowerCase, numbers, numbers,
	}, []ruleFunction{
		excludeRepeats(3), excludeSequential(3),
	}, derivedBytes)
}

func GenNum4(derivedBytes []byte) string {
	return generatePassword([][]rune{
		numbers, numbers, numbers, numbers,
	}, []ruleFunction{
		excludeRepeats(2), excludeSequential(3),
	}, derivedBytes)
}

func GenNum6(derivedBytes []byte) string {
	return generatePassword([][]rune{
		numbers, numbers, numbers, numbers, numbers, numbers,
	}, []ruleFunction{
		excludeRepeats(3), excludeSequential(3),
	}, derivedBytes)
}
