const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
let settings = localStorage.hasOwnProperty("settings") ? JSON.parse(localStorage.getItem("settings")) : {
    "monthlyGoal": 20,
    "displayMode": 0,
    "reminder": {"active": false, "daysToMonthsEnd": 3}
};

const timesSuffix = new Date().getFullYear();
let timer = {
    times: localStorage.hasOwnProperty("times" + timesSuffix) ? JSON.parse(localStorage.getItem("times" + timesSuffix)) : {},
    startTime: -1,
    isRunning: () => {
        return timer.startTime !== -1;
    },
    start: () => {
        timer.startTime = timer.now();
    },
    stop: () => {
        let now = timer.now();
        let dStart = Math.floor(timer.startTime / 60 / 60 / 24);
        let dEnd = Math.floor(now / 60 / 60 / 24);
        for (let i = 0; i < dEnd - dStart + 1; i++) {
            let int = {
                from: Math.max(timer.startTime, (dStart + i) * 60 * 60 * 24),
                to: Math.min(now, (dStart + i + 1) * 60 * 60 * 24 - 1)
            };
            let d = new Date();
            d.setTime(int.from * 1000);
            let month = d.getMonth(), day = d.getDate();
            if (timer.times[month] === undefined)
                timer.times[month] = {};
            if (timer.times[month][day] === undefined)
                timer.times[month][day] = [];
            timer.times[month][day].push(int);
        }
        localStorage.setItem("times" + timesSuffix, JSON.stringify(timer.times));
        timer.startTime = -1;
    },
    now: () => {
        return Math.floor(new Date().getTime() / 1000);
    },
    getTimeDay: (month, day) => {
        if (timer.times[month] === undefined || timer.times[month][day] === undefined)
            return 0;
        let time = 0;
        for (let int of timer.times[month][day])
            time += int.to - int.from;
        return time;
    },
    getTimeMonth: (month) => {
        if (timer.times[month] === undefined)
            return 0;
        let time = 0;
        for (let day in timer.times[month])
            time += timer.getTimeDay(month, day);
        return time;
    },
    getTimeNow: () => {
        return timer.startTime === -1 ? 0 : timer.now() - timer.startTime;
    },
    getTimeToday: () => {
        let d = new Date();
        return timer.getTimeDay(d.getMonth(), d.getDate()) + timer.getTimeNow();
    },
    getTimeThisMonth: () => {
        return timer.getTimeMonth(new Date().getMonth()) + timer.getTimeNow();
    },
    formatTime: (time) => {
        let h = Math.floor(time / 60 / 60);
        let m = Math.floor(time / 60) % 60;
        let s = time % 60;
        return (("" + h).length === 1 ? "0" + h : h) + ":" + (("" + m).length === 1 ? "0" + m : m) + ":" + (("" + s).length === 1 ? "0" + s : s);
    }
};
let updateInterval = -1;
let updateFunction = () => {
    document.getElementById("counter-today").innerText = timer.formatTime(timer.getTimeToday());
    document.getElementById("counter-month").innerText = timer.formatTime(timer.getTimeThisMonth());
    document.getElementById("counter-goal").innerText = timer.formatTime(Math.max(0, settings.monthlyGoal * 60 * 60 - timer.getTimeThisMonth()));
};

function timerClick(button) {
    if (!timer.isRunning()) {
        timer.start();
        updateInterval = setInterval(updateFunction, 1000);
        button.innerText = "Stop";
    } else {
        timer.stop();
        clearInterval(updateInterval);
        button.innerText = "Start";
    }
}

function loadChronic() {
    let zeroPad = (number) => (number = "" + number).length === 2 ? number : "0" + number;
    let ul1 = document.getElementById("chronic").getElementsByTagName("ul")[0];
    while (ul1.children.length > 0)
        ul1.children[0].remove();
    for (let month of Object.keys(timer.times).reverse()) {
        let li1 = document.createElement("li");
        li1.innerText = MONTHS[month];
        let ul2 = document.createElement("ul");
        for (let day in timer.times[month]) {
            let li2 = document.createElement("li");
            li2.innerText = day + ". " + MONTHS[month];
            let ul3 = document.createElement("ul");
            for (let time of timer.times[month][day]) {
                let li3 = document.createElement("li");
                let d1 = new Date(), d2 = new Date();
                d1.setTime(time.from*1000);
                d2.setTime(time.to*1000);
                li3.innerText = zeroPad(d1.getHours()) + ":" + zeroPad(d1.getMinutes()) + " - " + zeroPad(d2.getHours()) + ":" + zeroPad(d2.getMinutes()) + " Uhr";
                ul3.appendChild(li3);
            }
            li2.appendChild(ul3);
            ul2.appendChild(li2)
        }
        li1.appendChild(ul2);
        ul1.appendChild(li1);
    }
}

function saveSettings() {
    settings.monthlyGoal = document.getElementById("monthlyGoal").value;
    localStorage.setItem("settings", JSON.stringify(settings));
}

function showPage(page) {
    if (page.startsWith("/"))
        page = page.substring(1);
    if (page === "")
        page = "main";
    const TITLES = {"main": "Arbeitszeit", "chronic": "Chronik", "settings": "Einstellungen"};
    document.getElementById("title").innerText = page in TITLES ? TITLES[page] : "Fehler 404";
    for (let e of document.getElementsByTagName("main"))
        e.style.display = e.id === (page in TITLES ? page : "error-404") ? "" : "none";
    if (page === "chronic")
        loadChronic();
    else if (page === "settings") {
        document.getElementById("monthlyGoal").value = settings.monthlyGoal;
    }
    document.getElementsByTagName("nav")[0].style.left = "-80%";
}

window.onpopstate = () => {
    showPage(location.pathname);
};
