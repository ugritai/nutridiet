#!/bin/bash
set - e

echo "Restaurando fooddb..."

mongorestore \
-u root \
-p RootPass123 \
--authenticationDatabase admin \
--db nutridiet \
/dump/fooddb
