import * as React from 'react';
import {
    Box,
    Button,
    CssBaseline,
    Divider,
    FormLabel,
    FormControl,
    TextField,
    Typography,
    Stack,
    MenuItem,
    Modal,
} from '@mui/material';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from '../../../../assets/shared-theme/AppTheme';
import ColorModeSelect from '../../../../assets/shared-theme/ColorModeSelect';

const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    margin: 'auto',
    boxShadow:
        'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
    [theme.breakpoints.up('sm')]: {
        width: '450px',
    },
    ...theme.applyStyles('dark', {
        boxShadow:
            'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
    }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
    height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
    minHeight: '100%',
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(4),
    },
}));

export default function CrearPacienteForm({ open, onClose, onPacienteCreado }) {
    const [formValues, setFormValues] = React.useState({
        nombre: '',
        email: '',
        password: '',
        genero: '',
        fechaNacimiento: '',
        altura: '',
        peso: '',
        actividad: '',
    });

    const [formErrors, setFormErrors] = React.useState({});

    const handleChange = (field) => (event) => {
        setFormValues((prev) => ({
            ...prev,
            [field]: event.target.value,
        }));
        setFormErrors((prev) => ({
            ...prev,
            [field]: '',
        }));
    };

    const validate = () => {
        const errors = {};
        if (!formValues.nombre) errors.nombre = 'El nombre es obligatorio.';
        if (!formValues.email || !/\S+@\S+\.\S+/.test(formValues.email))
            errors.email = 'Ingrese un correo válido.';
        if (!formValues.password || formValues.password.length < 6)
            errors.password = 'La contraseña debe tener al menos 6 caracteres.';
        if (!formValues.genero) errors.genero = 'Seleccione un género.';
        if (!formValues.fechaNacimiento) errors.fechaNacimiento = 'Seleccione la fecha de nacimiento.';
        if (!formValues.altura || formValues.altura <= 0)
            errors.altura = 'Ingrese una altura válida.';
        if (!formValues.peso || formValues.peso <= 0)
            errors.peso = 'Ingrese un peso válido.';
        if (!formValues.actividad) errors.actividad = 'Seleccione un nivel de actividad.';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
    
        try {
            const token = localStorage.getItem('refreshToken');  // Ajusta esto según donde guardes el token
    
            const response = await fetch('http://localhost:8000/pacientes/crear_paciente/', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`  // <-- Aquí envías el token JWT
                },
                body: JSON.stringify(formValues),
            });
    
            if (response.ok) {
                const paciente = await response.json();
                onPacienteCreado?.(paciente);
                onClose();
            } else {
                const error = await response.json();
                alert(error.detail || 'Error al crear paciente');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('No se pudo conectar al servidor');
        }
    };
    
    return (
        <Modal open={open} onClose={onClose}>
            <AppTheme>
                <CssBaseline enableColorScheme />
                <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
                <SignUpContainer direction="column" justifyContent="center">
                    <Card
                        variant="outlined"
                        sx={{
                            maxHeight: '90dvh',
                            overflowY: 'auto',
                        }}
                    >

                        <Typography component="h1" variant="h5">
                            Crear paciente
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <FormControl>
                                <FormLabel>Nombre completo</FormLabel>
                                <TextField
                                    name="nombre"
                                    placeholder="Ej. María Gómez"
                                    value={formValues.nombre}
                                    onChange={handleChange('nombre')}
                                    error={!!formErrors.nombre}
                                    helperText={formErrors.nombre}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Correo electrónico</FormLabel>
                                <TextField
                                    name="email"
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    value={formValues.email}
                                    onChange={handleChange('email')}
                                    error={!!formErrors.email}
                                    helperText={formErrors.email}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Contraseña</FormLabel>
                                <TextField
                                    name="password"
                                    type="password"
                                    placeholder="••••••"
                                    value={formValues.password}
                                    onChange={handleChange('password')}
                                    error={!!formErrors.password}
                                    helperText={formErrors.password}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Género</FormLabel>
                                <TextField
                                    select
                                    name="genero"
                                    value={formValues.genero}
                                    onChange={handleChange('genero')}
                                    error={!!formErrors.genero}
                                    helperText={formErrors.genero}
                                >
                                    <MenuItem value="male">Masculino</MenuItem>
                                    <MenuItem value="female">Femenino</MenuItem>
                                </TextField>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Fecha de nacimiento</FormLabel>
                                <TextField
                                    type="date"
                                    name="fechaNacimiento"
                                    value={formValues.fechaNacimiento}
                                    onChange={handleChange('fechaNacimiento')}
                                    error={!!formErrors.fechaNacimiento}
                                    helperText={formErrors.fechaNacimiento}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Altura (cm)</FormLabel>
                                <TextField
                                    type="number"
                                    name="altura"
                                    value={formValues.altura}
                                    onChange={handleChange('altura')}
                                    error={!!formErrors.altura}
                                    helperText={formErrors.altura}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Peso (kg)</FormLabel>
                                <TextField
                                    type="number"
                                    name="peso"
                                    value={formValues.peso}
                                    onChange={handleChange('peso')}
                                    error={!!formErrors.peso}
                                    helperText={formErrors.peso}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Actividad física</FormLabel>
                                <TextField
                                    select
                                    name="actividad"
                                    value={formValues.actividad}
                                    onChange={handleChange('actividad')}
                                    error={!!formErrors.actividad}
                                    helperText={formErrors.actividad}
                                >
                                    <MenuItem value={1}>Sedentario</MenuItem>
                                    <MenuItem value={2}>Ligero</MenuItem>
                                    <MenuItem value={3}>Moderado</MenuItem>
                                    <MenuItem value={4}>Activo</MenuItem>
                                    <MenuItem value={5}>Muy activo</MenuItem>
                                </TextField>
                            </FormControl>
                            <Button type="submit" variant="contained" fullWidth>
                                Registrar paciente
                            </Button>
                        </Box>
                        <Divider />
                        <Button onClick={onClose} fullWidth>
                            Cancelar
                        </Button>
                    </Card>
                </SignUpContainer>
            </AppTheme>
        </Modal>
    );
}
