package crypto

import (
	"errors"
	"hash"
	"reflect"
	"unsafe"
)

const maxHashStructSize = 1000

type SavableHash interface {
	hash.Hash
	Save()
	Restore()
}

func NewSavableHash(newHash func() hash.Hash) SavableHash {
	inst := newHash()
	ptr, size := getHashPointer(inst)
	return &copyableHash{
		Hash:        inst,
		newHash:     newHash,
		structBytes: ((*[maxHashStructSize]byte)(unsafe.Pointer(ptr)))[:size],
	}
}

func getHashPointer(h hash.Hash) (uintptr, uintptr) {
	v := reflect.ValueOf(h)
	if v.Kind() != reflect.Ptr {
		panic(errors.New("pointless to copy a non-pointer struct hash"))
	}

	ptrType := v.Type()
	structType := ptrType.Elem()
	if structType.Kind() != reflect.Struct {
		panic(errors.New("cannot copy non-struct hash"))
	}

	for i := 0; i < structType.NumField(); i++ {
		field := structType.Field(i)
		switch field.Type.Kind() {
		case reflect.Chan, reflect.Func, reflect.Interface, reflect.Map,
			reflect.Ptr, reflect.Slice, reflect.String, reflect.UnsafePointer:
			panic(errors.New("cannot safely copy struct containing pointer types"))
		}
	}

	return v.Pointer(), structType.Size()
}

type copyableHash struct {
	hash.Hash
	newHash     func() hash.Hash
	structBytes []byte
	savedBytes  []byte
}

func (c *copyableHash) Save() {
	c.savedBytes = make([]byte, len(c.structBytes))
	copy(c.savedBytes, c.structBytes)
}

func (c *copyableHash) Restore() {
	copy(c.structBytes, c.savedBytes)
}
