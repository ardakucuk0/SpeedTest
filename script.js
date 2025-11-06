document.getElementById('startBtn').addEventListener('click', runTest);

async function runTest() {
  const pingGauge = document.getElementById('pingGauge');
  const downloadGauge = document.getElementById('downloadGauge');
  const uploadGauge = document.getElementById('uploadGauge');

  const pingValue = document.getElementById('pingValue');
  const downloadValue = document.getElementById('downloadValue');
  const uploadValue = document.getElementById('uploadValue');
  const summary = document.getElementById('summary');

  // Reset UI
  pingValue.textContent = '-- ms';
  downloadValue.textContent = '-- Mbps';
  uploadValue.textContent = '-- Mbps';
  summary.textContent = '';
  pingGauge.classList.remove('hidden');
  downloadGauge.classList.add('hidden');
  uploadGauge.classList.add('hidden');

  // Ping Test (10s)
  let pingTimes = [];
  const pingEnd = Date.now() + 10000;
  while (Date.now() < pingEnd) {
    const start = performance.now();
    await fetch('ping.php');
    const end = performance.now();
    const ping = end - start;
    pingTimes.push(ping);
    pingValue.textContent = `${ping.toFixed(1)} ms`;
    await new Promise(r => setTimeout(r, 500));
  }
  const avgPing = pingTimes.reduce((a, b) => a + b, 0) / pingTimes.length;

  // Download Test (20s)
  downloadGauge.classList.remove('hidden');
  const avgDownloadMbps = await runDownloadTest();

  // Upload Test (20s)
  uploadGauge.classList.remove('hidden');
  const avgUploadMbps = await runUploadTest();

  // Final Summary
  summary.textContent =
    `Final Results:\n` +
    `Ping: ${avgPing.toFixed(1)} ms (avg over ${pingTimes.length} pings)\n` +
    `Download: ${avgDownloadMbps.toFixed(2)} Mbps\n` +
    `Upload: ${avgUploadMbps.toFixed(2)} Mbps`;
}

async function runDownloadTest() {
  const controller = new AbortController();
  const signal = controller.signal;
  const startTime = Date.now();
  let bytesReceived = 0;

  const response = await fetch('download.php', { signal });
  const reader = response.body.getReader();

  const timer = setTimeout(() => controller.abort(), 20000); // stop after 20s

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesReceived += value.length;

      const elapsed = (Date.now() - startTime) / 1000;
      const speedMbps = (bytesReceived * 8) / (elapsed * 1024 * 1024);
      document.getElementById('downloadValue').textContent = `${speedMbps.toFixed(2)} Mbps`;
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      // graceful exit
    } else {
      console.error('Download error:', err);
    }
  }

  clearTimeout(timer);
  const elapsed = (Date.now() - startTime) / 1000;
  return (bytesReceived * 8) / (elapsed * 1024 * 1024);
}

async function runUploadTest() {
  const startTime = Date.now();
  let uploadedBytes = 0;
  const chunk = new Blob([new Uint8Array(5 * 1024 * 1024)]); // 5MB
  const uploadEnd = Date.now() + 20000;

  while (Date.now() < uploadEnd) {
    await fetch('upload.php', { method: 'POST', body: chunk });
    uploadedBytes += chunk.size;

    const elapsed = (Date.now() - startTime) / 1000;
    const speedMbps = (uploadedBytes * 8) / (elapsed * 1024 * 1024);
    document.getElementById('uploadValue').textContent = `${speedMbps.toFixed(2)} Mbps`;
  }

  const elapsed = (Date.now() - startTime) / 1000;
  return (uploadedBytes * 8) / (elapsed * 1024 * 1024);
}