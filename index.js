bu const mineflayer = require('mineflayer');
const express = require('express');

const app = express();

app.get('/', (_req, res) => res.json({ status: 'ok' }));
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Web sunucu hazir: ${PORT}`));

const SERVERS = [
    { host: 'alininsunucusu.skymc.io',    port: 25565, username: 'AfkBot-123' },
    { host: 'alininsunucusu402.mcsh.io',  port: 25565, username: 'AfkBot-456' },
];

function startBot(server) {
    let reconnectScheduled = false;

    function scheduleReconnect(reason) {
        if (reconnectScheduled) return;
        reconnectScheduled = true;
        console.log(`[${server.host}] Bot düstü (${reason}), 30s sonra tekrar baglanıyor...`);
        setTimeout(() => {
            reconnectScheduled = false;
            connect();
        }, 30_000);
    }

    function connect() {
        console.log(`[${server.host}] Baglanıyor...`);

        const bot = mineflayer.createBot({
            host: server.host,
            port: server.port,
            username: server.username,
            connectTimeout: 30_000,
        });

        let botReconnectScheduled = false;
        let spawned = false;

        const watchdog = setTimeout(() => {
            if (!spawned) {
                console.log(`[${server.host}] Watchdog: spawn olmadı, yeniden deniyor...`);
                bot.quit();
            }
        }, 90_000);

        function botScheduleReconnect(reason) {
            clearTimeout(watchdog);
            if (botReconnectScheduled) return;
            botReconnectScheduled = true;
            scheduleReconnect(reason);
        }

        bot.on('spawn', () => {
            spawned = true;
            clearTimeout(watchdog);
            console.log(`[${server.host}] Bot sunucuya girdi!`);

            const interval = setInterval(() => {
                if (bot.entity) {
                    const yaw = bot.entity.yaw + (Math.random() * 0.4 - 0.2);
                    const pitch = (Math.random() * 0.4 - 0.2);
                    bot.look(yaw, pitch, false);
                }
            }, 30_000);

            bot.once('end', () => clearInterval(interval));
        });

        bot.on('kicked', (reason) => {
            console.log(`[${server.host}] Kick: ${reason}`);
        });

        bot.on('end', (reason) => botScheduleReconnect(reason));
        bot.on('error', (err) => {
            console.error(`[${server.host}] Hata: ${err.message}`);
            botScheduleReconnect(err.message);
        });
    }

    connect();
}

SERVERS.forEach(startBot);
