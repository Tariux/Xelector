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

window.addEventListener('DOMContentLoaded', function () {
  $('newProfile').addEventListener('click', newProfile);
  $('deleteProfile').addEventListener('click', deleteProfile);
  $('saveProfile').addEventListener('click', saveCurrentProfile);
  $('addSelector').addEventListener('click', addSelector);

  loadProfiles().then(render).catch(function (error) {
    setStatus(error.message, true);
  });
});