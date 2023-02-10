include .env

install:
	curl -L https://foundry.paradigm.xyz | bash;
	brew install libusb;
	foundryup;
	forge install;

	echo "\n\nRun \nnpm install --force; \nAfter setting up the .env file\n\n";
	echo "\n\nRun\nforge test -c contracts/test/moneymarket/MoneyMarket.t.sol\nto test if stuff is working."

	# git submodule sync;
	# git submodule update --init --recursive;
	# git submodule deinit -f lib/v2-testnet-contracts;
	# git pull --prune --recurse-submodules --force;
	# git submodule update --init --recursive;
	# git submodule update --init --recursive;
	# git submodule update --init --recursive --force  --remote;
	# git pull --prune --recurse-submodules --force;

chain:
	anvil -m ${MNEMONIC} --code-size-limit=99999999


localdeploy:
	forge script contracts/Deploy.s.sol:DeployScript --rpc-url http://127.0.0.1:8545 --broadcast -vvvv;


rundapp:
	npm install --prefix ./dapp;
	npm run --prefix ./dapp dev;

rundocs:
	npm install --prefix ./docs;
	npm run --prefix ./docs start;

