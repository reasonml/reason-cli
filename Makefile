clean:
	@rm -rf package

# Releases to Github
release:
	@# Program "fails" if unstaged changes.
	@echo 
	@git diff --exit-code || (echo ""  && echo "!!You have unstaged changes. Please clean up first." && exit 1)
	@git diff --cached --exit-code || (echo "" && echo "!!You have staged changes. Please reset them or commit them first." && exit 1);
	@rm -rf ./package
	@# Strip away git metadata etc.
	@FILE=`npm pack` && tar xzf $$FILE && rm $$FILE
	@cd ./package; env ORIGIN=`git remote get-url origin` VERSION=$(VERSION) TYPE=$(TYPE) DEBUG=$(DEBUG) node -e "require('./releaseUtils/release.js').buildRelease(); require('./releaseUtils/release.js').release(); "
