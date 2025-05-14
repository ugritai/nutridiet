import React from "react";
import logo from "../logo.png"; // Ajusta la ruta si es diferente

const Logo = ({ style }) => {
    return (
      <img
        src={logo}
        alt="NutriDiet logo"
        style={{
          width: 32,
          height: 32,
          minWidth: 32, // 防止压缩
          ...style
        }}
      />
    );
  };

export default Logo;
