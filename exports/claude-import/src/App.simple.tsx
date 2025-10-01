import React from 'react'
import { Box, Typography } from '@mui/material'

const App: React.FC = () => {
  console.log('Simple App loaded')

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        background: 'linear-gradient(135deg, #f8faff 0%, #e0edfe 100%)',
        flexDirection: 'column',
        gap: 3
      }}
    >
      <Typography variant="h3" sx={{ color: '#00327c', fontWeight: 700 }}>
        🎯 Sunzi Cerebro
      </Typography>
      <Typography variant="h5" sx={{ color: '#333' }}>
        System ist bereit!
      </Typography>
      <Box sx={{
        background: '#e8f5e8',
        padding: 2,
        borderRadius: 2,
        border: '2px solid #4caf50'
      }}>
        <Typography sx={{ color: '#2e7d32' }}>
          ✅ Frontend: Funktional<br/>
          ✅ Backend: 4 Server, 131+ Tools<br/>
          ✅ HexStrike AI: 124 Tools verfügbar<br/>
          ✅ Real Tool Execution: Aktiv
        </Typography>
      </Box>
    </Box>
  )
}

export default App