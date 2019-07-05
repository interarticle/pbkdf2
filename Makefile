GO:=go

all: generate-index-js index.md pbkdf2.html

generate-index-js:
	cd src && $(MAKE)

index.md: index-dev.md index.js embedscript.go
	$(GO) run embedscript.go

pbkdf2.html: index.md
	( cat $<; echo '<meta name="viewport" content="width=device-width, initial-scale=1">' ) > $@

.PHONY: generate-index
