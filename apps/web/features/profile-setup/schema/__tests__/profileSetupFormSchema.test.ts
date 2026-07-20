import {
  futureDateNotAllowedMessage,
  maxLengthMessage,
  minDateMessage,
  requiredMessage,
} from '@repo/common';
import { describe, expect, test } from 'vitest';
import { profileSetupFormSchema } from '../profileSetupFormSchema';
// 全フィールドがバリデーションを通る基準値。各テストで1フィールドだけ上書きして使う
const validValues = {
  name: 'テストユーザー',
  gender: 'MALE',
  birthday: new Date('2000-01-01'),
  regionCode: '13',
};

describe('profileSetupFormSchema', () => {
  test('全フィールドが有効な値なら成功する', () => {
    const result = profileSetupFormSchema.safeParse(validValues);
    expect(result.success).toBe(true);
  });

  // nameフィールドのバリデーションテスト
  describe('name', () => {
    test('1文字なら成功する', () => {
      const result = profileSetupFormSchema.safeParse({ ...validValues, name: 'あ' });
      expect(result.success).toBe(true);
    });
    test('50文字なら成功する', () => {
      const result = profileSetupFormSchema.safeParse({ ...validValues, name: 'あ'.repeat(50) });
      expect(result.success).toBe(true);
    });
    test('空文字ならエラーになる', () => {
      const result = profileSetupFormSchema.safeParse({ ...validValues, name: '' });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        expect.objectContaining({ path: ['name'], message: requiredMessage }),
      ]);
    });
    test('51文字ならエラーになる', () => {
      const result = profileSetupFormSchema.safeParse({ ...validValues, name: 'あ'.repeat(51) });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        expect.objectContaining({ path: ['name'], message: maxLengthMessage(50) }),
      ]);
    });
  });

  // genderフィールドのバリデーションテスト
  describe('gender', () => {
    test('GENDER_OPTIONSに含まれる値なら成功する', () => {
      const result = profileSetupFormSchema.safeParse({ ...validValues, gender: 'FEMALE' });
      expect(result.success).toBe(true);
    });
    test('GENDER_OPTIONSに含まれない値ならエラーになる', () => {
      const result = profileSetupFormSchema.safeParse({ ...validValues, gender: 'TEST' });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([expect.objectContaining({ path: ['gender'] })]);
      // メッセージはZodデフォルト（日本語ロケール）に任せるため文言は検証せず、requiredMessage側の分岐に誤って入っていないことのみ確認する
      expect(result.error?.issues[0]?.message).not.toBe(requiredMessage);
    });
    test('undefinedならエラーになる', () => {
      const result = profileSetupFormSchema.safeParse({ ...validValues, gender: undefined });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        expect.objectContaining({ path: ['gender'], message: requiredMessage }),
      ]);
    });
  });

  // birthdayフィールドのバリデーションテスト
  describe('birthday', () => {
    test('現在時刻なら成功する', () => {
      const result = profileSetupFormSchema.safeParse({ ...validValues, birthday: new Date() });
      expect(result.success).toBe(true);
    });
    test('1900-01-01なら成功する', () => {
      const result = profileSetupFormSchema.safeParse({
        ...validValues,
        birthday: new Date('1900-01-01'),
      });
      expect(result.success).toBe(true);
    });
    test('1900-01-01より前ならエラーになる', () => {
      const result = profileSetupFormSchema.safeParse({
        ...validValues,
        birthday: new Date('1899-12-31'),
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        expect.objectContaining({ path: ['birthday'], message: minDateMessage('1900-01-01') }),
      ]);
    });
    test('未来の日付ならエラーになる', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const result = profileSetupFormSchema.safeParse({ ...validValues, birthday: tomorrow });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        expect.objectContaining({ path: ['birthday'], message: futureDateNotAllowedMessage }),
      ]);
    });
    test('undefinedならエラーになる', () => {
      const result = profileSetupFormSchema.safeParse({
        ...validValues,
        birthday: undefined,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        expect.objectContaining({ path: ['birthday'], message: requiredMessage }),
      ]);
    });
  });

  // regionCodeフィールドのバリデーション
  describe('regionCode', () => {
    test('REGION_OPTIONSに含まれる値なら成功する', () => {
      const result = profileSetupFormSchema.safeParse({ ...validValues, regionCode: '1' });
      expect(result.success).toBe(true);
    });
    test('REGION_OPTIONSに含まれない値ならエラーになる', () => {
      const result = profileSetupFormSchema.safeParse({ ...validValues, regionCode: '999' });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([expect.objectContaining({ path: ['regionCode'] })]);
      // メッセージはZodデフォルト（日本語ロケール）に任せるため文言は検証せず、requiredMessage側の分岐に誤って入っていないことのみ確認する
      expect(result.error?.issues[0]?.message).not.toBe(requiredMessage);
    });
    test('undefinedならエラーになる', () => {
      const result = profileSetupFormSchema.safeParse({ ...validValues, regionCode: undefined });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        expect.objectContaining({ path: ['regionCode'], message: requiredMessage }),
      ]);
    });
  });
});
