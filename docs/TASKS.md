# Mga task
magsugod karon kay ang kada task naay fake data o simulator
I convert ang kada bullet didto sa GitHub Issue

## Lead backend ug database 
 chek kung sakto permi ang `docs/API_CONTRACTmd` 
 I review ang kada pull request 
 Idugang ang `GET /api/usage`ayha `GET /api/forecast`ayha `GET /api/bills` gamit ang logic functions
 Idugang ang `POST /api/away` ug basic login landlord ug tenant
ayha na kung makita sa dashboard ang usageayha forecast ug bills gikan sa API

## Dashboard 
 Build sa `web/` Sugdi gamit ang `web/sample readingsjson`ayha dili pa kinahanglan ang backend
 Tenant view watts sa akong kuwarto karonayha usage karong adlawaayha bill hangtod karonayha forecast
 Landlord view tanang kuwartoayha ug unsa ang bahin sa matag usa sa bill
 Charts Chartjs okay ra Ipakita kung asa nga rooms ang simulated
 Ilisan ang sample data ug `GET /api/readings` kung nagana na
ayha na kung kung nag run ang `npm run simulate`ayha mo update live ang dashboard

## Logic ug alerts 
 Isulat ang `backend/src/logic/billingjs` `kwhFromReadings`ayha `splitBill`
 Isulat ang `backend/src/logic/forecastjs` `forecastBill`
 I test gamit ang `web/sample readingsjson` sa `backend/test/` `npm test`
 Sunod Telegram bot nga mo send ug alert message kinahanglan ang `TELEGRAM_BOT_TOKEN`
 Sunod Basic nga anomaly rule pananglitanayha naggamit ug kuryente ang kuwarto sa tibuok gabii
 Stretch appliance identification ayha sugdi gikan sa `firmware/wokwi appliance id`
ayha na kung sakto ang gi return sa functions para sa sample data ug pasar ang tests