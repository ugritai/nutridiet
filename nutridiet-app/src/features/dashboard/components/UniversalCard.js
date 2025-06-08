import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import defaultImage from '../../../assets/logo_192.png';

const UniversalCard = ({
  title,
  description,
  icon,
  image,
  buttonText = 'Más detalles',
  buttonColor = 'primary',
  onAction,
  buttonLink
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Determinar si es una tarjeta simple (solo título y botón)
  const isSimpleCard = !image && !description && !icon;

  const [imgSrc, setImgSrc] = useState(image && image.trim() !== '' ? image : defaultImage);
  const isDefaultImage = imgSrc === defaultImage;

  return (
    <Card
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: theme.shadows[3],
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'transform 0.3s',
        '&:hover': { transform: 'scale(1.02)' },
        minHeight: isSimpleCard ? 180 : (image ? 300 : 240),
      }}
    >
      {image && image.trim() !== '' ? (
        <>
          <div style={{ position: 'relative', height: 160 }}>
            <CardMedia
              component="img"
              image={imgSrc}
              alt={title}
              sx={{
                height: 160,
                width: '100%',
                objectFit: isDefaultImage ? 'contain' : 'cover',
                objectPosition: 'center',
                backgroundColor: '#f5f5f5',
                p: isDefaultImage ? 2 : 0,
              }}
              onError={(e) => {
                setImgSrc(defaultImage); // cambia dinámicamente si la imagen falla
              }}
            />
          </div>

          <Typography
            variant="h5"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              fontSize: '1rem',
              textAlign: 'left',
              mx: 2,
              mt: 1.5,
              mb: description ? 0 : 1,
            }}
          >
            {title}
          </Typography>

        </>
      ) : (
        <CardContent
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            pt: 2,
            pb: 0,
          }}
        >
          {icon && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
              }}
            >
              {icon}
            </div>
          )}

          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              fontSize: '1rem',
              textAlign: 'left',
              mt: icon ? 6 : 2,
              mb: description ? 0 : 1,
            }}
          >
            {title}
          </Typography>
        </CardContent>
      )}

      <CardContent sx={{ pt: description ? 1 : 0, pb: 2 }}>
        {description && (
          <Typography
            sx={{
              color: 'text.secondary',
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </Typography>
        )}

        <Button
          component={buttonLink ? Link : 'button'}
          to={buttonLink}
          variant="contained"
          size="small"
          color={buttonColor}
          endIcon={<ChevronRightRoundedIcon />}
          fullWidth={isSmallScreen}
          onClick={!buttonLink ? onAction : undefined}
          sx={{
            fontWeight: 500,
            mt: !description && !image ? 1 : 0
          }}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UniversalCard;