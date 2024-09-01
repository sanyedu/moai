.PHONY: build start stop
build:
	docker-compose build
start:
	docker-compose up -d
stop:
	docker-compose down

APP_DIR:=/app/moai
SSH_USER:=root@sanyedu.com
.PHONY: scp
scp:
	rsync -a --progress \
		--exclude=.git \
		--exclude=node_modules \
		--exclude=.next \
		--exclude=package-lock.json \
		--exclude=.env.* \
		$(PWD) $(SSH_USER):/app
	scp nextjs/.env.deploy $(SSH_USER):/app/moai/nextjs/.env.local
