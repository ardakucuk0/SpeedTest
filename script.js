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

  // Ping Test via WebSocket
  const avgPing = await runWebSocketPing();
  summary.textContent = `Ping test complete. Average: ${avgPing.toFixed(1)} ms\n`;

  // Download Test
  downloadGauge.classList.remove('hidden');
  const { avgMbps: avgDownloadMbps, totalMB: downloadMB } = await runDownloadTest();

  // Upload Test
  uploadGauge.classList.remove('hidden');
  const { avgMbps: avgUploadMbps, totalMB: uploadMB } = await runUploadTest();

  // Final Summary
  const totalDataMB = downloadMB + uploadMB;
  summary.textContent =
    `✅ Test Complete\n\n` +
    `📡 Ping: ${avgPing.toFixed(1)} ms\n` +
    `⬇️ Download: ${avgDownloadMbps.toFixed(2)} Mbps (${downloadMB.toFixed(2)} MB received)\n` +
    `⬆️ Upload: ${avgUploadMbps.toFixed(2)} Mbps (${uploadMB.toFixed(2)} MB sent)\n` +
    `📊 Total Data Used: ${totalDataMB.toFixed(2)} MB`;
}

async function runWebSocketPing() {
  return new Promise((resolve) => {
    const pingTimes = [];
    const ws = new WebSocket('wss://yourserver/ws'); // Replace with your actual WebSocket server URL

    ws.onopen = () => {
      let count = 0;
      const pingLoop = () => {
        const start = performance.now();
        ws.send('ping');
        ws.onmessage = () => {
          const end = performance.now();
          const ping = end - start;
          pingTimes.push(ping);
          document.getElementById('pingValue').textContent = `${ping.toFixed(1)} ms`;
          document.getElementById('summary').textContent = `Ping: ${ping.toFixed(1)} ms`;
          count++;
          if (count < 10) {
            setTimeout(pingLoop, 200);
          } else {
            ws.close();
            const avgPing = pingTimes.reduce((a, b) => a + b, 0) / pingTimes.length;
            resolve(avgPing);
          }
        };
      };
      pingLoop();
    };

    ws.onerror = () => {
      resolve(0); // fallback if WebSocket fails
    };
  });
}

async function runDownloadTest() {
  const duration = 2000;
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
      document.getElementById('summary').textContent = `Download: ${speedMbps.toFixed(2)} Mbps`;
    }
  }

  const elapsed = (Date.now() - startTime) / 1000;
  const avgMbps = (bytesReceived * 8) / (elapsed * 1024 * 1024);
  const totalMB = bytesReceived / (1024 * 1024);
  return { avgMbps, totalMB };
}

async function runUploadTest() {
  const duration = 2000;
  const startTime = Date.now();
  let uploadedBytes = 0;

  const chunkSize = 2 * 1024 * 1024;
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
    document.getElementById('summary').textContent = `Upload: ${speedMbps.toFixed(2)} Mbps`;
  }

  const elapsed = (Date.now() - startTime) / 1000;
  const avgMbps = (uploadedBytes * 8) / (elapsed * 1024 * 1024);
  const totalMB = uploadedBytes / (1024 * 1024);
  return { avgMbps, totalMB };
}
