ESY_VERSION = $(shell esy version)

ifeq ($(TYPE), bin)
	RELEASE_TAG = "bin-$(shell uname | tr A-Z a-z)"
else
	RELEASE_TAG = $(TYPE)
endif

RELEASE_DIR = _release/$(RELEASE_TAG)

clean:
	@rm -rf _release

build-release:
ifndef NO_UNSTAGED_CHECK
	@# Program "fails" if unstaged changes.
	@git diff --exit-code || (echo "" && echo "!!You have unstaged changes. Please clean up first." && exit 1)
	@git diff --cached --exit-code || (echo "" && echo "!!You have staged changes. Please reset them or commit them first." && exit 1);
endif
	@esy release $(TYPE)
	@cp ./Makefile $(RELEASE_DIR)/Makefile
	@cp ./bin/esy $(RELEASE_DIR)/.bin/esy
	@make \
		TYPE="$(TYPE)" \
		-C "$(RELEASE_DIR)" \
		_build-release

_build-release:
	@echo "*** Adding esy as a bundled dependency..."
	@npm install --global --prefix _esyInstallation "esy@$(ESY_VERSION)"
	@tar -czf _esyInstallation.tar.gz _esyInstallation
	@rm -rf _esyInstallation
	@echo "$$POSTINSTALL_EXTRA" >> ./postinstall.sh
	@node -e "$$ADD_ESY_BIN_SCRIPT"

# Releases to Github
release: build-release
	@make \
		RELEASE_TAG="$(RELEASE_TAG)" \
		ORIGIN=`git remote get-url origin` \
		VERSION=`node -p "require('./package.json').version"` \
		-C "$(RELEASE_DIR)" \
		_release

# This should only be called by `release` target
_release:
	@echo "$$WELCOME_MSG"
	@git init .
	@git checkout -b branch-$(VERSION)-$(RELEASE_TAG)
	@git add .
	@git remote add origin $(ORIGIN)
	@git fetch --tags --depth=1
	@git commit -m "Preparing release $(VERSION)-$(RELEASE_TAG)"
	@# Return code is inverted to receive boolean return value',
	@(git tag --delete "$(VERSION)-$(RELEASE_TAG)" &> /dev/null) \
	 	|| echo "Tag $(VERSION)-$(RELEASE_TAG) doesn't yet exist, creating it now."
	@git tag -a "$(VERSION)-$(RELEASE_TAG)" -m "$(VERSION)-$(RELEASE_TAG)"
	@echo "$$ALMOST_DONE_MSG"


define ADD_ESY_BIN_SCRIPT
	var fs = require('fs');
	var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
	pkg.bin.esy = './.bin/esy'
	fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
endef
export ADD_ESY_BIN_SCRIPT

define POSTINSTALL_EXTRA

#
# Unpack esy installation
#

gunzip "_esyInstallation.tar.gz"
if hash bsdtar 2>/dev/null; then
	bsdtar -xf "_esyInstallation.tar"
else
	if hash tar 2>/dev/null; then
		# Supply --warning=no-unknown-keyword to supresses warnings when packed on OSX
		tar --warning=no-unknown-keyword -xf "_esyInstallation.tar"
	else
		echo >&2 "Installation requires either bsdtar or tar - neither is found.  Aborting.";
	fi
fi
rm -rf "_esyInstallation.tar"

endef
export POSTINSTALL_EXTRA

define WELCOME_MSG

----------------------------------------------
--- Preparing release $(VERSION)-$(RELEASE_TAG)
----------------------------------------------

endef
export WELCOME_MSG

define ALMOST_DONE_MSG

----------------------------------------------------
-- Almost Done. Complete the following two steps
----------------------------------------------------

Directory $(RELEASE_DIR) contains a git repository ready
to be pushed under a tag to remote.

1. [REQUIRED] cd $(RELEASE_DIR)

2. git show HEAD
		Make sure you approve of what will be pushed to tag $(VERSION)-$(RELEASE_TAG)

3. git push origin HEAD:branch-$(VERSION)-$(RELEASE_TAG)
		Push a release branch if needed.

4. [REQUIRED] git push origin $(VERSION)-$(RELEASE_TAG)
		Push a release tag.

You can test install the release by running:

		npm install "$(ORIGIN)#$(VERSION)-$(RELEASE_TAG)"

> Note: If you are pushing an update to an existing tag, you might need to add -f to the push command.

endef
export ALMOST_DONE_MSG
