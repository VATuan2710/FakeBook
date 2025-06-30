import axios from "axios";

export const login = (email, password) => async (dispatch) => {
  try {
    const res = await axios.post("/api/auth/login", { email, password });
    dispatch({ type: "LOGIN_SUCCESS", payload: res.data });
  } catch (err) {
    console.error(err.message);
  }
};

export const logout = () => ({ type: "LOGOUT" });
