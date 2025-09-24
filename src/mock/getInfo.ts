import type { MockMethod } from "vite-plugin-mock";

export default [
  {
    url: "/api/getUserInfo", // url参数必须为string格式
    method: "get",
    response: () => {
      return "This is an example.";
    },
  },
  // 登录
  {
    url: "/api/login",
    method: "post",
    response: ({ body }: { body: { username: string; password: string } }) => {
      const { username, password } = body;
      if (username === "admin" && password === "123456") {
        return {
          code: 200,
          message: "登录成功",
          data: {
            token: "mock-token",
          },
        };
      } else {
        return {
          code: 401,
          message: "用户名或密码错误",
        };
      }
    },
  },
  // 验证token
  {
    url: "/api/verifyToken",
    method: "get",
    response: ({ query }: { query: { token: string } }) => {
      const { token } = query;
      if (token === "mock-token") {
        return {
          code: 200,
          message: "Token有效",
        };
      } else {
        return {
          code: 401,
          message: "Token无效",
        };
      }
    }
  }
] as MockMethod[];