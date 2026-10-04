#!/usr/bin/env bash
#
# Installs and launches AI Hub on an iOS simulator. Use this to iterate quickly
# — it needs no signing at all.
#
# Three things this script defends against, each of which bit us repeatedly:
#
#   * CoreSimulator is slow to answer on a loaded machine. A single wedged
#     `simctl` call used to hang the whole run, so every call now goes through
#     a watchdog and is killed and retried rather than waited on forever.
#
#   * A host reboot makes CoreSimulator hand out brand-new device UUIDs and can
#     delete a device's data directory outright, leaving a device that is
#     listed but cannot boot. The device is therefore resolved by name on every
#     run and repaired (erased) or created when that happens.
#
#   * A full rebuild costs minutes for a change that touches no code. The
#     build is skipped when the existing bundle is newer than the sources.
#
# The simulator runs headless unless --open is given: Simulator.app adds a
# rendering load that, on this machine, was enough to push the box into the
# storms described above.
#
# Usage: ios/scripts/run-simulator.sh [DEVICE] [options]
#
#   ios/scripts/run-simulator.sh                       # build if needed, run
#   ios/scripts/run-simulator.sh --no-build            # reuse the last bundle
#   ios/scripts/run-simulator.sh --skip-welcome        # straight to the main UI
#   ios/scripts/run-simulator.sh --screenshot          # also save a PNG
#   ios/scripts/run-simulator.sh "iPhone 17 Pro" --open
#
# Environment overrides:
#   SIMCTL_ATTEMPTS  how many times a call may be retried      (default 3)
#   SIMCTL_TIMEOUT   seconds before one attempt is abandoned  (default 300)
#   SIM_SHOT_FRAMES  frames captured by --screenshot            (default 4)
#   SIM_SHOT_INTERVAL seconds between those frames             (default 8)
#   SIM_DEVICE_TYPE  device type used when creating a device  (default iPhone 17)
#   SIM_RUNTIME      runtime used when creating a device      (default iOS 26.3)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$IOS_DIR/.." && pwd)"

PROJECT="$IOS_DIR/AIHub.xcodeproj"
SCHEME="AIHub"
CONFIG="Debug"
DERIVED_DATA="$ROOT_DIR/build/ios-simulator"
APP="$DERIVED_DATA/Build/Products/$CONFIG-iphonesimulator/$SCHEME.app"
BUNDLE_ID="com.aihub.app"

DEVICE_TYPE="${SIM_DEVICE_TYPE:-com.apple.CoreSimulator.SimDeviceType.iPhone-17}"
RUNTIME="${SIM_RUNTIME:-com.apple.CoreSimulator.SimRuntime.iOS-26-3}"

SIMCTL_ATTEMPTS="${SIMCTL_ATTEMPTS:-3}"
SIMCTL_TIMEOUT="${SIMCTL_TIMEOUT:-300}"

SCREENSHOT="$ROOT_DIR/build/ios-simulator-screenshot.png"

DEVICE=""
DO_BUILD="auto"
SKIP_WELCOME=0
TAKE_SHOT=0
OPEN_SIM=0

usage() { sed -n '2,32p' "$0" | sed 's/^# \{0,1\}//'; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)   usage; exit 0 ;;
    --no-build)  DO_BUILD="no" ;;
    --build)     DO_BUILD="yes" ;;
    --skip-welcome) SKIP_WELCOME=1 ;;
    --screenshot)  TAKE_SHOT=1 ;;
    --open)      OPEN_SIM=1 ;;
    --*)         echo "error: unknown option $1" >&2; exit 2 ;;
    *)           DEVICE="$1" ;;
  esac
  shift
done
DEVICE="${DEVICE:-iPhone 17}"

if ! command -v xcodegen >/dev/null 2>&1; then
  echo "error: xcodegen not found. Install it with: brew install xcodegen" >&2
  exit 1
fi

SIMCTL="$(xcrun -f simctl 2>/dev/null || true)"
if [[ -z "$SIMCTL" || ! -x "$SIMCTL" ]]; then
  echo "error: could not locate simctl via xcrun" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# simctl wrapper
# ---------------------------------------------------------------------------

# Runs simctl under a watchdog. Returns the command's own exit status, or 124
# if every attempt timed out. Output goes to stdout exactly as simctl writes it,
# so callers can capture diagnostics on failure.
simctl_try() {
  local timeout="$1"; shift
  local attempt log pid waited rc

  for attempt in $(seq 1 "$SIMCTL_ATTEMPTS"); do
    log="$(mktemp)"
    "$SIMCTL" "$@" >"$log" 2>&1 &
    pid=$!
    waited=0

    while kill -0 "$pid" 2>/dev/null && (( waited < timeout )); do
      sleep 1
      waited=$(( waited + 1 ))
    done

    if kill -0 "$pid" 2>/dev/null; then
      # Still running: it is wedged, not slow. Report what it managed to say,
      # kill it, and let the machine settle before trying again.
      cat "$log" >&2 || true
      rm -f "$log"
      echo "    simctl $* did not answer within ${timeout}s — killing and retrying (attempt $attempt/$SIMCTL_ATTEMPTS)" >&2
      kill -9 "$pid" 2>/dev/null || true
      sleep 5
      continue
    fi

    wait "$pid" 2>/dev/null && rc=0 || rc=$?
    cat "$log"
    rm -f "$log"
    return "$rc"
  done

  echo "error: 'simctl $*' never answered within ${timeout}s over $SIMCTL_ATTEMPTS attempts" >&2
  return 124
}

# ---------------------------------------------------------------------------
# Device resolution
# ---------------------------------------------------------------------------

devices_dir() {
  printf '%s' "$HOME/Library/Developer/CoreSimulator/Devices"
}

resolve_device() {
  # Name-matched only; the runtimes column is not part of the match, so a name
  # that also appears on another device could in principle match twice and the
  # first entry wins.
  "$SIMCTL" list devices available 2>/dev/null \
    | grep -E "^ +${DEVICE} \(" \
    | sed -E 's/^ +[^(]*\(([0-9A-Fa-f-]{36})\).*/\1/' \
    | head -1
}

# Whether the device is up or still coming up. Deliberately not `bootstatus`,
# which blocks until the device finishes booting — using it as a yes/no probe
# meant a half-migrated device stalled the run for the whole watchdog timeout.
is_booted() {
  "$SIMCTL" list devices booted 2>/dev/null | grep -qF "$1"
}

ensure_device() {
  local udid="$1"

  # simctl happily lists a device whose data directory has been removed; it
  # then refuses to boot it with "cannot be located on disk". Erasing rebuilds
  # the directory in place, which keeps the UUID stable.
  if [[ ! -d "$(devices_dir)/$udid/data" ]]; then
    echo "==> Data directory for $DEVICE ($udid) is missing — erasing to rebuild it"
    simctl_try "$SIMCTL_TIMEOUT" erase "$udid" || true
  fi

  if is_booted "$udid"; then
    echo "==> $DEVICE is already up"
  else
    echo "==> Booting $DEVICE ($udid)"
    # "Unable to boot device in current state: Booted" is the harmless case of
    # booting something that is already up.
    simctl_try "$SIMCTL_TIMEOUT" boot "$udid" 2>&1 \
      | grep -v "current state: Booted" >&2 || true
  fi

  # A first boot migrates data and takes many minutes under load, so this gets
  # a longer budget than the rest of the calls.
  echo "==> Waiting for $DEVICE to finish coming up"
  simctl_try "$((SIMCTL_TIMEOUT * 4))" bootstatus "$udid" -b >/dev/null 2>&1 || true

  UDID="$udid"
}

UDID="$(resolve_device || true)"
if [[ -z "$UDID" ]]; then
  echo "==> No simulator named '$DEVICE' found — creating one"
  UDID="$(simctl_try "$SIMCTL_TIMEOUT" create "$DEVICE" "$DEVICE_TYPE" "$RUNTIME" | tail -1)"
  if [[ -z "$UDID" ]]; then
    echo "error: could not create a simulator named '$DEVICE'" >&2
    exit 1
  fi
  echo "    created $UDID"
fi
echo "==> Device: $DEVICE ($UDID)"

ensure_device "$UDID"

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------

# True when the existing bundle is missing or older than something that can
# change its behaviour. The appiconset is excluded on purpose: build-ipa.sh
# regenerates it from Artwork/, so its timestamps would otherwise force a
# rebuild on every single run for a difference the simulator cannot show.
sources_are_newer() {
  [[ -d "$APP" ]] || return 0
  local newer
  newer="$(find "$IOS_DIR/AIHub" -name '*.swift' -newer "$APP/$SCHEME" -print -quit 2>/dev/null || true)"
  [[ -n "$newer" ]] && return 0
  newer="$(find "$IOS_DIR/AIHub/Assets.xcassets" -path '*AppIcon.appiconset*' -prune -o \
             -type f -newer "$APP/$SCHEME" -print -quit 2>/dev/null || true)"
  [[ -n "$newer" ]] && return 0
  newer="$(find "$IOS_DIR/project.yml" -newer "$APP/$SCHEME" -print -quit 2>/dev/null || true)"
  [[ -n "$newer" ]]
}

should_build() {
  case "$DO_BUILD" in
    yes) return 0 ;;
    no)  return 1 ;;
    auto) sources_are_newer && return 0 || return 1 ;;
  esac
}

if should_build; then
  echo "==> Generating Xcode project from ios/project.yml"
  xcodegen generate --spec "$IOS_DIR/project.yml" --project "$IOS_DIR" >/dev/null

  echo "==> Building $SCHEME ($CONFIG) for the simulator"
  xcodebuild \
    -project "$PROJECT" \
    -scheme "$SCHEME" \
    -configuration "$CONFIG" \
    -sdk iphonesimulator \
    -destination "id=$UDID" \
    -derivedDataPath "$DERIVED_DATA" \
    build
else
  echo "==> Skipping build — $APP is up to date with the sources"
fi

if [[ ! -d "$APP" ]]; then
  echo "error: expected app bundle not found at $APP" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Install and launch
# ---------------------------------------------------------------------------

# Anything already running holds a stale copy of the bundle and of its own
# WebView session; terminate first so the launch below is the one that sticks.
# Failing to terminate is normal on a first run, so only genuinely unexpected
# messages are surfaced.
simctl_try 120 terminate "$UDID" "$BUNDLE_ID" 2>&1 \
  | grep -viE "nothing to terminate|unable to terminate|failed to terminate|current state: Booted" >&2 || true

echo "==> Installing"
simctl_try "$SIMCTL_TIMEOUT" install "$UDID" "$APP"

if [[ "$SKIP_WELCOME" == "1" ]]; then
  # The app writes this the first time the welcome sheet is dismissed. Setting
  # it up front means screenshots land on the real UI without a tap.
  echo "==> Marking the welcome sheet as seen"
  simctl_try 120 spawn "$UDID" defaults write "$BUNDLE_ID" aihub_has_seen_welcome -bool YES >/dev/null || true
fi

echo "==> Launching"
LAUNCH_OUTPUT="$(simctl_try "$SIMCTL_TIMEOUT" launch "$UDID" "$BUNDLE_ID")"
printf '%s\n' "$LAUNCH_OUTPUT"

APP_PID="$(printf '%s' "$LAUNCH_OUTPUT" | sed -nE 's/.*:[[:space:]]*([0-9]+)[[:space:]]*$/\1/p' | head -1)"

if [[ "$OPEN_SIM" == "1" ]]; then
  SIMULATOR_APP="$(xcode-select -p)/Applications/Simulator.app"
  open -a Simulator 2>/dev/null || open "$SIMULATOR_APP" 2>/dev/null || true
fi

if [[ "$TAKE_SHOT" == "1" ]]; then
  # `simctl launch` returns as soon as the process exists, which is well before
  # the app has been foregrounded and painted: the first frames can still show
  # SpringBoard, and a cold WebKit can briefly render nothing at all. Rather
  # than guess a single delay, take a few frames and keep the last, so the saved
  # PNG settles on whatever the app actually drew.
  mkdir -p "$(dirname "$SCREENSHOT")"
  frames="${SIM_SHOT_FRAMES:-4}"
  for frame in $(seq 1 "$frames"); do
    sleep "${SIM_SHOT_INTERVAL:-8}"
    simctl_try 180 io "$UDID" screenshot "$SCREENSHOT" >/dev/null || true
    printf '\r==> Capturing %s (frame %d/%d)' "$SCREENSHOT" "$frame" "$frames"
  done
  printf '\n'
fi

echo
echo "==> Running on $DEVICE"
echo "    Device:  $UDID"
[[ -n "$APP_PID" ]] && echo "    PID:     $APP_PID"
[[ "$TAKE_SHOT" == "1" ]] && echo "    Shot:    $SCREENSHOT"