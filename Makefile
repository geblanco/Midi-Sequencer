
#
# Global Settings
#

INSTALL = install
BUILDDIR = ./build/release
SRC_DIR = MidiSequencer
DESTDIR ?= /
PREFIX  ?= $(DESTDIR)/usr

PATH_EXEC = $(PREFIX)/bin/midi-sequencer
#
# Targets
#

all:
	@echo "Nothing to do"

make:
	@rm -rf $(BUILDDIR)
	@mkdir -p $(BUILDDIR)
	g++ -Wall -D__LINUX_ALSA__ -o $(BUILDDIR)/midi-sequencer $(SRC_DIR)/*.cpp -lasound -lpthread

install:
	$(INSTALL) -m0755 -D src/url-handler $(PATH_EXEC)

uninstall:
	rm -f $(PATH_EXEC)

.PHONY: all
.DEFAULT_GOAL := make