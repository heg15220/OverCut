import React from "react";
import "./UserAvatar.css";

const colors = [
  "#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#845EC2", "#F9A826", "#00C9A7"
];

const getColorFromName = (name) => {
  const charCode = name.charCodeAt(0);
  return colors[charCode % colors.length];
};

const UserAvatar = ({ image, userName, size = 40 }) => {
  if (image) {
    const imageUrl = `data:image/png;base64,${image}`;
    return <img src={imageUrl} alt={userName} className="user-avatar" style={{ width: size, height: size }} />;
  }

  const firstLetter = userName.charAt(0).toUpperCase();
  const backgroundColor = getColorFromName(userName);

  return (
    <div
      className="user-avatar-placeholder"
      style={{
        width: size,
        height: size,
        backgroundColor,
        fontSize: size / 2
      }}
    >
      {firstLetter}
    </div>
  );
};

export default UserAvatar;
