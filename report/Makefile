# =====================================================================
#  Dusk Park Design Document — Tectonic Makefile
# =====================================================================
#  Tectonic is a self-contained LaTeX engine that fetches packages on
#  demand, so there is no need for a local TeX Live installation.
#
#  Usage:
#    make            # build report.pdf
#    make clean      # remove build artifacts
#    make clean-all  # remove build artifacts AND the PDF
#    make view       # open the PDF (xdg-open on Linux)
# =====================================================================

# ---------- Configuration ----------
TEX_ENGINE := tectonic
MAIN_SRC   := main.tex
OUTPUT     := report.pdf
BUILD_DIR  := build

# All .tex sources (rebuild if any change)
TEX_SRCS   := $(wildcard *.tex)

# Figure directory (tracked so `make` notices new screenshots)
FIGURE_DIR := figures

# ---------- Default target ----------
.PHONY: all clean clean-all view help

all: $(OUTPUT)

# ---------- Build rule ----------
# Tectonic handles the full multi-pass loop (latex -> bibtex -> latex)
# internally, so a single invocation produces the final PDF.
$(OUTPUT): $(MAIN_SRC) $(TEX_SRCS) $(FIGURE_DIR)/*.png
	@mkdir -p $(BUILD_DIR)
	$(TEX_ENGINE) \
		--keep-logs \
		--keep-intermediates \
		--outdir $(BUILD_DIR) \
		$(MAIN_SRC)
	@# Tectonic names the output after the input; copy to the target name.
	@if [ -f "$(BUILD_DIR)/$(basename $(MAIN_SRC)).pdf" ]; then \
		cp "$(BUILD_DIR)/$(basename $(MAIN_SRC)).pdf" $(OUTPUT); \
		echo "✔ Built $(OUTPUT)"; \
	fi

# ---------- Auxiliary targets ----------
view: $(OUTPUT)
	xdg-open $(OUTPUT) >/dev/null 2>&1 &

clean:
	@rm -rf $(BUILD_DIR)
	@echo "✔ Removed build directory"

clean-all: clean
	@rm -f $(OUTPUT)
	@echo "✔ Removed $(OUTPUT)"

help:
	@echo "Dusk Park Design Document — Tectonic Makefile"
	@echo ""
	@echo "Targets:"
	@echo "  make            Build $(OUTPUT) from $(MAIN_SRC)"
	@echo "  make clean      Remove build intermediates ($(BUILD_DIR)/)"
	@echo "  make clean-all  Remove intermediates AND the final PDF"
	@echo "  make view       Open the PDF in the default viewer"
	@echo "  make help       Show this message"
