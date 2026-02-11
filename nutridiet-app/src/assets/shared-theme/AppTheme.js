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
                // Sobrescribimos la paleta primaria para que sea el verde de NutriDiet
                colorSchemes: {
                    ...colorSchemes,
                    light: {
                        ...colorSchemes?.light,
                        palette: {
                            ...colorSchemes?.light?.palette,
                            primary: {
                                main: '#4CAF50', // El verde principal (puedes usar brand[500])
                                contrastText: '#ffffff',
                            },
                        },
                    },
                    dark: {
                        ...colorSchemes?.dark,
                        palette: {
                            ...colorSchemes?.dark?.palette,
                            primary: {
                                main: '#66BB6A', // Verde un poco más claro para modo oscuro
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
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                borderRadius: 8, // Botones un poco más redondeados para suavizar el diseño
                            },
                            containedPrimary: {
                                backgroundColor: '#2E7D32', // Verde oscuro para el estado normal
                                '&:hover': {
                                    backgroundColor: '#1B5E20', // Verde más oscuro al pasar el ratón
                                },
                                '&.Mui-disabled': {
                                    color: brand[50], 
                                    backgroundColor: '#A5D6A7', // Verde muy pálido cuando está deshabilitado
                                    opacity: 0.7, 
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