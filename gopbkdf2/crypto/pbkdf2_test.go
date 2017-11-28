package crypto

import (
	"crypto/sha512"
	"golang.org/x/crypto/pbkdf2"
	"testing"
)

var (
	password = []byte("asteuhrl'c.hl90238")
	salt     = []byte("saoechul2l3g8asoehksr2c.hkahjsr")
)

func checkDerived(t *testing.T, ut []byte, std []byte) {
	if string(std) != string(ut) {
		t.Errorf("derivations do not match: %x != %x", ut, std)
	}
}

func Test(t *testing.T) {
	utPRF := NewCachedHMAC(sha512.New, password)

	// Full block.
	std := pbkdf2.Key(password, salt, 1, 64, sha512.New)
	ut := PBKDF2DeriveBytes(utPRF, salt, 1, 64)
	checkDerived(t, ut, std)

	// 2.5 blocks.
	std = pbkdf2.Key(password, salt, 10, 150, sha512.New)
	ut = PBKDF2DeriveBytes(utPRF, salt, 10, 150)
	checkDerived(t, ut, std)

	// 1 Block - 1 byte.
	std = pbkdf2.Key(password, salt, 10, 63, sha512.New)
	ut = PBKDF2DeriveBytes(utPRF, salt, 10, 63)
	checkDerived(t, ut, std)

	// 1 byte.
	std = pbkdf2.Key(password, salt, 10000, 1, sha512.New)
	ut = PBKDF2DeriveBytes(utPRF, salt, 10000, 1)
	checkDerived(t, ut, std)

	// 0 byte.
	std = pbkdf2.Key(password, salt, 10000, 0, sha512.New)
	ut = PBKDF2DeriveBytes(utPRF, salt, 10000, 0)
	checkDerived(t, ut, std)
}
