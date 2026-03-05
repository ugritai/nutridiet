#!/bin/bash
set - e

echo "Restaurando nutridiet..."

mongorestore \
-u root \
-p RootPass123 \
--authenticationDatabase admin \
--db nutridiet \
/dump/nutridiet
