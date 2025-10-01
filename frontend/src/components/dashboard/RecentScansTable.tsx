import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Card,
  CardContent
} from '@mui/material';

interface SecurityScanResult {
  id: string;
  tool: string;
  timestamp: string;
  status: string;
  findings: number;
}

interface RecentScansTableProps {
  scans: SecurityScanResult[];
}

const RecentScansTable: React.FC<RecentScansTableProps> = ({ scans }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Security Scans
        </Typography>
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Tool</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Findings</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scans.map((scan) => (
                <TableRow
                  key={scan.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {scan.id}
                  </TableCell>
                  <TableCell>{scan.tool}</TableCell>
                  <TableCell>{scan.timestamp}</TableCell>
                  <TableCell>{scan.status}</TableCell>
                  <TableCell align="right">{scan.findings}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default RecentScansTable;