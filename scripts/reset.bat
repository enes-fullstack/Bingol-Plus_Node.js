@echo off

set NODE_ENV=development

echo Veritabani sifirlaniyor...

call npx sequelize-cli db:drop
call npx sequelize-cli db:create
call npx sequelize-cli db:migrate
call npx sequelize-cli db:seed:all

echo.
echo Tum islemler tamamlandi.

pause