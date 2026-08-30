#!/bin/sh

echo "Veritabanı sıfırlanıyor..."

npx sequelize-cli db:create
npx sequelize-cli db:migrate

echo
echo "Tüm işlemler tamamlandı."