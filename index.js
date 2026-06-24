const mineflayer = require('mineflayer');
const express = require('express');

const app = express();

app.get('/', (_req, res) => res.json({ status: 'ok' }));
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Web sunucu hazir: ${PORT}`));

let reconnectScheduled = false;

function scheduleReconnect(reason, delay = 30_000) {
    if (reconnectScheduled) return;
    reconnectScheduled = true;
    console.log(`Bot düstü (${reason}), ${delay / 1000} saniye sonra tekrar baglanıyor...`);
    setTimeout(() => {
        reconnectScheduled = false;
        createBot();
    }, delay);
}

function createBot() {
    console.log('Bot baglanıyor...');

    const bot = mineflayer.createBot({
        host: 'alininsunucusu.skymc.io',
        port: 25565,
        username: 'AfkBot-123',
        connectTimeout: 30_000,
    });

    let botReconnectScheduled = false;
    let spawned = false;

    // Watchdog: 90 saniye içinde spawn olmazsa yeniden dene
    const watchdog = setTimeout(() => {
        if (!spawned) {
            console.log('Watchdog: Bot spawn olmadi, yeniden baglanıyor...');
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
        console.log('Bot sunucuya girdi ve bekliyor!');

        // Her 30 saniyede bir kafayı cevirerek AFK kick'i önle
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
        console.log('Bot kick yedi:', reason);
    });

    bot.on('end', (reason) => botScheduleReconnect(reason));
    bot.on('error', (err) => {
        console.error('Bot hatasi:', err.message);
        botScheduleReconnect(err.message);
    });
}

createBot();
