#!/bin/bash

if [[ $UID != 0 ]]; then
    echo "ERROR: Please start the script as root or sudo!"
    exit 1
fi

echo "Installing Sputnik..."

# copy main app
cp -af ./Sputnik /opt/

# set execution permissions
chmod 755 /opt/Sputnik/sputnik
chmod 755 /opt/Sputnik/sputnik.sh

# copy .desktop file
cp -f ./Sputnik.desktop /usr/share/applications/

# solution for lacking libudev.so.0
paths=(
  "/lib/x86_64-linux-gnu/libudev.so.1" # Ubuntu, Xubuntu, Mint
  "/usr/lib64/libudev.so.1" # SUSE, Fedora
  "/usr/lib/libudev.so.1" # Arch, Fedora 32bit
  "/lib/i386-linux-gnu/libudev.so.1" # Ubuntu 32bit
)
for i in "${paths[@]}"
do
  if [ -f $i ]
  then
    ln -sf "$i" /opt/Sputnik/libudev.so.0
    break
  fi
done

echo "Installation done!"
echo "Application has been installed to /opt/Sputnik/"
echo "You might need to logout and login again to see Sputnik in the launcher."