import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { validateInstructorAssociateIds, buildInstructorCertificateModel } = require('../server/instructor-certificate');

const state = {
  settings: { certificateCity: 'Madrid' },
  associates: [
    { id: 'enabled-1', firstName: 'Ana', lastName: 'Uno', instructorEnabled: true },
    { id: 'enabled-2', firstName: 'Beto', lastName: 'Dos', instructorEnabled: true },
    { id: 'enabled-3', firstName: 'Carla', lastName: 'Tres', instructorEnabled: true },
    { id: 'enabled-4', firstName: 'Dani', lastName: 'Cuatro', instructorEnabled: true },
    { id: 'disabled', firstName: 'Eva', lastName: 'Historica', instructorEnabled: false },
    { id: 'legacy', firstName: 'Felix', lastName: 'Legacy' },
    { id: 'unnamed', firstName: '', lastName: '', instructorEnabled: true }
  ],
  courses: [
    {
      id: 'historical-course',
      title: 'Curso historico',
      status: 'Cerrado',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      hours: 8,
      instructorAssociateIds: ['disabled']
    }
  ]
};

for (const ids of [
  ['enabled-1'],
  ['enabled-1', 'enabled-2'],
  ['enabled-1', 'enabled-2', 'enabled-3'],
  ['enabled-1', 'enabled-2', 'enabled-3', 'enabled-4']
]) {
  assert.deepEqual(validateInstructorAssociateIds(state, ids), ids);
}

assert.throws(() => validateInstructorAssociateIds(state, ['disabled']), /habilitado/);
assert.throws(() => validateInstructorAssociateIds(state, ['legacy']), /habilitado/);
assert.throws(() => validateInstructorAssociateIds(state, ['unnamed']), /nombre/);
assert.throws(() => validateInstructorAssociateIds(state, ['enabled-1', 'enabled-1']), /socio/);
assert.throws(() => validateInstructorAssociateIds(state, ['missing']), /socio/);

assert.deepEqual(
  validateInstructorAssociateIds(state, ['disabled'], ['disabled']),
  ['disabled'],
  'A disabled instructor already assigned historically must be preserved'
);
assert.deepEqual(
  validateInstructorAssociateIds(state, ['disabled', 'enabled-1'], ['disabled']),
  ['disabled', 'enabled-1'],
  'Historical disabled assignment may coexist with a new enabled instructor'
);
assert.throws(
  () => validateInstructorAssociateIds(state, ['disabled', 'legacy'], ['disabled']),
  /habilitado/,
  'A legacy/disabled associate cannot be added as a new instructor'
);

const historicalCertificate = buildInstructorCertificateModel(
  state,
  'historical-course',
  'disabled',
  { dateRange: '1-2 enero 2026', issueDate: '3 enero 2026' }
);
assert.ok(historicalCertificate, 'Disabling an instructor later must not invalidate the historical certificate');
assert.equal(historicalCertificate.member.name, 'Eva Historica');

console.log('Instructor eligibility PASS: enabled-only new assignments, 1/2/3/4 instructors, dedupe, historical preservation and certificate continuity.');
