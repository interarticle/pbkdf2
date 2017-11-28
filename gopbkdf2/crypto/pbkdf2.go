package crypto

import (
	"encoding/binary"
	"hash"
)

func PBKDF2DeriveBytes(passwordPRF hash.Hash, salt []byte, iter, keyLen int) []byte {
	result := make([]byte, keyLen)
	blocks := (keyLen + passwordPRF.Size() - 1) / passwordPRF.Size()
	for i := 1; i <= blocks; i++ {
		toSign := make([]byte, len(salt)+4)
		copy(toSign, salt)
		binary.BigEndian.PutUint32(toSign[len(salt):], uint32(i))
		blockResult := make([]byte, passwordPRF.Size())
		for j := range blockResult {
			blockResult[j] = 0
		}

		for j := 0; j < iter; j++ {
			passwordPRF.Write(toSign)
			toSign = passwordPRF.Sum(toSign[:0])
			passwordPRF.Reset()
			for k := range blockResult {
				blockResult[k] ^= toSign[k]
			}
		}
		copy(result[passwordPRF.Size()*(i-1):], blockResult)
	}
	return result
}
