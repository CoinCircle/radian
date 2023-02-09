
install:
	curl -L https://foundry.paradigm.xyz | bash;
	brew install libusb;
	foundryup;

	# forge update;
	forge install;

	# git submodule sync;
	# git submodule update --init --recursive;
	# git submodule deinit -f lib/v2-testnet-contracts;
	# git pull --prune --recurse-submodules --force;
	# git submodule update --init --recursive;

	# git submodule update --init --recursive;
	# git submodule update --init --recursive --force  --remote;
	# git pull --prune --recurse-submodules --force;

