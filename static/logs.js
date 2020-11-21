const statusText = document.createElement('h3');

async function loadAndProcessLogs(id) {
    const req = await fetch(`/${id}/raw`);
    const logs = await req.text();
    const ips = new Set();

    if (!req.ok) throw req;

    logs.split('\n').forEach(ip => {
        if (ip == '') return;
        ips.add(ip);
    });

    return Array.from(ips);
}

async function getInfoAboutIPs(ips) {
    const out = [];

    for (const ip of ips) {
        const req = await fetch(`https://json.geoiplookup.io/${ip}`);
        const info = await req.json();

        if (!info.success) continue;

        out.push({
            ip,
            isp: info.isp,
            city: info.city,
            country: info.country_name.toLowerCase()
        });
    }

    return out;
}

function renderIps(ips, country) {
    let html = '';

    for (const ip of ips) {
        const color = ip.country == country ? 'darkorange' : 'black';
        html += `<h3 style="color: ${color};">${ip.ip} from ${ip.city} (${ip.isp})</h3>\n`;
    }

    return html;
}

function setupViewer(ips) {
    const input = document.createElement('input');
    const counter = document.createElement('h3');
    const ipDiv = document.createElement('div');
    const br = document.createElement('br');

    counter.innerHTML = `${ips.length} unique IPs!`;
    input.placeholder = 'Country';
    input.type = 'text';
    ipDiv.id = 'ips';

    ipDiv.innerHTML = renderIps(ips, input.value.toLowerCase());
    input.oninput = () => {
        ipDiv.innerHTML = renderIps(ips, input.value.toLowerCase());
    };

    document.body.appendChild(input);
    document.body.appendChild(br);
    document.body.appendChild(ipDiv);
    document.body.appendChild(counter);
}

async function start() {
    document.body.appendChild(statusText);
    let ips = [];

    statusText.innerHTML = 'Loading logs...';

    try {
        ips = await loadAndProcessLogs(window.id);
    } catch (err) {
        statusText.innerHTML = "Couldn't fetch logs!";
        statusText.style.color = 'red';
        return;
    }

    statusText.innerHTML = 'Getting info about IPs...';

    try {
        ips = await getInfoAboutIPs(ips);
    } catch (err) {
        statusText.innerHTML = "Couldn't get info about IPs!";
        statusText.style.color = 'red';
        return;
    }

    statusText.remove();

    setupViewer(ips);
}

window.addEventListener('DOMContentLoaded', start);
