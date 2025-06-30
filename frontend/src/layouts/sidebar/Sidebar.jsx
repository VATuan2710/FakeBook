import React from "react";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar__option"> Bạn bè</div>
      <div className="sidebar__option"> Nhóm</div>
      <div className="sidebar__option"> Messenger</div>
      <div className="sidebar__option"> Kỷ niệm</div>
      <div className="sidebar__option"> Video</div>
      <div className="sidebar__option"> Marketplace</div>
      <div className="sidebar__option"> Xem thêm</div>
    </div>
  );
};

export default Sidebar;
