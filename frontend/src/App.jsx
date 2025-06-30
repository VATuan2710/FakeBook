import { useState } from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import RegisterPage from "./pages/registerPage";
import LoginPage from "./pages/loginPage";
import NotFoundPage from "./pages/NotFoundPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import GroupPage from "./pages/GroupPage";
import VideoPage from "./pages/VideoPage";
function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Routes>
        {" "}
        <Route path="/" element={<HomePage />} />
        <Route path="/group" element={<GroupPage />} />
        <Route path="/video" element={<VideoPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
