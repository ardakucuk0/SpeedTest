document.getElementById('startBtn').addEventListener('click', runTest);

async function runTest() {
  const out = document.getElementById('output');
  out.textContent = 'Starting speed test...\n';

  // Ping test (10 seconds)
  out.textContent += 'Running ping test...\n';
  let pingTimes = [];
  const pingEndTime = Date.now() + 10000;
  while (Date.now() < pingEndTime) {
    const start = performance.now();
    await fetch('ping.php');
    const end = performance.now();
    pingTimes.push(end - start);
    await new Promise(r => setTimeout(r, 500));
  }
  const avgPing = pingTimes.reduce((a, b) => a + b, 0) / pingTimes.length;

  // Download test (20 seconds)
  out.textContent += 'Running download test...\n';
  let downloadedBytes = 0;
  const downloadEndTime = Date.now() + 20000;
  while (Date.now() < downloadEndTime) {
    const start = performance.now();
    const res = await fetch('download.php');
    const blob = await res.blob();
    const end = performance.now();
    downloadedBytes += blob.size;
  }
  const totalDownloadMB = downloadedBytes / (1024 * 1024);
  const avgDownloadMbps = (totalDownloadMB * 8) / 20;

  // Upload test (20 seconds)
  out.textContent += 'Running upload test...\n';
  let uploadedBytes = 0;
  const uploadEndTime = Date.now() + 20000;
  const chunk = new Blob([new Uint8Array(5 * 1024 * 1024)]); // 5MB
  while (Date.now() < uploadEndTime) {
    await fetch('upload.php', { method: 'POST', body: chunk });
    uploadedBytes += chunk.size;
  }
  const totalUploadMB = uploadedBytes / (1024 * 1024);
  const avgUploadMbps = (totalUploadMB * 8) / 20;

  // Final output
  out.textContent =
    `Ping Test: ${avgPing.toFixed(1)} ms (avg over ${pingTimes.length} pings)\n` +
    `Download Test: ${avgDownloadMbps.toFixed(2)} Mbps (Downloaded: ${totalDownloadMB.toFixed(2)} MB)\n` +
    `Upload Test: ${avgUploadMbps.toFixed(2)} Mbps (Uploaded: ${totalUploadMB.toFixed(2)} MB)\n` +
    `\nTest complete.`;
}