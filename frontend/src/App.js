import React, { useState, useMemo } from "react";

//Utils
import { createMuiTheme, ThemeProvider, CssBaseline, useMediaQuery } from "@material-ui/core";

//Styles
import "./assets/scss/app.scss";

//Pages
import Home from "./pages/Home";

//Components
import Header from "./components/Header";

const App = () => {
	const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
	const [page, setPage] = useState(0);
	const theme = useMemo(
		() =>
			createMuiTheme({
				palette: {
					type: prefersDarkMode ? "dark" : "light"
				}
			}),
		[prefersDarkMode]
	);

	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};
	const switchPage = () => {
		switch (page) {
			case 0:
				return <Home changePage={handleChangePage} />;
			default:
				return <h1>404 Page</h1>;
		}
	};

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />

			<Header />

			{switchPage()}
		</ThemeProvider>
	);
};

export default App;
