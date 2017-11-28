GO:=go

all: generate-index-js index.md

generate-index-js:
	cd src && $(MAKE)

index.md: index-dev.md index.js embedscript.go
	$(GO) run embedscript.go

.PHONY: generate-index
