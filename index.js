const mineflayer = require('mineflayer');
const express = require('express');

const app = express();

app.get('/', (_req, res) => res.json({ status: 'ok' }));
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Web sunucu hazir: ${PORT}`));

let reconnectScheduled = false;

function scheduleReconnect(reason) {
    if (reconnectScheduled) return;
    reconnectScheduled = true;
    console.log(`Bot düstü (${reason}), 30 saniye sonra tekrar baglanıyor...`);
    setTimeout(() => {
        reconnectScheduled = false;
        createBot();
    }, 30_000);
}

function createBot() {
    console.log('Bot baglanıyor...');

    const bot = mineflayer.createBot({
        host: 'alininsunucusu.skymc.io',
        port: 25565,
        username: 'AfkBot-123',
        version: '1.21.11',
    });

    let botReconnectScheduled = false;

    function botScheduleReconnect(reason) {
        if (botReconnectScheduled) return;
        botReconnectScheduled = true;
        scheduleReconnect(reason);
    }

    bot.on('spawn', () => {
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

    bot.on('end', (reason) => botScheduleReconnect(reason));
    bot.on('error', (err) => {
        console.error('Bot hatasi:', err.message);
        botScheduleReconnect(err.message);
    });
}

createBot();
