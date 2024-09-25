import { expect } from 'chai';
import splitObject from './split-object';
import { merge } from 'lodash';

describe('splitObject', () => {
  it('should split a large object into smaller ones', () => {
    const input = {
      key1: 'value1',
      key2: {
        subkey1: 'subvalue1',
        subkey2: 'subvalue2',
      },
      key3: 'value3',
      key4: {
        subkey3: {
          subsubkey1: 'subsubvalue1',
          subsubkey2: 'subsubvalue2',
        },
      },
    };

    const result = splitObject(input, 3);

    expect(result.length).to.be.greaterThan(1);

    const reconstructed = result.reduce((acc, patch) => merge({}, acc, patch), {});
    expect(reconstructed).to.deep.equal(input);
  });

  it('should handle nested objects that exceed maxProperties', () => {
    const input = {
      key1: {
        subkey1: 'value1',
        subkey2: 'value2',
        subkey3: 'value3',
        subkey4: 'value4',
      },
    };

    const result = splitObject(input, 2);

    expect(result.length).to.be.greaterThan(1);

    const reconstructed = result.reduce((acc, patch) => merge({}, acc, patch), {});
    expect(reconstructed).to.deep.equal(input);
  });
});
