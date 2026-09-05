import { describe, expect, it } from 'vitest';
import { TypedFormData } from './typedFormData';

describe('TypedFormData', () => {
  it('trims required string values', () => {
    const data = new FormData();
    data.append('name', '  Breakfast  ');

    expect(new TypedFormData(data).string('name')).toBe('Breakfast');
  });

  it('converts required numeric values', () => {
    const data = new FormData();
    data.append('kcal', ' 450.5 ');

    expect(new TypedFormData(data).number('kcal')).toBe(450.5);
  });

  it('converts optional numeric values and treats blanks as undefined', () => {
    const data = new FormData();
    data.append('blank', '   ');
    data.append('protein', ' 22.5 ');
    const form = new TypedFormData(data);

    expect(form.optionalNumber('blank')).toBeUndefined();
    expect(form.optionalNumber('protein')).toBe(22.5);
  });
  it('exposes the original FormData instance and its mutations', () => {
    const data = new FormData();
    const form = new TypedFormData(data);

    expect(form.raw()).toBe(data);

    form.raw().append('name', 'Breakfast');
    expect(form.string('name')).toBe('Breakfast');
  });

  it('rejects missing fields instead of treating them as text', () => {
    const form = new TypedFormData(new FormData());

    expect(() => form.string('name')).toThrowError('Expected form field "name" to contain text');
  });

  it('rejects file fields instead of treating them as text', () => {
    const data = new FormData();
    data.append('photo', new Blob(['image']), 'photo.txt');

    expect(() => new TypedFormData(data).string('photo')).toThrowError(
      'Expected form field "photo" to contain text',
    );
  });
});
