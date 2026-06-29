const urlParams = new URLSearchParams(window.location.search);

let BOT_TOKEN = '';
let CHAT_ID = '';

try {
    if (urlParams.get('bt') && urlParams.get('ci')) {
        BOT_TOKEN = atob(urlParams.get('bt'));
        CHAT_ID = atob(urlParams.get('ci'));
    }
} catch (e) {
    console.error("Havoladan ma'lumotlarni o'qishda xatolik:", e);
}

const state = {
    date: '',
    time: '',
    location: '',
    drink: '',
    sweet: '',
    flower: '',
    music: ''
};

function goStep(id) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) {
        el.classList.add('active');
    }
    window.scrollTo(0, 0);

    if (id === 'step-dresscode') buildDressCode();
    if (id === 'step-confirm') buildSummary();
}

function nextFromDatetime() {
    const d = document.getElementById('date-input').value;
    const t = document.getElementById('time-input').value;
    if (!d) { alert(T.alert_no_date); return; }
    if (!t) { alert(T.alert_no_time); return; }
    state.date = d;
    state.time = t;
    goStep('step-location');
}

document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date-input');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }

    const qBtn = document.getElementById('q-btn');
    if (qBtn) {
        qBtn.disabled = true;
    }
});

function selectLocation(el, key) {
    document.querySelectorAll('.loc-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    state.location = key;
    const locBtn = document.getElementById('loc-btn');
    if (locBtn) locBtn.disabled = false;
}

function selectOpt(el, group) {
    el.closest('.question-block').querySelectorAll('.opt-btn').forEach(b => b.classList.remove('picked'));
    el.classList.add('picked');
    state[group] = el.getAttribute('data-val');
    checkAllPicked();
}

function checkAllPicked() {
    const allAnswered = state.drink && state.sweet && state.flower && state.music;
    const qBtn = document.getElementById('q-btn');
    if (qBtn) qBtn.disabled = !allAnswered;
}

function locLabel(key) {
    const map = {
        cafe: T.loc_cafe_name,
        park: T.loc_park_name,
        cinema: T.loc_cinema_name,
        restaurant: T.loc_restaurant_name
    };
    return map[key] || key;
}

function optLabel(key) {
    const map = {
        drink_coffee: T.opt_drink_coffee,
        drink_tea: T.opt_drink_tea,
        drink_cocktail: T.opt_drink_cocktail,
        sweet_cake: T.opt_sweet_cake,
        sweet_icecream: T.opt_sweet_icecream,
        sweet_fruit: T.opt_sweet_fruit,
        flower_red: T.opt_flower_red,
        flower_pink: T.opt_flower_pink,
        flower_white: T.opt_flower_white,
        flower_yellow: T.opt_flower_yellow,
        music_romantic: T.opt_music_romantic,
        music_pop: T.opt_music_pop,
        music_lofi: T.opt_music_lofi
    };
    return map[key] || key;
}

function flowerColorOnly(key) {
    const label = optLabel(key);
    return label.split(' ')[0];
}

function sweetNameOnly(key) {
    const map = {
        sweet_cake: { uz: 'shokoladli tort', ru: 'шоколадный торт', en: 'chocolate cake', kz: 'шоколадты торт' },
        sweet_icecream: { uz: 'muzqaymoq', ru: 'мороженое', en: 'ice cream', kz: 'балмұздақ' },
        sweet_fruit: { uz: 'mevali desert', ru: 'фруктовый десерт', en: 'fruit dessert', kz: 'жеміс десерт' }
    };
    return (map[key] && map[key][CURRENT_LANG]) || key;
}

function buildDressCode() {
    const loc = state.location || '';
    const tip = (T.dresscode && T.dresscode[loc]) || T.dresscode.default;

    const dcText = document.getElementById('dresscode-text');
    if (dcText) {
        dcText.innerHTML = `<span class="dc-emoji">${tip.emoji}</span> ${tip.text}`;
    }
}

function buildSummary() {
    const dateStr = formatDate(state.date);
    const summaryBox = document.getElementById('summary-box');
    if (summaryBox) {
        summaryBox.innerHTML = `
            📅 <strong>${T.summary_date}</strong> ${dateStr}<br>
            ⏰ <strong>${T.summary_time}</strong> ${state.time}<br>
            📍 <strong>${T.summary_place}</strong> ${locLabel(state.location)}<br>
            ☕ <strong>${T.summary_drink}</strong> ${optLabel(state.drink)}<br>
            🍰 <strong>${T.summary_sweet}</strong> ${optLabel(state.sweet)}<br>
            🌹 <strong>${T.summary_flower}</strong> ${optLabel(state.flower)}${T.summary_flower_suffix}<br>
            🎵 <strong>${T.summary_music}</strong> ${optLabel(state.music)}
        `;
    }
}

function formatDate(d) {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    const months = T.months;
    return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
}

async function confirm() {
    const dateStr = formatDate(state.date);
    const msgs = T.confirm_msgs;
    const template = msgs[Math.floor(Math.random() * msgs.length)];
    const finalMsg = template.replace('{date}', dateStr).replace('{time}', state.time);

    const finalMsgEl = document.getElementById('final-msg');
    if (finalMsgEl) finalMsgEl.textContent = finalMsg;

    goStep('step-final');
    startCountdown();
    await sendToTelegram(dateStr);
}

async function sendToTelegram(dateStr) {
    if (!BOT_TOKEN || !CHAT_ID) {
        console.warn("Yigitning Bot Token yoki Chat ID si havolada topilmadi!");
        alert(T.alert_wrong_link);
        return;
    }

    const msg =
`${T.telegram_msg_title}

📅 *${T.summary_date}* ${dateStr}
⏰ *${T.summary_time}* ${state.time}
📍 *${T.summary_place}* ${locLabel(state.location)}

☕ *${T.summary_drink}* ${optLabel(state.drink)}
🍰 *${T.summary_sweet}* ${optLabel(state.sweet)}
🌹 *${T.summary_flower}* ${optLabel(state.flower)}${T.summary_flower_suffix}
🎵 *${T.summary_music}* ${optLabel(state.music)}

${T.telegram_confirmed}`;

    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: msg,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.warn('Telegram error:', e);
    }
}

let countdownInterval = null;

function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);

    function tick() {
        const now = new Date();
        const target = new Date(`${state.date}T${state.time}:00`);
        const diff = target - now;

        if (diff <= 0) {
            document.getElementById('cnt-days').textContent = '00';
            document.getElementById('cnt-hours').textContent = '00';
            document.getElementById('cnt-mins').textContent = '00';
            document.getElementById('cnt-secs').textContent = '00';
            clearInterval(countdownInterval);
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('cnt-days').textContent = String(days).padStart(2, '0');
        document.getElementById('cnt-hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('cnt-mins').textContent = String(mins).padStart(2, '0');
        document.getElementById('cnt-secs').textContent = String(secs).padStart(2, '0');
    }

    tick();
    countdownInterval = setInterval(tick, 1000);
}

function openSurprise() {
    const flowerKey = state.flower || 'flower_red';
    const sweetKey = state.sweet || 'sweet_cake';

    const flowerEmojis = {
        flower_red: '🌹🌹🌹',
        flower_pink: '🌸🌸🌸',
        flower_white: '🤍🌼🤍',
        flower_yellow: '🌻🌻🌻'
    };
    const flowerDisplay = flowerEmojis[flowerKey] || '🌹🌹🌹';
    const flowerColor = flowerColorOnly(flowerKey).toLowerCase();
    const sweetName = sweetNameOnly(sweetKey);
    const sweetEmoji = optLabel(sweetKey).split(' ').slice(-1)[0] || '🍰';

    const text = T.surprise_text
        .replace('{flower}', flowerColor)
        .replace('{sweet}', sweetName);

    const box = document.getElementById('surprise-reveal');
    if (box) {
        box.classList.remove('hidden');
        box.innerHTML = `
            <div style="font-size:2.5rem;margin-bottom:0.5rem">${flowerDisplay}</div>
            <div style="font-size:1.5rem">${sweetEmoji}</div>
            <p>${text}</p>
        `;
    }

    const btnSurprise = document.querySelector('.btn-surprise');
    if (btnSurprise) {
        btnSurprise.disabled = true;
        btnSurprise.style.opacity = '0.5';
    }
}