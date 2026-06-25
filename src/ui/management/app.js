let profiles = [];
let selectedProfileId = null;

function $(id) {
  return document.getElementById(id);
}

function createId() {
  return 'profile-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function setStatus(message, isError) {
  const status = $('statusText');
  status.textContent = message || '';
  status.classList.toggle('error', Boolean(isError));
}

function defaultProfile() {
  return {
    autoCopy: true,
    id: createId(),
    matchPattern: '',
    name: 'New profile',
    outputFormat: 'markdown',
    selectors: [
      { attribute: 'text', multiple: false, name: 'title', selector: 'h1' }
    ],
    template: ''
  };
}

function selectedProfile() {
  return profiles.find(function (profile) {
    return profile.id === selectedProfileId;
  }) || null;
}

async function saveProfiles() {
  await chrome.storage.local.set({ profiles: profiles });
}

async function loadProfiles() {
  const result = await chrome.storage.local.get({ profiles: [], lastExtraction: null });
  profiles = Array.isArray(result.profiles) ? result.profiles : [];

  if (!profiles.length) {
    profiles.push(defaultProfile());
    await saveProfiles();
  }

  selectedProfileId = profiles[0].id;
  $('lastOutput').value = result.lastExtraction && result.lastExtraction.text ? result.lastExtraction.text : '';
}

function renderProfileList() {
  const list = $('profileList');
  list.textContent = '';

  profiles.forEach(function (profile) {
    const button = document.createElement('button');
    button.className = profile.id === selectedProfileId ? 'profile-item active' : 'profile-item';
    button.type = 'button';
    button.textContent = profile.name || 'Untitled profile';
    button.addEventListener('click', function () {
      selectedProfileId = profile.id;
      render();
    });
    list.appendChild(button);
  });
}

function selectorRow(selector) {
  const fragment = $('selectorTemplate').content.cloneNode(true);
  const row = fragment.querySelector('.selector-row');
  fragment.querySelector('.selector-name').value = selector.name || '';
  fragment.querySelector('.selector-css').value = selector.selector || '';
  fragment.querySelector('.selector-attribute').value = selector.attribute || 'text';
  fragment.querySelector('.selector-multiple').checked = Boolean(selector.multiple);
  fragment.querySelector('.remove-selector').addEventListener('click', function () {
    row.remove();
  });
  return fragment;
}

function renderEditor() {
  const profile = selectedProfile();

  if (!profile) {
    return;
  }

  $('profileName').value = profile.name || '';
  $('matchPattern').value = profile.matchPattern || '';
  $('autoCopy').checked = profile.autoCopy !== false;
  $('outputFormat').value = profile.outputFormat || 'text';
  $('template').value = profile.template || '';

  const selectorList = $('selectorList');
  selectorList.textContent = '';
  (profile.selectors || []).forEach(function (selector) {
    selectorList.appendChild(selectorRow(selector));
  });
}

function render() {
  renderProfileList();
  renderEditor();
}

function collectSelectors() {
  return Array.from(document.querySelectorAll('.selector-row')).map(function (row) {
    return {
      attribute: row.querySelector('.selector-attribute').value,
      multiple: row.querySelector('.selector-multiple').checked,
      name: row.querySelector('.selector-name').value.trim(),
      selector: row.querySelector('.selector-css').value.trim()
    };
  }).filter(function (selector) {
    return selector.name && selector.selector;
  });
}

function collectProfile() {
  return {
    autoCopy: $('autoCopy').checked,
    id: selectedProfileId || createId(),
    matchPattern: $('matchPattern').value.trim(),
    name: $('profileName').value.trim() || 'Untitled profile',
    outputFormat: $('outputFormat').value,
    selectors: collectSelectors(),
    template: $('template').value
  };
}

async function saveCurrentProfile() {
  const nextProfile = collectProfile();

  if (!nextProfile.matchPattern) {
    setStatus('A URL match pattern is required.', true);
    return false;
  }

  if (!nextProfile.selectors.length) {
    setStatus('Add at least one named selector.', true);
    return false;
  }

  const index = profiles.findIndex(function (profile) {
    return profile.id === nextProfile.id;
  });

  if (index === -1) {
    profiles.push(nextProfile);
  } else {
    profiles[index] = nextProfile;
  }

  await saveProfiles();
  setStatus('Profile saved.');
  render();
  return true;
}

async function newProfile() {
  const profile = defaultProfile();
  profiles.push(profile);
  selectedProfileId = profile.id;
  await saveProfiles();
  setStatus('New profile created.');
  render();
}

async function deleteProfile() {
  if (profiles.length === 1) {
    profiles = [defaultProfile()];
  } else {
    profiles = profiles.filter(function (profile) {
      return profile.id !== selectedProfileId;
    });
  }

  selectedProfileId = profiles[0].id;
  await saveProfiles();
  setStatus('Profile deleted.');
  render();
}

function addSelector() {
  $('selectorList').appendChild(selectorRow({ attribute: 'text', multiple: false, name: '', selector: '' }));
}

async function exportProfiles() {
  const data = JSON.stringify(profiles, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'xelector-profiles-' + new Date().toISOString().slice(0, 10) + '.json';
  link.click();
  URL.revokeObjectURL(url);

  try {
    await navigator.clipboard.writeText(data);
    setStatus('Profiles exported as file and copied to clipboard.');
  } catch (e) {
    setStatus('Profiles exported as file.');
  }
}

async function importProfiles() {
  const input = $('importFile');
  const file = input.files && input.files[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const imported = JSON.parse(text);
    if (!Array.isArray(imported)) {
      throw new Error('Invalid format: expected an array of profiles.');
    }

    const existingIds = new Set(profiles.map(function (p) { return p.id; }));
    const now = Date.now();
    let added = 0;
    let updated = 0;

    imported.forEach(function (profile) {
      if (!Array.isArray(profile.selectors)) {
        return;
      }

      if (profile.id && existingIds.has(profile.id)) {
        const index = profiles.findIndex(function (p) { return p.id === profile.id; });
        if (index >= 0) {
          profiles[index] = Object.assign({}, profiles[index], profile, { updatedAt: now });
        }
        updated++;
      } else {
        profile.id = 'profile-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 8);
        profile.createdAt = profile.createdAt || now;
        profiles.push(profile);
        added++;
      }

      existingIds.add(profile.id);
    });

    await saveProfiles();
    setStatus('Import complete: ' + added + ' added, ' + updated + ' updated.');
    render();
  } catch (error) {
    setStatus('Import failed: ' + error.message, true);
  }

  input.value = '';
}

window.addEventListener('DOMContentLoaded', function () {
  $('newProfile').addEventListener('click', newProfile);
  $('deleteProfile').addEventListener('click', deleteProfile);
  $('saveProfile').addEventListener('click', saveCurrentProfile);
  $('addSelector').addEventListener('click', addSelector);
  $('exportProfiles').addEventListener('click', exportProfiles);
  $('importProfiles').addEventListener('click', function () {
    $('importFile').click();
  });
  $('importFile').addEventListener('change', importProfiles);

  loadProfiles().then(render).catch(function (error) {
    setStatus(error.message, true);
  });
});