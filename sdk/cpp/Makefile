# SPDX-License-Identifier: Apache-2.0
#
# No CMake on purpose. One dependency and four translation units; a build system
# would be larger than the thing it builds.
#
# ARCH exists because of a real and boring problem: libsodium is a native
# library, and if the one you have was built for a different architecture than
# your compiler defaults to, the link fails with a message about missing symbols
# rather than about architecture. This detects the architecture of the libsodium
# actually on the machine and builds to match, so the error you get is the true
# one. Override with `make ARCH=arm64` if you know better.
CXX      ?= c++
SODIUM_CFLAGS := $(shell pkg-config --cflags libsodium 2>/dev/null)
SODIUM_LIBS   := $(shell pkg-config --libs libsodium 2>/dev/null || echo -lsodium)
SODIUM_LIBDIR := $(shell pkg-config --variable=libdir libsodium 2>/dev/null)
ARCH ?= $(shell file $(SODIUM_LIBDIR)/libsodium.dylib 2>/dev/null | grep -o 'x86_64\|arm64' | head -1)
ARCHFLAG := $(if $(ARCH),-arch $(ARCH),)

CXXFLAGS ?= -std=c++17 -O2 -Wall -Wextra -Wpedantic -Iinclude
BUILD := build
BINS  := $(BUILD)/test-jcs $(BUILD)/test-interlock $(BUILD)/bpi-canon $(BUILD)/bpi-verify

all: $(BINS)

$(BUILD):
	@mkdir -p $(BUILD)

# No crypto, so no architecture constraint.
$(BUILD)/test-jcs: tests/test-jcs.cpp include/bpi/*.hpp | $(BUILD)
	$(CXX) $(CXXFLAGS) -o $@ $<

$(BUILD)/test-interlock: tests/test-interlock.cpp include/bpi/*.hpp | $(BUILD)
	$(CXX) $(CXXFLAGS) -o $@ $<

$(BUILD)/bpi-canon: src/bpi-canon.cpp include/bpi/*.hpp | $(BUILD)
	$(CXX) $(ARCHFLAG) $(CXXFLAGS) -o $@ $<

$(BUILD)/bpi-verify: src/bpi-verify.cpp include/bpi/*.hpp | $(BUILD)
	$(CXX) $(ARCHFLAG) $(CXXFLAGS) $(SODIUM_CFLAGS) -o $@ $< $(SODIUM_LIBS)

# The check that matters is the last one: this implementation against the
# published vectors, driven by the same runner an outsider would use.
check: all
	@./$(BUILD)/test-jcs
	@echo
	@./$(BUILD)/test-interlock
	@echo
	@cd ../.. && node tools/bpi-validate.mjs vectors --exec "./sdk/cpp/$(BUILD)/bpi-verify"

# Every JSON file in the repository, canonicalised by both implementations and
# compared byte for byte. Two canonicalisers that agree on the signed test cases
# and diverge on real documents have agreed about nothing.
crosscheck: $(BUILD)/bpi-canon
	@cd ../.. && same=0; diff=0; \
	for f in $$(find examples profiles conformance schemas -name '*.json' | sort); do \
	  a=$$(node -e "const{canonicalize}=await import('./tools/lib/jcs.mjs');const fs=await import('node:fs');process.stdout.write(canonicalize(JSON.parse(fs.readFileSync(process.argv[1],'utf8'))))" --input-type=module "$$f" 2>/dev/null | shasum | cut -d' ' -f1); \
	  b=$$(./sdk/cpp/$(BUILD)/bpi-canon < "$$f" 2>/dev/null | shasum | cut -d' ' -f1); \
	  if [ "$$a" = "$$b" ] && [ -n "$$a" ]; then same=$$((same+1)); else diff=$$((diff+1)); echo "  DIVERGES: $$f"; fi; \
	done; \
	echo "  canonicalisation: $$same byte-identical, $$diff divergent"; \
	[ $$diff -eq 0 ]

clean:
	rm -rf $(BUILD)

.PHONY: all check crosscheck clean
