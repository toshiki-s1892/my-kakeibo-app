import { createLogger } from '@/server/lib/logger';

describe('createLogger', () => {
  describe('正常系', () => {
    test('fieldsに含めたlevelやrequestIdは、ログ出力に反映されない', () => {
      const spy = vi.spyOn(console, 'info');
      const logger = createLogger({
        requestId: 'realRequestId',
        method: 'GET',
        path: '/real/path',
      });

      // infoのログを作成（fieldsに含めた値は全て出力されない想定）
      logger.info(
        {
          level: 'debug',
          message: 'fakeMessage',
          requestId: 'fakeRequestId',
          method: 'POST',
          path: '/fake/path',
          timestamp: 'fakeTimestamp',
        },
        'realMessage'
      );

      // console.infoの最後の呼び出しを取得
      const [payload] = spy.mock.lastCall ?? [];
      const log = JSON.parse(payload);
      expect(log).toMatchObject({
        level: 'info',
        message: 'realMessage',
        requestId: 'realRequestId',
        method: 'GET',
        path: '/real/path',
      });
      expect(log.timestamp).not.toBe('fakeTimestamp');
    });
  });

  describe('異常系', () => {
    test('fieldsをJSONに変換できない場合、例外を投げずにfieldsを除いたログがserializeFailed付きで出力される', () => {
      const spy = vi.spyOn(console, 'warn');
      const logger = createLogger({
        requestId: 'realRequestId',
        method: 'GET',
        path: '/real/path',
      });

      // unserializableは、fieldsの中の「変換に失敗する値」を再現するために用意した、テスト用の任意のキー名
      // fieldsをJSONに変換できない場合、例外を投げずにcatchへ移るための値で出力には表示されないのが正しい
      expect(() =>
        logger.warn(
          {
            userId: 'realUserId',
            unserializable: {
              toJSON: () => {
                throw new Error('toJSON failed');
              },
            },
          },
          'realMessage'
        )
      ).not.toThrow();

      // console.warnの最後の呼び出しを取得
      const [payload] = spy.mock.lastCall ?? [];
      const log = JSON.parse(payload);
      // catchに落ちた場合、fieldsは丸ごと捨てられ、ログにはuserId・unserializableは出力されない
      expect(log).toMatchObject({
        level: 'warn',
        message: 'realMessage',
        requestId: 'realRequestId',
        method: 'GET',
        path: '/real/path',
        serializeFailed: true,
      });
      expect(log).not.toHaveProperty('userId');
      expect(log).not.toHaveProperty('unserializable');
    });
  });
});
