@echo off

set NODE_ENV=development

echo Build ve Test kontrolleri yapiliyor...

call npx sequelize-cli db:drop
call npx sequelize-cli db:create
call npx sequelize-cli db:migrate
call npx sequelize-cli db:seed:all
call npm run build
call npm run test

echo.
echo Tum islemler tamamlandi.

pause