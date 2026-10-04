// 他ユーザーが所有するリソースを指定された（IDOR試行）ことを示すエラー
export class ForeignResourceAccessError extends Error {
  constructor() {
    super('他ユーザーが所有するリソースへのアクセス');
    this.name = 'ForeignResourceAccessError';
  }
}
