import { describe, expect, test } from 'vitest';
import {
  maxLengthMessage,
  maxNumberMessage,
  minDateMessage,
  minLengthMessage,
  minNumberMessage,
} from '../error-message';

describe('minLengthMessage', () => {
  test('渡した最小文字数を含むメッセージを返す', () => {
    expect(minLengthMessage(5)).toBe('5文字以上で入力してください');
  });
});

describe('maxLengthMessage', () => {
  test('渡した最大文字数を含むメッセージを返す', () => {
    expect(maxLengthMessage(10)).toBe('10文字以内で入力してください');
  });
});

describe('minDateMessage', () => {
  test('渡した日付を含むメッセージを返す', () => {
    expect(minDateMessage('1900-01-01')).toBe('1900-01-01以降の日付を入力してください');
  });
});

describe('minNumberMessage', () => {
  test('渡した最小値を含むメッセージを返す', () => {
    expect(minNumberMessage(5)).toBe('5以上の数値で入力してください');
  });
});

describe('maxNumberMessage', () => {
  test('渡した最大値を含むメッセージを返す', () => {
    expect(maxNumberMessage(10)).toBe('10以内の数値で入力してください');
  });
});
