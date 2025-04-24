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
        <>
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
          </div>

          {/* 标题：仅在有图片时显示 */}
          <Typography
            variant="h5"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              fontSize: '1rem',
              textAlign: 'left',
              marginTop: '16px',
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
            minHeight: 80,
          }}
        >
          {/* 图标 */}
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

          {/* 没有图片时的标题 */}
          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              fontSize: '1rem',
              textAlign: 'left',
              marginTop: '48px',
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
