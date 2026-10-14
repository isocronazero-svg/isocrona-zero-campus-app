import assert from 'node:assert/strict';
import {
  addInstructorSelection,
  buildInstructorPickerModel,
  getInstructorAssociateLabel,
  normalizeInstructorSelection,
  removeInstructorSelection
} from '../public/assets/js/app/campus/instructorPicker.js';

const associates = [
  { id:'a1', firstName:'Ana', lastName:'Uno', associateNumber:11, instructorEnabled:true },
  { id:'a2', firstName:'Beto', lastName:'Dos', associateNumber:12, instructorEnabled:true },
  { id:'a3', firstName:'Carla', lastName:'Tres', associateNumber:13, instructorEnabled:true },
  { id:'a4', firstName:'Dani', lastName:'Cuatro', associateNumber:14, instructorEnabled:true },
  { id:'historical', firstName:'Eva', lastName:'Historica', associateNumber:15, instructorEnabled:false },
  { id:'legacy', firstName:'Felix', lastName:'Legacy', associateNumber:16 },
  { id:'unnamed', firstName:'', lastName:'', instructorEnabled:true }
];

assert.equal(getInstructorAssociateLabel(associates[0]), 'Ana Uno · Socio nº 11');
assert.deepEqual(normalizeInstructorSelection(['a1','a1','','a2']), ['a1','a2']);

let selected = [];
for (const id of ['a1','a2','a3','a4']) selected = addInstructorSelection(associates, selected, id);
assert.deepEqual(selected, ['a1','a2','a3','a4'], '1/2/3/4 instructors can be added incrementally');
assert.deepEqual(addInstructorSelection(associates, selected, 'a4'), selected, 'duplicates are ignored');
assert.deepEqual(addInstructorSelection(associates, selected, 'historical'), selected, 'disabled instructor cannot be added');
assert.deepEqual(addInstructorSelection(associates, selected, 'legacy'), selected, 'legacy associate without flag cannot be added');
assert.deepEqual(addInstructorSelection(associates, selected, 'unnamed'), selected, 'enabled associate without name cannot be added');

selected = removeInstructorSelection(selected, 'a2');
assert.deepEqual(selected, ['a1','a3','a4'], 'removing one instructor preserves the others');

const model = buildInstructorPickerModel(associates, ['historical','a1','missing','a1']);
assert.deepEqual(model.selectedIds, ['historical','a1','missing']);
assert.equal(model.selectedItems.find(item => item.id === 'historical').historicalUnavailable, true);
assert.equal(model.selectedItems.find(item => item.id === 'a1').historicalUnavailable, false);
assert.equal(model.selectedItems.find(item => item.id === 'missing').missing, true);
assert.deepEqual(model.options.map(item => item.id), ['a2','a3','a4']);

console.log('Instructor picker PASS: eligible filtering, 1/2/3/4 additions, dedupe, remove-one preservation and historical visibility.');
