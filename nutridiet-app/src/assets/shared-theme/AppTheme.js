import * as React from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { inputsCustomizations } from './customizations/inputs.js';
import { dataDisplayCustomizations } from './customizations/dataDisplay.js';
import { feedbackCustomizations } from './customizations/feedback.js';
import { navigationCustomizations } from './customizations/navigation.js';
import { surfacesCustomizations } from './customizations/surfaces.js';
import { colorSchemes, typography, shadows, shape, brand } from './themePrimitives.js';

function AppTheme(props) {
    const { children, disableCustomTheme, themeComponents } = props;
    const theme = React.useMemo(() => {
        return disableCustomTheme
            ? {}
            : createTheme({
                cssVariables: {
                    colorSchemeSelector: 'data-mui-color-scheme',
                    cssVarPrefix: 'template',
                },
                colorSchemes: {
                    ...colorSchemes,
                    light: {
                        ...colorSchemes?.light,
                        palette: {
                            ...colorSchemes?.light?.palette,
                            primary: {
                                main: '#4CAF50',
                                contrastText: '#ffffff',
                            },
                        },
                    },
                    dark: {
                        ...colorSchemes?.dark,
                        palette: {
                            ...colorSchemes?.dark?.palette,
                            primary: {
                                main: '#66BB6A',
                                contrastText: '#ffffff',
                            },
                        },
                    },
                },
                typography,
                shadows,
                shape,
                components: {
                    ...inputsCustomizations,
                    ...dataDisplayCustomizations,
                    ...feedbackCustomizations,
                    ...navigationCustomizations,
                    ...surfacesCustomizations, 
                    ...themeComponents,
                    // 🔥 REGLAS PARA FORZAR EL FONDO OSCURO EN CONTENEDORES 🔥
                    MuiPaper: {
                        styleOverrides: {
                            root: ({ theme }) => ({
                                backgroundColor: theme.palette.background.paper,
                            }),
                        },
                    },
                    MuiCard: {
                        styleOverrides: {
                            root: ({ theme }) => ({
                                backgroundColor: theme.palette.background.paper,
                            }),
                        },
                    },
                    MuiAccordion: {
                        styleOverrides: {
                            root: ({ theme }) => ({
                                backgroundColor: theme.palette.background.paper,
                            }),
                        },
                    },
                    // ---------------------------------------------------------
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                borderRadius: 8,
                            },
                            containedPrimary: ({ theme }) => ({
                                backgroundColor: '#2E7D32',
                                '&:hover': {
                                    backgroundColor: '#1B5E20',
                                },
                                '&.Mui-disabled': {
                                    color: theme.palette.text.disabled,
                                    backgroundColor: theme.palette.action.disabledBackground,
                                    opacity: 0.8, 
                                },
                            }),
                        },
                    },
                    MuiInputLabel: {
                        styleOverrides: {
                            root: ({ theme }) => ({
                                paddingLeft: '4px',
                                paddingRight: '4px',
                                marginLeft: '-4px',
                                backgroundColor: theme.palette.background.default, 
                                ...theme.applyStyles('dark', {
                                    backgroundColor: theme.palette.background.default,
                                }),
                                '&.MuiInputLabel-shrink': {
                                    margin: '0',
                                    zIndex: 1,
                                },
                            }),
                        },
                    },
                    MuiOutlinedInput: {
                        styleOverrides: {
                            notchedOutline: {
                                '& legend': {
                                    fontSize: '0.85em',
                                },
                            },
                        },
                    },
                },
            });
    }, [disableCustomTheme, themeComponents]);

    if (disableCustomTheme) {
        return <React.Fragment>{children}</React.Fragment>;
    }
    return (
        <ThemeProvider theme={theme} disableTransitionOnChange>
            {children}
        </ThemeProvider>
    );
}

AppTheme.propTypes = {
    children: PropTypes.node,
    disableCustomTheme: PropTypes.bool,
    themeComponents: PropTypes.object,
};

export default AppTheme;