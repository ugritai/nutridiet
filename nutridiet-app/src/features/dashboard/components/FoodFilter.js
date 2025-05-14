import React, { useState } from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Button,
    IconButton,
    Popover
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';

const FiltrosNutricionales = ({ filters, handleFilterChange, handleResetFilters }) => {
    const [anchorEl, setAnchorEl] = useState(null);

    const labels = {
        salt: 'Sodio',
        sug: 'Azúcares',
        total_fat: 'Grasa Total',
        trans: 'Grasas Trans'
    };

    const colors = {
        green: { label: 'Bajo', color: '#66BB6A' },
        yellow: { label: 'Moderado', color: '#FFEE58' },
        red: { label: 'Alto', color: '#EF5350' }
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'filtros-popover' : undefined;

    return (
        <>
            <IconButton
                aria-describedby={id}
                onClick={handleClick}
                size="large"
                sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    width: '100%',               // que ocupe todo el espacio asignado (2 columnas)
                    height: 40,                  // igual que el botón de búsqueda
                    borderRadius: 1,             // esquinas redondeadas
                    justifyContent: 'center'
                }}
            >
                <FilterListIcon />
            </IconButton>


            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { p: 2, width: 300 } }}
            >
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
                    Filtros Nutricionales
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                    {['salt', 'sug', 'total_fat', 'trans'].map((key) => (
                        <FormControl key={key} size="small" variant="outlined">
                            <InputLabel>{labels[key]}</InputLabel>
                            <Select
                                value={filters[key]}
                                onChange={(e) => handleFilterChange(key, e.target.value)}
                                label={labels[key]}
                            >
                                <MenuItem value=""><em>Todos</em></MenuItem>
                                {Object.keys(colors).map((color) => (
                                    <MenuItem key={color} value={color}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: colors[color].color }} />
                                            <Typography variant="body2">{colors[color].label}</Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    ))}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                    <Button
                        onClick={() => {
                            handleResetFilters();
                            handleClose();
                        }}
                        startIcon={<RefreshIcon fontSize="small" />}
                        size="small"
                        sx={{
                            textTransform: 'none',
                            color: 'text.secondary',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                                color: 'text.primary'
                            }
                        }}
                    >
                        Restablecer
                    </Button>
                </Box>
            </Popover>
        </>
    );
};

export default FiltrosNutricionales;
