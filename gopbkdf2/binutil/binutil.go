package binutil

import (
	"errors"
	"fmt"
)

const minPrintable rune = 0x20
const maxPrintable rune = 0x7e

func StringBytesCheckingAscii(s string) ([]byte, error) {
	for _, r := range s {
		if r < minPrintable || r > maxPrintable {
			return nil, errors.New(
				fmt.Sprintf("character %c out of range of printable ASCII characters", r))
		}
	}
	return []byte(s), nil
}
