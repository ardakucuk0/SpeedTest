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
  summary.textContent = `Running Ping Test...\n`;
  let pingTimes = [];
  const pingEnd = Date.now() + 10000;
  while (Date.now() < pingEnd) {
    const start = performance.now();
    await fetch('ping.php');
    const end = performance.now();
    const ping = end - start;
    pingTimes.push(ping);
    pingValue.textContent = `${ping.toFixed(1)} ms`;
    summary.textContent = `Running Ping Test...\nCurrent: ${ping.toFixed(1)} ms`;
    await new Promise(r => setTimeout(r, 100));
  }
  const avgPing = pingTimes.reduce((a, b) => a + b, 0) / pingTimes.length;
  summary.textContent = `Ping Test Complete: ${avgPing.toFixed(1)} ms\nRunning Download Test...\n`;

  // Download Test (20s)
  downloadGauge.classList.remove('hidden');
  const avgDownloadMbps = await runDownloadTest();

  // Upload Test (20s)
  uploadGauge.classList.remove('hidden');
  summary.textContent = `Download Test Complete: ${avgDownloadMbps.toFixed(2)} Mbps\nRunning Upload Test...\n`;
  const avgUploadMbps = await runUploadTest();

  // Final Summary
  summary.textContent =
    `Final Results:\n` +
    `Ping: ${avgPing.toFixed(1)} ms (avg over ${pingTimes.length} pings)\n` +
    `Download: ${avgDownloadMbps.toFixed(2)} Mbps\n` +
    `Upload: ${avgUploadMbps.toFixed(2)} Mbps`;
}

async function runDownloadTest() {
  const duration = 20000;
  const startTime = Date.now();
  let bytesReceived = 0;

  while (Date.now() - startTime < duration) {
    const response = await fetch(`download.php?nocache=${Math.random()}`);
    const reader = response.body.getReader();

    while (Date.now() - startTime < duration) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesReceived += value.length;
      const elapsed = (Date.now() - startTime) / 1000;
      const speedMbps = (bytesReceived * 8) / (elapsed * 1024 * 1024);
      document.getElementById('downloadValue').textContent = `${speedMbps.toFixed(2)} Mbps`;
      document.getElementById('summary').textContent = `Download Test...\nCurrent: ${speedMbps.toFixed(2)} Mbps`;
    }
  }

  const elapsed = (Date.now() - startTime) / 1000;
  return (bytesReceived * 8) / (elapsed * 1024 * 1024);
}

async function runUploadTest() {
  const duration = 20000;
  const startTime = Date.now();
  let uploadedBytes = 0;

  const chunkSize = 2 * 1024 * 1024; // 2 MB
  const chunk = new Blob([new Uint8Array(chunkSize)]);

  while (Date.now() - startTime < duration) {
    const promises = Array.from({ length: 3 }).map(() =>
      fetch('upload.php', { method: 'POST', body: chunk })
    );
    await Promise.all(promises);

    uploadedBytes += chunkSize * promises.length;
    const elapsed = (Date.now() - startTime) / 1000;
    const speedMbps = (uploadedBytes * 8) / (elapsed * 1024 * 1024);
    document.getElementById('uploadValue').textContent = `${speedMbps.toFixed(2)} Mbps`;
    document.getElementById('summary').textContent = `Upload Test...\nCurrent: ${speedMbps.toFixed(2)} Mbps`;
  }

  const elapsed = (Date.now() - startTime) / 1000;
  return (uploadedBytes * 8) / (elapsed * 1024 * 1024);
}