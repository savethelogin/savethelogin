#!/usr/bin/env bash

ls dist-zip/*.zip | awk '{ print $0 " " $0 }' | sed 's/\.zip$/\.xpi/' | xargs cp
