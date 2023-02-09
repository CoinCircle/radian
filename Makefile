
install:
	curl -L https://foundry.paradigm.xyz | bash;
	brew install libusb;
	foundryup;
	
	# git submodule sync;
	
	# fixes an issue w/ zksynch new rollout can be removed later probably
	git submodule deinit -f lib/v2-testnet-contracts;

	# forge update;
	forge install;

	# git submodule update --init --recursive;
	# git submodule update --force --recursive --init --remote;
	# git pull --prune --recurse-submodules --force;

