const input = document.getElementById('profile');
const list = document.getElementById('seen');
const status = document.getElementById('status');

function flash(text) {
  status.textContent = text;
  setTimeout(() => { status.textContent = ''; }, 1800);
}

chrome.storage.local.get(['netflixDefaultProfile', 'netflixProfileName', 'netflixProfilesSeen'], (data) => {
  input.value = data.netflixDefaultProfile || data.netflixProfileName || '';
  (data.netflixProfilesSeen || []).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    list.appendChild(opt);
  });
});

document.getElementById('save').addEventListener('click', () => {
  const name = input.value.trim();
  if (!name) return flash('Enter a profile name');
  chrome.storage.local.set({ netflixDefaultProfile: name }, () => flash('Saved: ' + name));
});

document.getElementById('clear').addEventListener('click', () => {
  chrome.storage.local.remove(['netflixDefaultProfile', 'netflixProfileName'], () => {
    input.value = '';
    flash('Cleared');
  });
});

const logBox = document.getElementById('log');
function loadLog() {
  chrome.storage.local.get('debugLog', ({ debugLog }) => {
    logBox.value = (debugLog || []).join('\n');
    logBox.scrollTop = logBox.scrollHeight;
  });
}
loadLog();
document.getElementById('copy').addEventListener('click', () => {
  logBox.select();
  document.execCommand('copy');
  flash('Copied');
});
document.getElementById('clearlog').addEventListener('click', () => {
  chrome.storage.local.remove('debugLog', () => { logBox.value = ''; });
});
