let testState = -1;
let dlStatus = "";
let ulStatus = "";
let pingStatus = "";
let jitterStatus = "";
let dlProgress = 0;
let ulProgress = 0;
let pingProgress = 0;

// Byte counters
let dlBytes = 0;
let ulBytes = 0;

let settings = {
  test_order: "DPU", // Download, Ping, Upload
  time_ul_max: 15,
  time_dl_max: 15,
  time_auto: true,
  time_ulGraceTime: 3,
  time_dlGraceTime: 1.5,
  count_ping: 10,
  url_dl: "php/upload_download.php",
  url_ul: "php/pingsetc.php",
  url_ping: "php/pingsetc.php",
  xhr_dlMultistream: 6,
  xhr_ulMultistream: 3,
  xhr_multistreamDelay: 300,
  xhr_ignoreErrors: 1,
  xhr_dlUseBlob: false,
  xhr_ul_blob_megabytes: 20,
  garbagePhp_chunkSize: 100,
  ping_allowPerformanceApi: true,
  overheadCompensationFactor: 1.06,
  useMebibits: false
};

let xhr = null;
let interval = null;
let test_pointer = 0;
let runNextTest = null;

function url_sep(url) {
  return url.match(/\?/) ? "&" : "?";
}

function pushStatus() {
  postMessage(JSON.stringify({
    testState, dlStatus, ulStatus, pingStatus, jitterStatus,
    dlProgress, ulProgress, pingProgress,
    dlBytes, ulBytes
  }));
}

this.addEventListener("message", function(e) {
  let msg = e.data;
  // Allow JSON payload with URLs
  try {
    const obj = JSON.parse(msg);
    if (obj && obj.cmd === "start") {
      if (obj.url_dl) settings.url_dl = obj.url_dl;
      if (obj.url_ul) settings.url_ul = obj.url_ul;
      if (obj.url_ping) settings.url_ping = obj.url_ping;
      msg = "start";
    }
  } catch (_) {}

  const params = (typeof msg === "string") ? msg.split(" ") : [];
  if (params[0] === "status") {
    pushStatus();
    return;
  }
  if (params[0] === "start" && testState === -1) {
    testState = 0;
    test_pointer = 0;
    let dRun = false, uRun = false, pRun = false;
    runNextTest = function() {
      if (testState == 5) return;
      if (test_pointer >= settings.test_order.length) {
        testState = 4;
        pushStatus();
        return;
      }
      switch (settings.test_order.charAt(test_pointer)) {
        case "D":
          test_pointer++;
          if (dRun) { runNextTest(); return; }
          dRun = true;
          testState = 1;
          dlTest(runNextTest);
          break;
        case "U":
          test_pointer++;
          if (uRun) { runNextTest(); return; }
          uRun = true;
          testState = 3;
          ulTest(runNextTest);
          break;
        case "P":
          test_pointer++;
          if (pRun) { runNextTest(); return; }
          pRun = true;
          testState = 2;
          pingTest(runNextTest);
          break;
        default:
          test_pointer++;
      }
    };
    runNextTest();
    return;
  }
  if (params[0] === "abort") {
    if (testState >= 4) return;
    clearRequests();
    runNextTest = null;
    if (interval) clearInterval(interval);
    testState = 5;
    dlStatus = "";
    ulStatus = "";
    pingStatus = "";
    jitterStatus = "";
    dlProgress = 0;
    ulProgress = 0;
    pingProgress = 0;
    pushStatus();
    return;
  }
});

function clearRequests() {
  if (xhr) {
    for (let i = 0; i < xhr.length; i++) {
      try { xhr[i].onprogress = null; xhr[i].onload = null; xhr[i].onerror = null } catch (e) {}
      try { xhr[i].upload.onprogress = null; xhr[i].upload.onload = null; xhr[i].upload.onerror = null } catch (e) {}
      try { xhr[i].abort() } catch (e) {}
      try { delete xhr[i] } catch (e) {}
    }
    xhr = null;
  }
}

// PING
let ptCalled = false;
function pingTest(done) {
  if (ptCalled) return;
  ptCalled = true;

  let prevT = null, ping = 0.0, jitter = 0.0, i = 0, prevInstspd = 0;
  xhr = [];

  const doPing = function() {
    pingProgress = i / settings.count_ping;
    prevT = Date.now();
    xhr[0] = new XMLHttpRequest();

    xhr[0].onload = function() {
      if (i === 0) {
        prevT = Date.now();
      } else {
        let instspd = Date.now() - prevT;

        // Try to use Performance API for more accurate timing
        if (settings.ping_allowPerformanceApi) {
          try {
            let p = performance.getEntries();
            p = p[p.length - 1];
            let d = p.responseStart - p.requestStart;
            if (d <= 0) d = p.duration;
            if (d > 0 && d < instspd) instspd = d;
          } catch (e) {}
        }

        if (instspd < 1) instspd = prevInstspd;
        if (instspd < 1) instspd = 1;

        const instjitter = Math.abs(instspd - prevInstspd);
        if (i === 1) ping = instspd;
        else {
          if (instspd < ping) ping = instspd;
          if (i === 2) jitter = instjitter;
          else jitter = instjitter > jitter
            ? jitter * 0.3 + instjitter * 0.7
            : jitter * 0.8 + instjitter * 0.2;
        }
        prevInstspd = instspd;
      }

      pingStatus = ping.toFixed(2);
      jitterStatus = jitter.toFixed(2);
      i++;

      pushStatus();

      if (i < settings.count_ping) {
        doPing();
      } else {
        pingProgress = 1;
        pushStatus();
        done();
      }
    };

    xhr[0].onerror = function() {
      if (settings.xhr_ignoreErrors === 0) {
        pingStatus = "Fail";
        jitterStatus = "Fail";
        clearRequests();
        pingProgress = 1;
        pushStatus();
        done();
        return;
      }
      if (settings.xhr_ignoreErrors === 1) doPing();
      if (settings.xhr_ignoreErrors === 2) {
        i++;
        pushStatus();
        if (i < settings.count_ping) doPing();
        else {
          pingProgress = 1;
          pushStatus();
          done();
        }
      }
    };

    xhr[0].open("GET", settings.url_ping + url_sep(settings.url_ping) + "r=" + Math.random(), true);
    xhr[0].send();
  };

  doPing();
}

// DOWNLOAD
let dlCalled = false;
function dlTest(done) {
  if (dlCalled) return;
  dlCalled = true;
  let totLoaded = 0.0, startT = Date.now(), bonusT = 0, graceTimeDone = false, failed = false;
  xhr = [];
  const testStream = function(i, delay) {
    setTimeout(function() {
      if (testState !== 1) return;
      let prevLoaded = 0;
      let x = new XMLHttpRequest();
      xhr[i] = x;
      xhr[i].onprogress = function(event) {
        if (testState !== 1) { try { x.abort(); } catch (e) {} }
        const loadDiff = event.loaded <= 0 ? 0 : event.loaded - prevLoaded;
        if (isNaN(loadDiff) || !isFinite(loadDiff) || loadDiff < 0) return;
        totLoaded += loadDiff;
        dlBytes += loadDiff;   // accumulate download bytes
        prevLoaded = event.loaded;
      };
      xhr[i].onload = function() { try { xhr[i].abort(); } catch (e) {}; testStream(i, 0); };
      xhr[i].onerror = function() {
        if (settings.xhr_ignoreErrors === 0) failed = true;
        try { xhr[i].abort(); } catch (e) {}
        delete xhr[i];
        if (settings.xhr_ignoreErrors === 1) testStream(i, 0);
      };
      try { xhr[i].responseType = settings.xhr_dlUseBlob ? "blob" : "arraybuffer" } catch (e) {}
      xhr[i].open("GET", settings.url_dl + url_sep(settings.url_dl) + "r=" + Math.random() + "&ckSize=" + settings.garbagePhp_chunkSize, true);
      xhr[i].send();
    }, 1 + delay);
  };
  for (let i = 0; i < settings.xhr_dlMultistream; i++) {
    testStream(i, settings.xhr_multistreamDelay * i);
  }
  interval = setInterval(function() {
    const t = Date.now() - startT;
    if (graceTimeDone) dlProgress = (t + bonusT) / (settings.time_dl_max * 1000);
    if (t < 200) return;
    if (!graceTimeDone) {
      if (t > 1000 * settings.time_dlGraceTime) {
        if (totLoaded > 0) {
          startT = Date.now();
          bonusT = 0;
          totLoaded = 0.0;
        }
        graceTimeDone = true;
      }
    } else {
      const speed = totLoaded / (t / 1000.0);
      if (settings.time_auto) {
        const bonus = (5.0 * speed) / 100000;
        bonusT += bonus > 400 ? 400 : bonus;
      }
      dlStatus = ((speed * 8 * settings.overheadCompensationFactor) /
                  (settings.useMebibits ? 1048576 : 1000000)).toFixed(2);

      pushStatus();

      if ((t + bonusT) / 1000.0 > settings.time_dl_max || failed) {
        if (failed || isNaN(Number(dlStatus))) dlStatus = "Fail";
        clearRequests();
        clearInterval(interval);
        dlProgress = 1;
        pushStatus();
        done();
      }
    }
  }, 200);
}

// UPLOAD
let ulCalled = false;
function ulTest(done) {
  if (ulCalled) return;
  ulCalled = true;

  // Build a large random blob for upload
  let r = new ArrayBuffer(1048576);
  const maxInt = Math.pow(2, 32) - 1;
  try {
    r = new Uint32Array(r);
    for (let i = 0; i < r.length; i++) r[i] = Math.random() * maxInt;
  } catch (e) {}
  let req = [];
  for (let i = 0; i < settings.xhr_ul_blob_megabytes; i++) req.push(r);
  req = new Blob(req);

  // Smaller blob for variety
  r = new ArrayBuffer(262144);
  try {
    r = new Uint32Array(r);
    for (let i = 0; i < r.length; i++) r[i] = Math.random() * maxInt;
  } catch (e) {}
  let reqsmall = new Blob([r]);

  const testFunction = function() {
    let totLoaded = 0.0, startT = Date.now(), bonusT = 0,
        graceTimeDone = false, failed = false;
    xhr = [];

    const testStream = function(i, delay) {
      setTimeout(function() {
        if (testState !== 3) return;
        let prevLoaded = 0;
        let x = new XMLHttpRequest();
        xhr[i] = x;

        x.upload.onprogress = function(event) {
          if (testState !== 3) { try { x.abort(); } catch (e) {} }
          const loadDiff = event.loaded <= 0 ? 0 : event.loaded - prevLoaded;
          if (isNaN(loadDiff) || !isFinite(loadDiff) || loadDiff < 0) return;
          totLoaded += loadDiff;
          ulBytes += loadDiff;   // accumulate upload bytes
          prevLoaded = event.loaded;
        };

        x.upload.onload = function() {
          testStream(i, 0); // restart stream
        };

        x.upload.onerror = function() {
          if (settings.xhr_ignoreErrors === 0) failed = true;
          try { x.abort(); } catch (e) {}
          delete xhr[i];
          if (settings.xhr_ignoreErrors === 1) testStream(i, 0);
        };

        x.open("POST", settings.url_ul + url_sep(settings.url_ul) + "r=" + Math.random(), true);
        try { x.setRequestHeader("Content-Encoding", "identity"); } catch (e) {}
        x.send(req);
      }, delay);
    };

    for (let i = 0; i < settings.xhr_ulMultistream; i++) {
      testStream(i, settings.xhr_multistreamDelay * i);
    }

    interval = setInterval(function() {
      const t = Date.now() - startT;
      if (graceTimeDone) ulProgress = (t + bonusT) / (settings.time_ul_max * 1000);
      if (t < 200) return;

      if (!graceTimeDone) {
        if (t > 1000 * settings.time_ulGraceTime) {
          if (totLoaded > 0) {
            startT = Date.now();
            bonusT = 0;
            totLoaded = 0.0;
          }
          graceTimeDone = true;
        }
      } else {
        const speed = totLoaded / (t / 1000.0);
        if (settings.time_auto) {
          const bonus = (5.0 * speed) / 100000;
          bonusT += bonus > 400 ? 400 : bonus;
        }
        ulStatus = ((speed * 8 * settings.overheadCompensationFactor) /
                    (settings.useMebibits ? 1048576 : 1000000)).toFixed(2);

        pushStatus();

        if ((t + bonusT) / 1000.0 > settings.time_ul_max || failed) {
          if (failed || isNaN(Number(ulStatus))) ulStatus = "Fail";
          clearRequests();
          clearInterval(interval);
          ulProgress = 1;
          pushStatus();
          done();
        }
      }
    }, 200);
  };

  testFunction();
}