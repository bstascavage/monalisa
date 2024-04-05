import React from "react";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import SvgIcon from "@mui/material/SvgIcon";
import { createTheme, ThemeProvider } from "@mui/material/styles";

function Banner(props) {
  const theme = createTheme({
    palette: {
      banner: {
        // main: "#f8f9fa",
        light: "#E9DB5D",
        dark: "#A29415",
        contrastText: "#242105",
      },
    },
  });

  let banner = (
    <Box sx={{ flexGrow: 1 }}>
      <ThemeProvider theme={theme}>
        <AppBar position="static" color="banner">
          <Toolbar className="mona-lisa-banner">
            <SvgIcon component={props.logo} inheritViewBox></SvgIcon>
          </Toolbar>
        </AppBar>
      </ThemeProvider>
    </Box>
  );
  return <React.Fragment>{banner}</React.Fragment>;
}

export default Banner;
