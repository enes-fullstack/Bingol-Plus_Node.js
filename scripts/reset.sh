#!/bin/sh

echo "Veritabanı sıfırlanıyor..."

npx sequelize-cli db:drop
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

echo
echo "Tüm işlemler tamamlandı."