package crypto

import (
	"crypto/hmac"
	"crypto/sha512"
	"testing"
)

var (
	shortPassword1 = []byte("")
	shortPassword2 = []byte("abc")
	longPassword   = []byte("123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890")
)

var (
	shortMessage = []byte("asotehusao")
	longMessage  = []byte("saoechks,r.chsuasu3h902luhla9ehla8ghu923g8uscraoheual839l28g39l8ghuls9'239lu8hl9e8huasoruh2l398guha9l.eguh8a,s.rugh920l38gul'238glsuac,hl923hu0l982'g3ursc8h9lao8eguafkds.neukdhjc234uf a0,9.8guarsoeuhgal,9.gula9,.hu")
)

func checkSignatures(t *testing.T, ut []byte, std []byte) {
	if len(std) != 512/8 {
		t.Errorf("unexpected hmac length %d != 64", len(std))
	}
	if string(std) != string(ut) {
		t.Errorf("signatures do not match: %x != %x", ut, std)
	}
}

func testPass(t *testing.T, pass []byte) {
	std := hmac.New(sha512.New, pass)
	ut := NewCachedHMAC(sha512.New, pass)

	std.Write(shortMessage)
	ut.Write(shortMessage)
	checkSignatures(t, std.Sum(nil), ut.Sum(nil))

	std.Reset()
	ut.Reset()

	std.Write(longMessage)
	ut.Write(longMessage)
	checkSignatures(t, std.Sum(nil), ut.Sum(nil))
}

func TestAll(t *testing.T) {
	t.Run("Short1", func(t *testing.T) { testPass(t, shortPassword1) })
	t.Run("Short2", func(t *testing.T) { testPass(t, shortPassword2) })
	t.Run("Long", func(t *testing.T) { testPass(t, longPassword) })
}
