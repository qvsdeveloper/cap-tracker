const FIELD_LABELS = {
  firstName: 'First name',
  lastName: 'Last name',
  age: 'Age',
  grade: 'Grade',
  firstContactDate: 'First contact',
  welcomeEmailSent: 'Welcome email',
  meeting1Date: 'Meeting 1',
  meeting2Date: 'Meeting 2',
  thirdNightEmailSent: '3rd night email',
  meeting3Date: 'Meeting 3',
  parentName: 'Parent name',
  parentEmail: 'Parent email',
  parentPhone: 'Parent phone',
  cadetPhone: 'Cadet phone',
  cadetEmail: 'Cadet email',
  notes: 'Notes',
  status: 'Status',
  archivedDate: 'Archived date',
  lastTouched: 'Last touched',
};

function cadetName(cadet) {
  return `${cadet.firstName || ''} ${cadet.lastName || ''}`.trim() || 'Unnamed cadet';
}

function fieldLabel(key) {
  return FIELD_LABELS[key] || key;
}

// Compares two cadet lists by id and returns a list of per-cadet changes:
// added (in remote only), removed (in local only), or modified (differing fields).
// Identical cadets are omitted so the caller only has to render real changes.
export function diffCadetLists(local, remote) {
  const localById = new Map(local.map((c) => [c.id, c]));
  const remoteById = new Map(remote.map((c) => [c.id, c]));
  const ids = new Set([...localById.keys(), ...remoteById.keys()]);
  const diffs = [];

  for (const id of ids) {
    const localCadet = localById.get(id);
    const remoteCadet = remoteById.get(id);

    if (localCadet && !remoteCadet) {
      diffs.push({ id, type: 'removed', name: cadetName(localCadet), cadet: localCadet });
      continue;
    }
    if (!localCadet && remoteCadet) {
      diffs.push({ id, type: 'added', name: cadetName(remoteCadet), cadet: remoteCadet });
      continue;
    }

    const keys = new Set([...Object.keys(localCadet), ...Object.keys(remoteCadet)]);
    const fields = [];
    for (const key of keys) {
      if (key === 'id') continue;
      if (localCadet[key] !== remoteCadet[key]) {
        fields.push({ key, label: fieldLabel(key), from: localCadet[key], to: remoteCadet[key] });
      }
    }
    if (fields.length > 0) {
      diffs.push({ id, type: 'modified', name: cadetName(remoteCadet), cadet: remoteCadet, fields });
    }
  }

  return diffs;
}
