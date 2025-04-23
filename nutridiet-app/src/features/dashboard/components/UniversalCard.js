import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Link } from 'react-router-dom';

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

  return (
    <Card
      sx={{
        height: 'auto', // 高度自适应
        width: '100%',  // 保证宽度相同
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: theme.shadows[3],
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'transform 0.3s',
        '&:hover': { transform: 'scale(1.02)' }
      }}
    >
      {image ? (
        <div style={{ position: 'relative', height: 160 }}>
          <CardMedia
            component="img"
            image={image}
            alt={title}
            sx={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
            }}
          />
          <Typography
            variant="h6"
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 12,
              color: '#fff',
              fontWeight: 700,
              textShadow: '1px 1px 3px rgba(0,0,0,0.6)',
            }}
          >
            {title}
          </Typography>
        </div>
      ) : (
        <CardContent sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', pt: 2, minHeight: 80 }}>
          {/* Icon at the top left */}
          <div style={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40, // 图标宽度
            height: 40, // 图标高度
          }}>
            {icon}
          </div>

          {/* Title below the icon */}
          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              fontSize: '1rem', // 调整字体大小
              textAlign: 'left', // 确保title左对齐
              marginTop: '48px', // 为了避免 title 距离图标太近
            }}
          >
            {title}
          </Typography>
        </CardContent>
      )}

      <CardContent sx={{ pt: image ? 1 : 0 }}>
        <Typography
          sx={{
            color: 'text.secondary',
            mb: 2,
            minHeight: '3em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </Typography>
        <Button
          component={buttonLink ? Link : 'button'}
          to={buttonLink}
          variant="contained"
          size="small"
          color={buttonColor}
          endIcon={<ChevronRightRoundedIcon />}
          fullWidth={isSmallScreen}
          onClick={!buttonLink ? onAction : undefined}
          sx={{ fontWeight: 500 }}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>


  );
};

export default UniversalCard;
