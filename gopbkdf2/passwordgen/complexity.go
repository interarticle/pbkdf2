package passwordgen

import (
	"unicode"
)

var (
	lowerCase = []rune("abcdefghijklmnopqrstuvwxyz")
	upperCase = []rune("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
	numbers   = []rune("0123456789")
)

type ruleFunction func(chars []rune, previous []rune) []rune

func charsEqual(c1, c2 rune) bool {
	return unicode.ToLower(c1) == unicode.ToLower(c2)
}

func excludeRepeats(maxRepeats int) ruleFunction {
	prevRepeats := maxRepeats - 1
	return func(chars []rune, previous []rune) []rune {
		if len(previous) < prevRepeats {
			return chars
		}
		checkChar := previous[len(previous)-1]
		for _, c := range previous[len(previous)-prevRepeats : len(previous)-1] {
			if !charsEqual(c, checkChar) {
				return chars
			}
		}
		allowedChars := make([]rune, 0, len(chars)-1)
		for _, c := range chars {
			if charsEqual(c, checkChar) {
				continue
			}
			allowedChars = append(allowedChars, c)
		}
		return allowedChars
	}
}

func excludeSequential(maxSequential int) ruleFunction {
	prevSeq := maxSequential - 1
	return func(chars []rune, previous []rune) []rune {
		if len(previous) < prevSeq {
			return chars
		}
		if prevSeq <= 1 {
			checkChar := unicode.ToLower(previous[len(previous)-1])
			allowedChars := make([]rune, 0, len(chars))
			for _, c := range chars {
				if unicode.ToLower(c) == checkChar-1 || unicode.ToLower(c) == checkChar+1 {
					continue
				}
				allowedChars = append(allowedChars, c)
			}
			return allowedChars
		}
		lastPrev := previous[len(previous)-prevSeq:]
		var deltas []rune
		for i := 1; i < len(lastPrev); i++ {
			deltas = append(deltas, unicode.ToLower(lastPrev[i])-unicode.ToLower(lastPrev[i-1]))
		}

		delta := deltas[0]
		if delta != 1 && delta != -1 {
			return chars
		}
		for _, d := range deltas[1:] {
			if d != delta {
				return chars
			}
		}

		blacklistedRune := unicode.ToLower(lastPrev[len(lastPrev)-1]) + delta
		allowedChars := make([]rune, 0, len(chars))
		for _, c := range chars {
			if unicode.ToLower(c) == blacklistedRune {
				continue
			}
			allowedChars = append(allowedChars, c)
		}
		return allowedChars
	}
}
