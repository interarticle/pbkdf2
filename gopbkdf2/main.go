package main

import (
	"bufio"
	"crypto/sha512"
	"encoding/hex"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/interarticle/pbkdf2/gopbkdf2/crypto"
	"github.com/interarticle/pbkdf2/gopbkdf2/passwordgen"
	"golang.org/x/crypto/ssh/terminal"
)

const (
	setupRounds    = 100000000
	passwordRounds = 5000000
)

var (
	setupSalt       = flag.String("setup_salt", "PBKDF-PASSWORD-1", "Setup key generation PBKDF2 salt")
	passwordGenType = map[string]func([]byte) string{
		"Alpha2NumDollar11": passwordgen.GenAlpha2NumDollar11,
		"AlphaNum10":        passwordgen.GenAlphaNum10,
		"Alpha2Num10":       passwordgen.GenAlpha2Num10,
		"Num4":              passwordgen.GenNum4,
		"Num6":              passwordgen.GenNum6,
	}
)

type PBKDF2IterationsPerSecond float64

func measurePBKDF2Speed() PBKDF2IterationsPerSecond {
	bs512bits := make([]byte, 64)
	var rounds int
	var elapsed time.Duration
	log.Print("Measuring PBKDF2 speed")
	prf := crypto.NewCachedHMAC(sha512.New, bs512bits)
	for rounds = 100000; rounds < 1<<30; rounds *= 2 {
		startTime := time.Now()
		crypto.PBKDF2DeriveBytes(prf, bs512bits, rounds, 64)
		elapsed = time.Now().Sub(startTime)
		if elapsed > time.Millisecond*200 {
			break
		}
	}
	speed := PBKDF2IterationsPerSecond(float64(rounds) / elapsed.Seconds())
	log.Printf("PBKDF2 speed: %.1f rounds/s", speed)
	return speed
}

func readPassword(prompt string) []byte {
	os.Stdout.WriteString(prompt)
	password, err := terminal.ReadPassword(0)
	if err != nil {
		log.Fatal(err)
	}
	os.Stdout.WriteString("\n")
	return password
}

func readText(prompt string) string {
	os.Stdout.WriteString(prompt)
	salt, err := bufio.NewReader(os.Stdin).ReadString('\n')
	if err != nil {
		log.Fatal(err)
	}
	if salt[len(salt)-1] == '\n' {
		salt = salt[:len(salt)-1]
	}
	return salt
}

func main() {
	flag.Parse()
	speed := measurePBKDF2Speed()

	args := flag.Args()
	if len(args) == 0 {
		log.Fatal("Usage: <command>")
	}
	command := args[0]
	args = args[1:]
	switch command {
	case "setup-key":
		password := readPassword("Password: ")
		log.Printf("Key generation will take %s",
			time.Duration(float64(setupRounds)/float64(speed)*float64(time.Second)))
		prf := crypto.NewCachedHMAC(sha512.New, password)
		setupKey := crypto.PBKDF2DeriveBytes(prf, []byte(*setupSalt), setupRounds, 64)
		log.Printf("Setup Key is: %s", hex.EncodeToString(setupKey))
	case "generate":
		setupHex := readPassword("Setup Key: ")
		setupKey, err := hex.DecodeString(string(setupHex))
		if err != nil {
			log.Fatal(err)
		}
		password := readPassword("Password: ")

		salt := readText("Salt: ")
		log.Printf("Using salt \"%s\"", salt)

		genMethod := readText(fmt.Sprintf("Method (%s): ", passwordGenType))
		genFunc, ok := passwordGenType[genMethod]
		if !ok {
			log.Fatalf("Unknown method %s", genMethod)
		}

		log.Printf("Password generation will take %s",
			time.Duration(float64(passwordRounds)/float64(speed)*float64(time.Second)))
		setupHMAC := crypto.NewCachedHMAC(sha512.New, setupKey)
		key := crypto.PBKDF2DeriveBytes(setupHMAC, password, 1, 128)
		setupHMAC.Reset()
		setupHMAC.Write([]byte(salt))
		signedSalt := setupHMAC.Sum(nil)

		passwordPRF := crypto.NewCachedHMAC(sha512.New, key)
		derivedBytes := crypto.PBKDF2DeriveBytes(passwordPRF, signedSalt, passwordRounds, 64)

		log.Printf("Password: %s", genFunc(derivedBytes))
	default:
		log.Fatalf("Unknown command \"%s\"", command)
	}
}
