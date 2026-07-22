export function makeSeedCadets() {
  const today = new Date().toISOString().slice(0, 10);
  return [
    {
      id: 'seed-1',
      firstName: 'Example',
      lastName: 'Prospect',
      age: '13',
      grade: '8th',
      firstContactDate: today,
      welcomeEmailSent: '',
      meeting1Date: '',
      meeting2Date: '',
      thirdNightEmailSent: '',
      meeting3Date: '',
      parentName: 'Sample Parent',
      parentEmail: 'parent@example.com',
      parentPhone: '215-555-0100',
      cadetPhone: false,
      cadetEmail: false,
      notes: `[${today}] This is a sample record. Edit or delete it once you add real prospects.`,
      status: 'Active',
      archivedDate: '',
      lastTouched: today,
    },
  ];
}
