#!/bin/bash

if [[ $UID != 0 ]]; then
    echo "ERROR: Please start the script as root or sudo!"
    exit 1
fi

echo "Installing Sputnik..."

# copy main app
cp -r -f ./Sputnik /opt

# copy .desktop file
cp -f ./Sputnik.desktop /usr/share/applications

# solution for lacking libudev.so.0
set -e
udiskbin=`which udisks`
udevso=`ldd $udiskbin | grep libudev.so | awk '{print $3;}'`
if [ -e "$udevso" ]; then
    ln -sf "$udevso" /opt/Sputnik/libudev.so.0
fi

echo "Installation done!"