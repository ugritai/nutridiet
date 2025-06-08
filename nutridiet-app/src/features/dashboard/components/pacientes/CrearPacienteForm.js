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
import { fetchWithAuth } from '../api';

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

export default function CrearPacienteForm({ open, onClose, onPacienteCreado, pacienteInicial }) {
    const isEdit = Boolean(pacienteInicial);

    const [formValues, setFormValues] = React.useState({
        name: '',
        email: '',
        password: '',
        gender: '',
        bornDate: '',
        height: '',
        weight: '',
        activityLevel: '',
    });

    React.useEffect(() => {
        if (pacienteInicial) {
            setFormValues({
                ...pacienteInicial,
                password: '', // no mostrar contraseña actual
            });
        }
    }, [pacienteInicial]);

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
        if (!formValues.name) errors.name = 'El nombre es obligatorio.';
        if (!formValues.email || !/\S+@\S+\.\S+/.test(formValues.email))
            errors.email = 'Ingrese un correo válido.';
        if (!isEdit && (!formValues.password || formValues.password.length < 6))
            errors.password = 'La contraseña debe tener al menos 6 caracteres.';
        if (!formValues.gender) errors.gender = 'Seleccione un género.';
        if (!formValues.bornDate) errors.bornDate = 'Seleccione la fecha de nacimiento.';
        if (!formValues.height || formValues.height <= 0)
            errors.height = 'Ingrese una altura válida.';
        if (!formValues.weight || formValues.weight <= 0)
            errors.weight = 'Ingrese un peso válido.';
        if (!formValues.activityLevel) errors.activityLevel = 'Seleccione un nivel de actividad.';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            const url = isEdit
                ? `/pacientes/actualizar_paciente/${pacienteInicial.id}`
                : '/pacientes/crear_paciente/';

            const method = isEdit ? 'PUT' : 'POST';

            const { id, tmb, restrictionsKcal, dailyProIntake, dailyCalIntake, ...rest } = formValues;

            const payload = {
                ...rest,
                height: Number(formValues.height),
                weight: Number(formValues.weight),
                activityLevel: Number(formValues.activityLevel),
                bornDate: formValues.bornDate,
            };

            if (isEdit && !formValues.password) delete payload.password;

            const response = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const paciente = await response.json();
                onPacienteCreado?.(paciente);
                onClose();

                alert(isEdit ? 'Datos de paciente actualizado' : 'Peciente creado con exito!');

                window.location.reload();
            }
            else {
                const error = await response.json();
                alert(error.detail || 'Error al guardar paciente');
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
                    <Card variant="outlined" sx={{ maxHeight: '90dvh', overflowY: 'auto' }}>
                        <Typography component="h1" variant="h5">
                            {isEdit ? 'Editar paciente' : 'Crear paciente'}
                        </Typography>

                        <Box
                            component="form"
                            onSubmit={handleSubmit}
                            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                        >
                            <FormControl>
                                <FormLabel>Nombre completo</FormLabel>
                                <TextField
                                    name="name"
                                    placeholder="Ej. María Gómez"
                                    value={formValues.name}
                                    onChange={handleChange('name')}
                                    error={!!formErrors.name}
                                    helperText={formErrors.name}
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
                            {!isEdit && (
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
                            )}
                            <FormControl>
                                <FormLabel>Género</FormLabel>
                                <TextField
                                    select
                                    name="gender"
                                    value={formValues.gender}
                                    onChange={handleChange('gender')}
                                    error={!!formErrors.gender}
                                    helperText={formErrors.gender}
                                >
                                    <MenuItem value="male">Masculino</MenuItem>
                                    <MenuItem value="female">Femenino</MenuItem>
                                </TextField>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Fecha de nacimiento</FormLabel>
                                <TextField
                                    type="date"
                                    name="bornDate"
                                    value={formValues.bornDate}
                                    onChange={handleChange('bornDate')}
                                    error={!!formErrors.bornDate}
                                    helperText={formErrors.bornDate}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Altura (cm)</FormLabel>
                                <TextField
                                    type="number"
                                    name="height"
                                    value={formValues.height}
                                    onChange={handleChange('height')}
                                    error={!!formErrors.height}
                                    helperText={formErrors.height}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Peso (kg)</FormLabel>
                                <TextField
                                    type="number"
                                    name="weight"
                                    value={formValues.weight}
                                    onChange={handleChange('weight')}
                                    error={!!formErrors.weight}
                                    helperText={formErrors.weight}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Actividad física</FormLabel>
                                <TextField
                                    select
                                    name="activityLevel"
                                    value={formValues.activityLevel}
                                    onChange={handleChange('activityLevel')}
                                    error={!!formErrors.activityLevel}
                                    helperText={formErrors.activityLevel}
                                >
                                    <MenuItem value={1}>Sedentario</MenuItem>
                                    <MenuItem value={2}>Ligero</MenuItem>
                                    <MenuItem value={3}>Moderado</MenuItem>
                                    <MenuItem value={4}>Activo</MenuItem>
                                    <MenuItem value={5}>Muy activo</MenuItem>
                                </TextField>
                            </FormControl>
                            <Button type="submit" variant="contained" fullWidth>
                                {isEdit ? 'Guardar cambios' : 'Registrar paciente'}
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
