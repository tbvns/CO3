#!/bin/bash

# ================= CONFIGURATION =================

# 1. Base Project Path (Current directory)
PROJECT_ROOT="."

# 2. Source Directory (UPDATED: Added 'main')
SOURCE_BASE="$PROJECT_ROOT/main/res/status"

# 3. Output Directory
OUTPUT_DIR="$PROJECT_ROOT/main/res/status/merged"

# =================================================

# Define sub-directories
DIR_RATING="$SOURCE_BASE/public"
DIR_CAT="$SOURCE_BASE/relationship"
DIR_WARN="$SOURCE_BASE/warnings"
DIR_STATUS="$SOURCE_BASE/status"

# Check dependencies
if ! command -v montage &> /dev/null; then
    echo "Error: ImageMagick is not installed."
    echo "Run: sudo apt-get install imagemagick"
    exit 1
fi

# Create output dir
mkdir -p "$OUTPUT_DIR"

echo "Reading icons from: $SOURCE_BASE"
echo "Saving merged icons to: $OUTPUT_DIR"
echo "------------------------------------------------"

# --- MAPPINGS (Shortcode : ActualFilename) ---

# Rating (Top Left)
RATINGS=(
    "gen:icon-general-public.png"
    "teen:icon-teen-public.png"
    "mat:icon-mature-public.png"
    "exp:icon-explicite-public.png"  # Matches your file spelling
    "nr:icon-unknown-public.png"
)

# Category (Top Right)
CATEGORIES=(
    "ff:icon-ff-relationships.png"
    "fm:icon-inter-relationships.png"
    "mm:icon-mm-relationships.png"
    "multi:icon-multiple-relationships.png"
    "other:icon-other-relationships.png"
    "gen:icon-none-relationships.png"
)

# Warning (Bottom Left)
WARNINGS=(
    "cntua:icon-unspecified-warning.png"
    "warn:icon-has-warning.png"
    "none:icon-unknown-warning.png"
    "ext:icon-web-warning.png"
)

# Status (Bottom Right)
STATUSES=(
    "comp:icon-done-status.png"
    "wip:icon-unfinished-status.png"
)

count=0

# --- GENERATION LOOP ---
for r_str in "${RATINGS[@]}"; do
    r_code="${r_str%%:*}"; r_file="$DIR_RATING/${r_str#*:}"

    for c_str in "${CATEGORIES[@]}"; do
        c_code="${c_str%%:*}"; c_file="$DIR_CAT/${c_str#*:}"

        for w_str in "${WARNINGS[@]}"; do
            w_code="${w_str%%:*}"; w_file="$DIR_WARN/${w_str#*:}"

            for s_str in "${STATUSES[@]}"; do
                s_code="${s_str%%:*}"; s_file="$DIR_STATUS/${s_str#*:}"

                OUTPUT_NAME="ic_${r_code}_${c_code}_${w_code}_${s_code}.png"
                OUTPUT_PATH="$OUTPUT_DIR/$OUTPUT_NAME"

                # Validation
                if [[ ! -f "$r_file" ]]; then echo "Missing: $r_file"; continue; fi
                if [[ ! -f "$c_file" ]]; then echo "Missing: $c_file"; continue; fi
                if [[ ! -f "$w_file" ]]; then echo "Missing: $w_file"; continue; fi
                if [[ ! -f "$s_file" ]]; then echo "Missing: $s_file"; continue; fi

                # ImageMagick Montage
                montage "$r_file" "$c_file" \
                        "$w_file" "$s_file" \
                        -tile 2x2 \
                        -geometry +0+0 \
                        -background none \
                        "$OUTPUT_PATH"

                ((count++))
            done
        done
    done
done

echo "------------------------------------------------"
echo "Finished! Generated $count merged icons."
echo "Location: $OUTPUT_DIR"
echo ""
echo "To enable these in Android notifications, run:"
echo "cp $OUTPUT_DIR/*.png $PROJECT_ROOT/android/app/src/main/res/drawable/"