import instance from ".";

export const registerAccount = async (dataBody) => {
  try {
    const { data } = await instance.post("/auth/register", dataBody);
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const loginAccount = async (dataBody) => {
  try {
    const { data } = await instance.post("/auth/login", dataBody);
    return data;
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error.response?.data || error.message);
    throw error;
  }
};

export const getUserInfo = async () => {
  try {
    const { data } = await instance.get("/auth/userinfo");
    return data.user;
  } catch (error) {
    console.error(
      "Lỗi khi lấy thông tin người dùng:",
      error.response?.data || error.message
    );
    throw error;
  }
};
