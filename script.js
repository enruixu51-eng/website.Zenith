let targetAlarm = null, alarmSound = new Audio(), isRinging = false;
let tmInterval, isRunning = false, timeLeft = 0;

function initSelectors() {
    const sets = [{h:'alarm-h', m:'alarm-m', s:'alarm-s'}, {h:'tomato-h', m:'tomato-m', s:'tomato-s'}];
    sets.forEach(set => {
        const h = document.getElementById(set.h), m = document.getElementById(set.m), s = document.getElementById(set.s);
        for(let i=0; i<24; i++) h.add(new Option(i.toString().padStart(2,'0'), i));
        for(let i=0; i<60; i++) m.add(new Option(i.toString().padStart(2,'0'), i));
        for(let i=0; i<60; i++) s.add(new Option(i.toString().padStart(2,'0'), i));
        if(set.h.includes('tomato')) {
            h.onchange = m.onchange = s.onchange = () => { if(!isRunning) { timeLeft = 0; updateTomatoPreview(); } };
        }
    });
}

function updateAlarmLabels() {
    const h = parseInt(document.getElementById('alarm-h').value);
    const advice = document.getElementById('alarm-advice');
    if (!advice) return;
    if (h >= 5 && h < 12) advice.innerText = "💡 Morning light resets your focus.";
    else if (h >= 12 && h < 17) advice.innerText = "💡 A 20 min nap is peak efficiency.";
    else if (h >= 17 && h < 22) advice.innerText = "💡 Dim lights now for better sleep.";
    else advice.innerText = "💡 Blue light blocks sleep hormones.";
}

// TARGETED START LOGIC
function startRinging(type) {
    isRinging = true;
    
    // Play the correct sound based on the page
    const ringtoneId = type === 'alarm' ? 'alarm-ringtone' : 'tomato-ringtone';
    alarmSound.src = document.getElementById(ringtoneId).value;
    alarmSound.loop = true;
    alarmSound.play();

    // Show the correct STOP button on the correct page
    if (type === 'alarm') {
        document.getElementById('set-alarm-btn').style.display = 'none';
        document.getElementById('stop-alarm-btn').style.display = 'block';
    } else if (type === 'tomato') {
        document.getElementById('tomato-btn').style.display = 'none';
        document.getElementById('tomato-reset-btn').style.display = 'none';
        document.getElementById('stop-tomato-btn').style.display = 'block';
    }
}

// TARGETED STOP LOGIC
function stopRinging(type) {
    alarmSound.pause(); 
    alarmSound.currentTime = 0;
    isRinging = false; 

    // Reset the correct view
    if (type === 'alarm') {
        document.getElementById('set-alarm-btn').style.display = 'block'; 
        document.getElementById('stop-alarm-btn').style.display = 'none'; 
        document.getElementById('alarm-status').innerText = "";
        targetAlarm = null;
    } else if (type === 'tomato') {
        document.getElementById('tomato-btn').style.display = 'block';
        document.getElementById('tomato-reset-btn').style.display = 'block';
        document.getElementById('stop-tomato-btn').style.display = 'none';
        resetTomato();
    }
}

function toggleTomato() {
    const btn = document.getElementById('tomato-btn');
    if (isRunning) { clearInterval(tmInterval); isRunning = false; btn.innerText = "Resume Session"; }
    else {
        if (timeLeft <= 0) timeLeft = (parseInt(document.getElementById('tomato-h').value) * 3600) + (parseInt(document.getElementById('tomato-m').value) * 60) + parseInt(document.getElementById('tomato-s').value);
        if (timeLeft > 0) {
            isRunning = true; btn.innerText = "Pause";
            tmInterval = setInterval(() => { 
                timeLeft--; 
                updateTomatoDisplay(); 
                if (timeLeft <= 0) { 
                    clearInterval(tmInterval); 
                    isRunning = false; 
                    btn.innerText = "Start Session"; 
                    startRinging('tomato'); // Call specific timer start
                } 
            }, 1000);
        }
    }
}

async function getWeather() {
    const city = document.getElementById('city-select').value;
    const url = city === 'local' ? `https://wttr.in/?format=j1` : `https://wttr.in/${city}?format=j1`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        const temp = parseInt(data.current_condition[0].temp_C);
        const cond = data.current_condition[0].weatherDesc[0].value.toLowerCase();
        document.getElementById('temp').innerText = temp + "°";
        document.getElementById('condition').innerText = cond.length > 12 ? cond.split(' ').slice(0,2).join(' ') : cond;
        applyStyles(temp, cond);
    } catch (e) { applyStyles(20, 'clear'); }
}

function applyStyles(temp, cond) {
    const stage = document.querySelector('.sky-stage'), sun = document.querySelector('.sun');
    stage.className = 'sky-stage'; sun.className = 'sun'; document.body.className = '';
    const isRain = cond.includes('rain') || cond.includes('shower');
    const isCloudy = cond.includes('cloud') || cond.includes('overcast');
    if (temp > 28) { stage.classList.add('weather-hot'); document.body.classList.add('theme-hot'); }
    else if (isRain) { stage.classList.add('weather-rain'); document.body.classList.add('theme-rain'); }
    else if (isCloudy) { stage.classList.add('weather-wind'); document.body.classList.add('theme-wind'); }
    else { stage.classList.add('weather-cool'); document.body.classList.add('theme-cool'); }
}

function setAlarm() {
    targetAlarm = `${document.getElementById('alarm-h').value.padStart(2,'0')}:${document.getElementById('alarm-m').value.padStart(2,'0')}:${document.getElementById('alarm-s').value.padStart(2,'0')}`;
    document.getElementById('alarm-status').innerText = "Alarm set: " + targetAlarm;
}

function addReminder() {
    const input = document.getElementById('remind-input'), list = document.getElementById('reminder-list');
    if (!input || input.value.trim() === "") return;
    const div = document.createElement('div');
    div.className = 'reminder-card';
    div.innerHTML = `<span>${input.value}</span><button class="delete-btn" onclick="this.parentElement.remove()">✕</button>`;
    list.prepend(div);
    input.value = "";
}

function updateTomatoDisplay() {
    const h = Math.floor(timeLeft / 3600), m = Math.floor((timeLeft % 3600) / 60), s = timeLeft % 60;
    document.getElementById('tomato-display').innerText = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

function updateTomatoPreview() {
    const h = document.getElementById('tomato-h').value.padStart(2,'0'), m = document.getElementById('tomato-m').value.padStart(2,'0'), s = document.getElementById('tomato-s').value.padStart(2,'0');
    document.getElementById('tomato-display').innerText = `${h}:${m}:${s}`;
}

function resetTomato() { clearInterval(tmInterval); isRunning = false; timeLeft = 0; updateTomatoPreview(); }

setInterval(() => {
    const now = new Date();
    const cur = now.toLocaleTimeString('en-GB', { hour12: false });
    document.getElementById('main-clock').innerText = cur;
    
    // Check Alarm!
    if (targetAlarm === cur && !isRinging) startRinging('alarm'); 
    
    const tz = document.getElementById('tz-select').value;
    let opt = { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' };
    if(tz !== 'local') opt.timeZone = tz;
    document.getElementById('world-time').innerText = new Date().toLocaleTimeString('en-GB', opt);
}, 1000);

function switchTab(id, el) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(el) el.classList.add('active');
}

initSelectors();
getWeather();