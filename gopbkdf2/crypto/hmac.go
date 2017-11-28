package crypto

import (
	"hash"
)

const iPadXOR = 0x36
const oPadXOR = 0x5c

type cachedMAC struct {
	iPadHash  SavableHash
	oPadHash  SavableHash
	size      int
	blockSize int
}

func NewCachedHMAC(h func() hash.Hash, key []byte) hash.Hash {
	ih := h()
	if len(key) > ih.BlockSize() {
		ih.Write(key)
		key = ih.Sum(nil)
		ih.Reset()
	}

	basePad := make([]byte, ih.BlockSize())
	for i := range basePad {
		basePad[i] = 0
	}
	copy(basePad, key)

	iPad := make([]byte, ih.BlockSize())
	copy(iPad, basePad)
	for i := range iPad {
		iPad[i] ^= iPadXOR
	}
	oPad := make([]byte, ih.BlockSize())
	copy(oPad, basePad)
	for i := range oPad {
		oPad[i] ^= oPadXOR
	}

	iPadHash := NewSavableHash(h)
	iPadHash.Write(iPad)
	iPadHash.Save()
	oPadHash := NewSavableHash(h)
	oPadHash.Write(oPad)
	oPadHash.Save()
	return &cachedMAC{
		iPadHash,
		oPadHash,
		ih.Size(),
		ih.BlockSize(),
	}
}

func (h *cachedMAC) Write(b []byte) (int, error) {
	return h.iPadHash.Write(b)
}

func (h *cachedMAC) Sum(b []byte) []byte {
	inLen := len(b)
	b = h.iPadHash.Sum(b)
	h.oPadHash.Restore()
	h.oPadHash.Write(b[inLen:])
	return h.oPadHash.Sum(b[:inLen])
}

func (h *cachedMAC) Reset() {
	h.iPadHash.Restore()
}

func (h *cachedMAC) Size() int {
	return h.size
}

func (h *cachedMAC) BlockSize() int {
	return h.blockSize
}
