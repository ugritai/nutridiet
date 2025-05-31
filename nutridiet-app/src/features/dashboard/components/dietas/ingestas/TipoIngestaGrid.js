// ✅ TipoIngestaGrid.jsx
import React from 'react';
import { Box, Typography, Card, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Droppable, Draggable } from '@hello-pangea/dnd';

export default function TipoIngestaGrid({ estructura, recetasPorTipo, setRecetasPorTipo }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Object.entries(estructura).map(([ingesta, subtipos]) => (
        <Box key={ingesta}>
          <Typography variant="h5" sx={{ mb: 2 }}>{ingesta}</Typography>
          <Box sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(5, 1fr)',
            },
          }}>
            {subtipos.map((subtipo) => {
              const id = `${ingesta}::${subtipo}`;
              return (
                <Droppable key={id} droppableId={id}>
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        p: 2,
                        border: '1px solid #ccc',
                        borderRadius: 2,
                        minHeight: 200,
                        backgroundColor: '#fafafa',
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        {subtipo.replace('_', ' ').toUpperCase()}
                      </Typography>

                      {(recetasPorTipo[id] || []).map((receta, i) => (
                        <Draggable
                          key={`${receta.nombre}::${id}`}
                          draggableId={`${receta.nombre}::${id}`}
                          index={i}
                        >
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{ p: 1, mb: 1 }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Box>
                                  <Typography>{receta.nombre}</Typography>
                                  <Typography variant="body2">
                                    Kcal: {receta.kcal} | Pro: {receta.pro} | Carbs: {receta.car}
                                  </Typography>
                                </Box>
                                <IconButton
                                  onClick={() => setRecetasPorTipo(prev => ({
                                    ...prev,
                                    [id]: prev[id].filter(r => r.nombre !== receta.nombre),
                                  }))}
                                >
                                  <CloseIcon />
                                </IconButton>
                              </Box>
                            </Card>
                          )}
                        </Draggable>
                      ))}

                      {/* ✅ MUY IMPORTANTE */}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
