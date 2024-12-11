PORTAL_AUTH_SECRET:=$(shell openssl rand -hex 32)

.PHONY: all init install set-secret remove remove-secret dev clean

all: dev
init: install set-secret

install:
	npm install
# 如果不指定stage，则stage=dev
set-secret:
	npx sst secret set NextAuthSecret $(PORTAL_AUTH_SECRET)
	npx sst secret list
remove-secret:
	npx sst secret remove NextAuthSecret
	npx sst secret list
dev:
	npx sst dev
deploy:
	npx sst deploy
remove:
	npx sst remove
clean: remove remove-secret

.PHONY: check-env init-stage set-secret-stage deploy-stage remove-secret-stage clean-stage
check-env:
	$(if $(STAGE), $(info STAGE=$(STAGE)),$(error STAGE is undefined. STAGE=[qa|pr|production]))
init-stage: install set-secret-stage
set-secret-stage: check-env
	npx sst secret set NextAuthSecret $(PORTAL_AUTH_SECRET) --stage $(STAGE)
	npx sst secret list --stage $(STAGE)
deploy-stage: check-env
	npx sst deploy --stage $(STAGE)
remove-secret-stage: check-env
	npx sst secret remove NextAuthSecret --stage $(STAGE)
	npx sst secret list --stage $(STAGE)
clean-stage: check-env
	npx sst remove --stage $(STAGE)
	make remove-secret-stage
