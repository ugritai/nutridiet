import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from './shared-theme/AppTheme';
import ColorModeSelect from './shared-theme/ColorModeSelect';
import MenuItem from '@mui/material/MenuItem';

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
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function SignUp(props) {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    language: 'English',
  });
  const [errors, setErrors] = React.useState({});

  const validateInputs = () => {
    let newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.password || formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateInputs()) return;

    try {
      const response = await fetch('http://localhost:8000/register_nutritionist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    
      // Log de la respuesta
      const responseData = await response.json();
      console.log(responseData); // Verifica el contenido de la respuesta
    
      if (!response.ok) throw new Error('Failed to register');
      alert('Registration successful!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
      <SignUpContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Sign up
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <FormControl>
              <FormLabel>Full name</FormLabel>
              <TextField name="name" fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={!!errors.name} helperText={errors.name} />
            </FormControl>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <TextField name="email" fullWidth value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} error={!!errors.email} helperText={errors.email} />
            </FormControl>
            <FormControl>
              <FormLabel>Password</FormLabel>
              <TextField name="password" type="password" fullWidth value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} error={!!errors.password} helperText={errors.password} />
            </FormControl>
            <FormControl>
              <FormLabel>Phone</FormLabel>
              <TextField name="phone" fullWidth value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} error={!!errors.phone} helperText={errors.phone} />
            </FormControl>
            <FormControl>
              <FormLabel>Language</FormLabel>
              <TextField select name="language" fullWidth value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })}>
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Spanish">Spanish</MenuItem>
              </TextField>
            </FormControl>
            <FormControlLabel
              control={<Checkbox value="allowExtraEmails" color="primary" />}
              label="I want to receive updates via email."
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              onClick={validateInputs}
            >
              Sign up
            </Button>
          </Box>
          <Divider>
            <Typography sx={{ color: 'text.secondary' }}>or</Typography>
          </Divider>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ textAlign: 'center' }}>
              Already have an account?{' '}
              <Link
                href="/sign-in"
                variant="body2"
                sx={{ alignSelf: 'center' }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </Card>
      </SignUpContainer>
    </AppTheme>
  );
}
