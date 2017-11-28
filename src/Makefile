PATH:=../node_modules/typescript/bin:$(PATH)
TSC:=tsc

../index.js: $(wildcard *.ts) tsconfig.json $(wildcard */*.ts)
	$(TSC)
