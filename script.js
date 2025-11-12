function NetSpeed() {
  this.activeServer = null;
  this.phase = 0;
  console.log("SpeedTest Project");
}

NetSpeed.prototype = {
  constructor: NetSpeed,

  getPhase: function () { return this.phase; },

  _validateServer: function (srv) {
    if (typeof srv.name !== "string") throw "Missing server name";
    if (typeof srv.server !== "string") throw "Missing server address";
    if (!srv.server.endsWith("/")) srv.server += "/";
    if (srv.server.startsWith("//")) srv.server = location.protocol + srv.server;
    if (typeof srv.dlURL !== "string") throw "Missing download URL";
    if (typeof srv.ulURL !== "string") throw "Missing upload URL";
    if (typeof srv.pingURL !== "string") throw "Missing ping URL";
  },

  addServer: function (srv) {
    this._validateServer(srv);
    if (this.phase === 0) this.phase = 1;
    if (this.phase !== 1) throw "Cannot add server after selection";
    this.activeServer = srv;
    this.phase = 2;
  },

  run: function () {
    if (this.phase === 3) throw "Test already running";
    this.worker = new Worker("speedtest.js?r=" + Math.random());

    this.worker.onmessage = e => {
      if (e.data === this._lastMsg) return;
      this._lastMsg = e.data;
      const data = JSON.parse(e.data);
      if (this.onupdate) this.onupdate(data);
      if (data.testState >= 4) {
        clearInterval(this._poller);
        this.phase = 4;
        if (this.onend) this.onend(data.testState === 5, data);
      }
    };

    this._poller = setInterval(() => {
      this.worker.postMessage("status");
    }, 200);

    if (this.phase === 2) {
      this.phase = 3;
      this.worker.postMessage("start");
    }
  },

  stop: function () {
    if (this.phase < 3) throw "Cannot abort before start";
    if (this.phase < 4) this.worker.postMessage("abort");
  }
};

// Localhost integration
function initServers() {
  const localhostServer = {
    name: "Localhost",
    server: "http://localhost/",
    dlURL: "php/upload_download.php",
    ulURL: "php/pingsetc.php",
    pingURL: "php/pingsetc.php"
  };

  window.s = new NetSpeed();
  s.addServer(localhostServer);

  document.getElementById("loading").className = "hidden";
  document.getElementById("testWrapper").className = "visible";
  initUI();

  frame(); // start UI loop
}

// Reset UI
function initUI() {
  drawMeter(document.getElementById("dlMeter"), 0, meterBk, dlColor, 0);
  drawMeter(document.getElementById("ulMeter"), 0, meterBk, ulColor, 0);
  document.getElementById("dlText").textContent = "";
  document.getElementById("ulText").textContent = "";
  document.getElementById("pingText").textContent = "";
  document.getElementById("summary").className = "hidden";
}

let testStartTime = null;
var uiData = null;

// Start/Stop button logic
function startStop() {
  if (s.getPhase() === 3) {
    s.stop();
    document.getElementById("startStopBtn").className = "";
  } else {
    document.getElementById("startStopBtn").className = "running";
    testStartTime = Date.now();
    s.onupdate = function(data) { uiData = data; };
    s.onend = function(aborted, finalData) {
      document.getElementById("startStopBtn").className = "";

      if (!aborted) {
        // Safe parsing with fallback
        let durationSec = (Date.now() - testStartTime) / 1000;
        let dlBytes = Number(finalData.dlBytes) || 0;
        let ulBytes = Number(finalData.ulBytes) || 0;
        let dlMB = dlBytes / (1024 * 1024);
        let ulMB = ulBytes / (1024 * 1024);
        let totalMB = dlMB + ulMB;

        document.getElementById("sumPing").textContent =
          "Ping: " + format(finalData.pingStatus) + " ms";
        document.getElementById("sumDownload").textContent =
          "Download Speed: " + format(finalData.dlStatus) + " Mbit/s";
        document.getElementById("sumUpload").textContent =
          "Upload Speed: " + format(finalData.ulStatus) + " Mbit/s";
        document.getElementById("sumData").textContent =
          "Duration: " + durationSec.toFixed(1) + " s | " +
          "Data Used: Download " + dlMB.toFixed(1) + " MB, " +
          "Upload " + ulMB.toFixed(1) + " MB, Total " + totalMB.toFixed(1) + " MB";

        document.getElementById("summary").className = "visible";
      }
    };
    s.run();
  }
}

// Gauge + UI update
var meterBk = "#80808040";
var dlColor = "#6060AA";
var ulColor = "#616161";
var progColor = meterBk;

function drawMeter(c, amount, bk, fg, progress, prog) {
  var ctx = c.getContext("2d");
  var dp = window.devicePixelRatio || 1;
  var cw = c.clientWidth * dp, ch = c.clientHeight * dp;
  var sizScale = ch * 0.0055;
  if (c.width == cw && c.height == ch) {
    ctx.clearRect(0, 0, cw, ch);
  } else {
    c.width = cw;
    c.height = ch;
  }
  ctx.beginPath();
  ctx.strokeStyle = bk;
  ctx.lineWidth = 12 * sizScale;
  ctx.arc(c.width/2, c.height-58*sizScale, c.height/1.8-ctx.lineWidth,
          -Math.PI*1.1, Math.PI*0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = fg;
  ctx.lineWidth = 12 * sizScale;
  ctx.arc(c.width/2, c.height-58*sizScale, c.height/1.8-ctx.lineWidth,
          -Math.PI*1.1, amount*Math.PI*1.2-Math.PI*1.1);
  ctx.stroke();
  if (typeof progress !== "undefined") {
    ctx.fillStyle = prog;
    ctx.fillRect(c.width*0.3, c.height-16*sizScale,
                 c.width*0.4*progress, 4*sizScale);
  }
}

function mbpsToAmount(s) {
  return 1 - (1 / (Math.pow(1.3, Math.sqrt(s))));
}

function format(d) {
  d = Number(d);
  if (d < 10) return d.toFixed(2);
  if (d < 100) return d.toFixed(1);
  return d.toFixed(0);
}

function oscillate() {
  return 1 + 0.02 * Math.sin(Date.now() / 100);
}

function updateUI(forced) {
  if (typeof s === "undefined") return;
  if (!forced && s.getPhase() != 3) return;
  if (uiData == null) return;
  var status = uiData.testState;
  document.getElementById("dlText").textContent =
    (status==1 && uiData.dlStatus==0) ? "..." : format(uiData.dlStatus);
  drawMeter(document.getElementById("dlMeter"),
    mbpsToAmount(Number(uiData.dlStatus*(status==1?oscillate():1))),
    meterBk, dlColor, Number(uiData.dlProgress), progColor);
  document.getElementById("ulText").textContent =
    (status==3 && uiData.ulStatus==0) ? "..." : format(uiData.ulStatus);
  drawMeter(document.getElementById("ulMeter"),
    mbpsToAmount(Number(uiData.ulStatus*(status==3?oscillate():1))),
    meterBk, ulColor, Number(uiData.ulProgress), progColor);
  document.getElementById("pingText").textContent = format(uiData.pingStatus);
}

window.requestAnimationFrame = window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  function(cb){ setTimeout(cb,1000/60) };

function frame() {
  requestAnimationFrame(frame);
  updateUI();
}
