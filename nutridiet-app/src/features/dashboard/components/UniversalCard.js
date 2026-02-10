import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { Link } from 'react-router-dom';
import defaultImage from '../../../assets/logo_192.png';


const UniversalCard = ({
  title,
  description,
  image,
  buttonText = 'Más detalles',
  onAction,
  buttonLink,
  sx = {} 
}) => {
  const [imgSrc, setImgSrc] = useState(image && image.trim() !== '' ? image : defaultImage);
  const isDefaultImage = imgSrc === defaultImage;

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%', // Asegura que no se pase del ancho del Grid
        height: '100%', // Para que todas midan lo mismo
        boxShadow: 3,
        borderRadius: 4,
        overflow: 'hidden',
        transition: 'transform 0.3s',
        '&:hover': { transform: 'scale(1.02)' },
        ...sx, 
      }}
    >
      {/* IMAGEN: Altura fija */}
      <Box sx={{ width: '100%', height: 160, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CardMedia
          component="img"
          image={imgSrc}
          sx={{
            height: isDefaultImage ? '100px' : '100%',
            width: isDefaultImage ? 'auto' : '100%',
            objectFit: isDefaultImage ? 'contain' : 'cover',
          }}
          onError={() => setImgSrc(defaultImage)}
        />
      </Box>

      {/* CONTENIDO: Título multilínea ajustable */}
      <CardContent sx={{ flexGrow: 1, p: 2, pb: 1 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            fontSize: '0.9rem',
            lineHeight: '1.2rem',
            textAlign: 'center',
            // Altura fija para 3 líneas: si es más largo sale "...", si es más corto queda el hueco
            height: '3.6rem', 
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 1
          }}
        >
          {title}
        </Typography>

        {description && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </Typography>
        )}
      </CardContent>

      {/* BOTÓN: Siempre al final */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Button
          component={buttonLink ? Link : 'button'}
          to={buttonLink}
          variant="contained"
          fullWidth
          onClick={!buttonLink ? onAction : undefined}
          sx={{ fontWeight: 700, textTransform: 'none' }}
          endIcon={<ChevronRightRoundedIcon />}
        >
          {buttonText}
        </Button>
      </Box>
    </Card>
  );
};

export default UniversalCard;
