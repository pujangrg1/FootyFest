#!/bin/bash
# Increase file limit and start Expo
ulimit -n 4096
npx expo start "$@"

