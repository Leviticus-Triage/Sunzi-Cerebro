import React, { useState } from 'react';
import {
  Grid,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import SecurityToolCard from './SecurityToolCard';

interface SecurityTool {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  version: string;
}

const SecurityToolsPage: React.FC = () => {
  const [tools, setTools] = useState<SecurityTool[]>([
    {
      id: 'attack-mcp',
      name: 'AttackMCP',
      description: 'Advanced security testing and penetration testing tool',
      status: 'active',
      version: '1.0.0'
    },
    {
      id: 'mcp-god-mode',
      name: 'MCP-God-Mode',
      description: 'System-level security analysis and monitoring',
      status: 'inactive',
      version: '2.1.0'
    },
    // Add more tools...
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [newTool, setNewTool] = useState({
    name: '',
    description: '',
    version: ''
  });

  const handleToggle = (id: string) => {
    setTools(tools.map(tool => 
      tool.id === id
        ? { ...tool, status: tool.status === 'active' ? 'inactive' : 'active' }
        : tool
    ));
  };

  const handleAddTool = () => {
    const tool: SecurityTool = {
      id: newTool.name.toLowerCase().replace(/\s+/g, '-'),
      ...newTool,
      status: 'inactive'
    };
    setTools([...tools, tool]);
    setNewTool({ name: '', description: '', version: '' });
    setOpenDialog(false);
  };

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Security Tools
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add New Tool
        </Button>
      </Box>

      <Grid container spacing={3}>
        {tools.map((tool) => (
          <Grid item key={tool.id} xs={12} sm={6} md={4}>
            <SecurityToolCard tool={tool} onToggle={handleToggle} />
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add New Security Tool</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tool Name"
            fullWidth
            value={newTool.name}
            onChange={(e) =>
              setNewTool({ ...newTool, name: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newTool.description}
            onChange={(e) =>
              setNewTool({ ...newTool, description: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Version"
            fullWidth
            value={newTool.version}
            onChange={(e) =>
              setNewTool({ ...newTool, version: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddTool} variant="contained">
            Add Tool
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SecurityToolsPage;