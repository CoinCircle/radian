
install:
	curl -L https://foundry.paradigm.xyz | bash;
	brew install libusb;
	foundryup;
	forge update;
	forge install;
	# git submodule update --init --recursive;
	# git submodule update --force --recursive --init --remote;
	# git pull --prune --recurse-submodules --force;

