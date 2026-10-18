# Energy Monitor

project:energy monitor para sa boarding houses.

Naay ESP32 nga naay clamp sensor Mao measure kung pila ka watts ang gigamit sa isa ka kwarto tas ipadala niya sa backend gikan didto makuha nato ang bill kada kwarto ang forecast, ug alert kung naay appliance nga nalimtan nga naka on ba kaha then Kung naa pay time, pwede nato butngan og kuan maka balo kung unsa nga appliances ang gi on nga nalimtan

Tan-awa ang `docs/architecture.mmd` i-paste and sulod sa architecture.mmd sa https://mermaid.live aron makita and diagram 

ESP32 node -> API -> database -> bill/forecast/alert logic -> dashboard ug Telegram.


## Unsaon pag-run

Kinahanglan ug Node.js atleast 22.13 nga version para sa built-in nga SQLite
Pag naay mogawas nga ExperimentalWarning: SQLite okay rana kay built-in ra ni sa Node ug walay native module nga i-install.

```bash
cd backend
npm install
npm start
```

After ana adto ani nga site http://localhost:3000 then open new terminal para mag send og fake nga readings

```bash
cd backend
npm run simulate
```

MOgana na if makita ninyu nga ma fill and placeholder page sa mga readings  Ctrl+C ra dayun pag stop

Ang database kay matik na nga mahimo sa `backend/data/energy.db` Ayaw ni i commit

## TAsk

Check ang `docs/TASKS.md`. Ang data format naa sa `docs/API_CONTRACT.md`.