package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"regexp"
	"strings"
)

const (
	scriptFile   = "index.js"
	templateFile = "index-dev.md"
	outputFile   = "index.md"
)

var (
	marker            = regexp.MustCompile(`\<script src="index\.js"\>\</script\>`)
	insertionTemplate = "<script>\n%s\n</script>"
)

func main() {
	templateBytes, err := ioutil.ReadFile(templateFile)
	if err != nil {
		log.Fatal(err)
	}

	scriptBytes, err := ioutil.ReadFile(scriptFile)
	if err != nil {
		log.Fatal(err)
	}

	script := string(scriptBytes)
	if strings.HasSuffix(script, "\n") {
		script = script[:len(script)-1]
	}
	scriptTemplate := fmt.Sprintf(insertionTemplate, script)
	template := marker.ReplaceAllLiteralString(string(templateBytes), scriptTemplate)
	err = ioutil.WriteFile(outputFile, []byte(template), 0644)
	if err != nil {
		log.Fatal(err)
	}
}
