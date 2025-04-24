// Search.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { 
  Stack, 
  FormControl, 
  OutlinedInput, 
  InputAdornment, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  Paper,
  styled
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

const SearchContainer = styled(Stack)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: theme.spacing(1)
  }
}));

const SuggestionsPaper = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 2,
  marginTop: theme.spacing(0.5),
  maxHeight: 200,
  overflow: 'auto',
  boxShadow: theme.shadows[3],
}));

const Search = ({
  value,
  onChange,
  onSubmit,
  suggestions = [],
  placeholder = 'Buscar...',
  buttonText = 'Buscar',
  showButton = true,
  suggestionRenderer,
  sx
}) => {
  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(value);
  };

  return (
    <SearchContainer 
      direction="row" 
      spacing={2}
      component="form"
      onSubmit={handleFormSubmit}
      sx={sx}
    >
      <FormControl sx={{ flexGrow: 1 }}>
        <OutlinedInput
          size="small"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          startAdornment={
            <InputAdornment position="start">
              <SearchRoundedIcon fontSize="small" />
            </InputAdornment>
          }
        />
        {suggestions.length > 0 && (
          <SuggestionsPaper>
            <List dense>
              {suggestions.map((item, index) => (
                <ListItem
                  button
                  key={index}
                  onClick={() => {
                    onChange(typeof item === 'string' ? item : item.label);
                    onSubmit(typeof item === 'string' ? item : item.label);
                  }}
                >
                  {suggestionRenderer ? (
                    suggestionRenderer(item)
                  ) : (
                    <ListItemText primary={typeof item === 'string' ? item : item.label} />
                  )}
                </ListItem>
              ))}
            </List>
          </SuggestionsPaper>
        )}
      </FormControl>
      
      {showButton && (
        <Button
          variant="contained"
          type="submit"
          sx={{ 
            height: 40,
            minWidth: 100,
            flexShrink: 0 
          }}
        >
          {buttonText}
        </Button>
      )}
    </SearchContainer>
  );
};

Search.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  suggestions: PropTypes.array,
  placeholder: PropTypes.string,
  buttonText: PropTypes.string,
  showButton: PropTypes.bool,
  suggestionRenderer: PropTypes.func,
  sx: PropTypes.object
};

export default Search;