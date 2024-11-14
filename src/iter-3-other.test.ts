import { requestAdminAuthRegister, requestAdminAuthLogin, requestClear } from './helper';
const OK = 200;
const INPUT_ERROR = 400;
// Testing for clear

describe(' Clear ', () => {
  let res:any = requestAdminAuthRegister('firstlast@gmail.com', 'thisisAp4ssword', 'First', 'Last');
  expect(res.statusCode).toBe(OK);
  res = requestAdminAuthLogin('firstlast@gmail.com', 'thisisAp4ssword');
  expect(res.statusCode).toBe(OK);
  // Test if clear function working
  test('Testing clear function (1)', () => {
    res = requestClear();
    expect(res.statusCode).toBe(OK);
    expect(JSON.parse(res.body as string)).toStrictEqual({});
    res = requestAdminAuthLogin('firstlast@gmail.com', 'thisisAp4ssword');
    expect(res.statusCode).toBe(INPUT_ERROR);
    const bodyObj:any = JSON.parse(res.body as string);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });
});
