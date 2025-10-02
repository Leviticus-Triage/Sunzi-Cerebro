import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Tooltip,
  Divider,
  LinearProgress,
} from '@mui/material'
import {
  Assessment as AssessmentIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Schedule as ScheduleIcon,
  PictureAsPdf as PdfIcon,
  Description as HtmlIcon,
  TableChart as CsvIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  BugReport as VulnIcon,
  CheckCircle as ComplianceIcon,
} from '@mui/icons-material'

interface SecurityReport {
  id: string
  title: string
  type: 'vulnerability' | 'compliance' | 'penetration-test' | 'network-assessment' | 'executive-summary'
  status: 'draft' | 'generating' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
  author: string
  scanId?: string
  findings: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
  }
  size: string
  format: 'pdf' | 'html' | 'csv'
  description: string
  progress?: number
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [reports, setReports] = useState<SecurityReport[]>([])
  const [newReportDialog, setNewReportDialog] = useState(false)
  const [viewReportDialog, setViewReportDialog] = useState<{ open: boolean, report?: SecurityReport }>({ open: false })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as const })
  const [newReport, setNewReport] = useState({
    title: '',
    type: 'vulnerability' as SecurityReport['type'],
    format: 'pdf' as SecurityReport['format'],
    description: '',
    scanId: ''
  })

  // Generate realistic mock report data
  useEffect(() => {
    const mockReports: SecurityReport[] = [
      {
        id: 'report-1',
        title: 'Quarterly Vulnerability Assessment Q4 2024',
        type: 'vulnerability',
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000).toLocaleDateString(),
        updatedAt: new Date(Date.now() - 86400000).toLocaleDateString(),
        author: 'Security Team',
        scanId: 'scan-1',
        findings: { total: 23, critical: 3, high: 7, medium: 10, low: 3 },
        size: '2.3 MB',
        format: 'pdf',
        description: 'Comprehensive vulnerability assessment covering network infrastructure and web applications.'
      },
      {
        id: 'report-2',
        title: 'PCI DSS Compliance Report 2024',
        type: 'compliance',
        status: 'completed',
        createdAt: new Date(Date.now() - 172800000).toLocaleDateString(),
        updatedAt: new Date(Date.now() - 172800000).toLocaleDateString(),
        author: 'Compliance Officer',
        findings: { total: 5, critical: 0, high: 1, medium: 3, low: 1 },
        size: '1.8 MB',
        format: 'pdf',
        description: 'Annual PCI DSS compliance assessment and remediation recommendations.'
      },
      {
        id: 'report-3',
        title: 'Penetration Test - Web Applications',
        type: 'penetration-test',
        status: 'generating',
        createdAt: new Date().toLocaleDateString(),
        updatedAt: new Date().toLocaleDateString(),
        author: 'Red Team',
        scanId: 'scan-2',
        findings: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
        size: 'Generating...',
        format: 'html',
        description: 'Comprehensive penetration testing of customer-facing web applications.',
        progress: 73
      },
      {
        id: 'report-4',
        title: 'Network Security Assessment',
        type: 'network-assessment',
        status: 'draft',
        createdAt: new Date().toLocaleDateString(),
        updatedAt: new Date().toLocaleDateString(),
        author: 'Network Security Team',
        findings: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
        size: '0 KB',
        format: 'pdf',
        description: 'Assessment of network infrastructure security controls and configurations.'
      },
      {
        id: 'report-5',
        title: 'Executive Security Summary - January 2025',
        type: 'executive-summary',
        status: 'completed',
        createdAt: new Date(Date.now() - 259200000).toLocaleDateString(),
        updatedAt: new Date(Date.now() - 259200000).toLocaleDateString(),
        author: 'CISO Office',
        findings: { total: 45, critical: 5, high: 12, medium: 20, low: 8 },
        size: '890 KB',
        format: 'pdf',
        description: 'High-level security posture summary for executive leadership.'
      }
    ]

    setReports(mockReports)
  }, [])

  const getReportTypeColor = (type: SecurityReport['type']) => {
    switch (type) {
      case 'vulnerability':
        return 'error'
      case 'compliance':
        return 'success'
      case 'penetration-test':
        return 'warning'
      case 'network-assessment':
        return 'info'
      case 'executive-summary':
        return 'primary'
      default:
        return 'default'
    }
  }

  const getReportTypeIcon = (type: SecurityReport['type']) => {
    switch (type) {
      case 'vulnerability':
        return <VulnIcon />
      case 'compliance':
        return <ComplianceIcon />
      case 'penetration-test':
        return <SecurityIcon />
      case 'network-assessment':
        return <TrendingUpIcon />
      case 'executive-summary':
        return <AssessmentIcon />
      default:
        return <AssessmentIcon />
    }
  }

  const getStatusColor = (status: SecurityReport['status']) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'generating':
        return 'primary'
      case 'draft':
        return 'info'
      case 'failed':
        return 'error'
      default:
        return 'default'
    }
  }

  const getFormatIcon = (format: SecurityReport['format']) => {
    switch (format) {
      case 'pdf':
        return <PdfIcon />
      case 'html':
        return <HtmlIcon />
      case 'csv':
        return <CsvIcon />
      default:
        return <AssessmentIcon />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#fb5454'
      case 'high':
        return '#ff9b26'
      case 'medium':
        return '#2a76d1'
      case 'low':
        return '#00ca82'
      default:
        return '#99adcb'
    }
  }

  const getFilteredReports = () => {
    switch (activeTab) {
      case 0: // All Reports
        return reports
      case 1: // Recent
        return reports.filter(r => new Date(r.updatedAt) > new Date(Date.now() - 7 * 86400000))
      case 2: // Generating
        return reports.filter(r => r.status === 'generating')
      case 3: // Completed
        return reports.filter(r => r.status === 'completed')
      case 4: // Draft
        return reports.filter(r => r.status === 'draft')
      default:
        return reports
    }
  }

  const handleCreateReport = () => {
    if (!newReport.title) {
      setSnackbar({ open: true, message: 'Please enter a report title', severity: 'error' })
      return
    }

    const report: SecurityReport = {
      id: `report-${Date.now()}`,
      title: newReport.title,
      type: newReport.type,
      status: 'generating',
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      author: 'Current User',
      scanId: newReport.scanId || undefined,
      findings: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
      size: 'Generating...',
      format: newReport.format,
      description: newReport.description,
      progress: 0
    }

    setReports(prev => [report, ...prev])
    setNewReportDialog(false)
    setNewReport({ title: '', type: 'vulnerability', format: 'pdf', description: '', scanId: '' })
    setSnackbar({ open: true, message: 'Report generation started', severity: 'success' })

    // Simulate report generation progress
    const progressInterval = setInterval(() => {
      setReports(prev => prev.map(r =>
        r.id === report.id
          ? { ...r, progress: Math.min(100, (r.progress || 0) + Math.random() * 20) }
          : r
      ))
    }, 2000)

    // Complete after 15 seconds
    setTimeout(() => {
      clearInterval(progressInterval)
      setReports(prev => prev.map(r =>
        r.id === report.id
          ? { ...r, status: 'completed' as const, progress: undefined, size: '1.5 MB' }
          : r
      ))
      setSnackbar({ open: true, message: 'Report generation completed', severity: 'success' })
    }, 15000)
  }

  const handleReportAction = (reportId: string, action: 'download' | 'share' | 'delete' | 'view') => {
    const report = reports.find(r => r.id === reportId)
    if (!report) return

    switch (action) {
      case 'download':
        setSnackbar({ open: true, message: `Downloading ${report.title}`, severity: 'success' })
        break
      case 'share':
        setSnackbar({ open: true, message: `Sharing options for ${report.title}`, severity: 'info' })
        break
      case 'delete':
        setReports(prev => prev.filter(r => r.id !== reportId))
        setSnackbar({ open: true, message: 'Report deleted successfully', severity: 'success' })
        break
      case 'view':
        setViewReportDialog({ open: true, report })
        break
    }
  }

  const getOverallStats = () => {
    return {
      total: reports.length,
      completed: reports.filter(r => r.status === 'completed').length,
      generating: reports.filter(r => r.status === 'generating').length,
      draft: reports.filter(r => r.status === 'draft').length,
      totalFindings: reports.reduce((sum, report) => sum + report.findings.total, 0)
    }
  }

  const stats = getOverallStats()
  const filteredReports = getFilteredReports()

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Security Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Erstellen, verwalten und exportieren Sie detaillierte Security-Reports.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => setSnackbar({ open: true, message: 'Reports refreshed', severity: 'success' })}
          >
            Aktualisieren
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewReportDialog(true)}
          >
            Neuer Report
          </Button>
        </Stack>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600 }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Reports
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                {stats.completed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                {stats.generating}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generating
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                {stats.draft}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Draft
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main" sx={{ fontWeight: 600 }}>
                {stats.totalFindings}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Findings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label={`All (${reports.length})`} />
          <Tab label={`Recent (${reports.filter(r => new Date(r.updatedAt) > new Date(Date.now() - 7 * 86400000)).length})`} />
          <Tab label={`Generating (${reports.filter(r => r.status === 'generating').length})`} />
          <Tab label={`Completed (${reports.filter(r => r.status === 'completed').length})`} />
          <Tab label={`Draft (${reports.filter(r => r.status === 'draft').length})`} />
        </Tabs>

        {/* Tab Content */}
        <TabPanel value={activeTab} index={activeTab}>
          <Box sx={{ px: 3, pb: 3 }}>
            {filteredReports.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <AssessmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Keine Reports in dieser Kategorie
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeTab === 0 && "Erstellen Sie Ihren ersten Security-Report."}
                  {activeTab === 1 && "Keine Reports in den letzten 7 Tagen erstellt."}
                  {activeTab === 2 && "Keine Reports werden derzeit generiert."}
                  {activeTab === 3 && "Keine abgeschlossenen Reports vorhanden."}
                  {activeTab === 4 && "Keine Entwürfe vorhanden."}
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {filteredReports.map((report) => (
                  <Grid item xs={12} lg={6} key={report.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Avatar sx={{ bgcolor: `${getReportTypeColor(report.type)}.main`, width: 32, height: 32 }}>
                                {getReportTypeIcon(report.type)}
                              </Avatar>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {report.title}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                              <Chip
                                label={report.type.replace('-', ' ').toUpperCase()}
                                color={getReportTypeColor(report.type)}
                                size="small"
                              />
                              <Chip
                                label={report.status.toUpperCase()}
                                color={getStatusColor(report.status)}
                                size="small"
                              />
                              <Chip
                                icon={getFormatIcon(report.format)}
                                label={report.format.toUpperCase()}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            {report.status === 'completed' && (
                              <Tooltip title="Download Report">
                                <IconButton size="small" onClick={() => handleReportAction(report.id, 'download')}>
                                  <DownloadIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => handleReportAction(report.id, 'view')}>
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            {report.status === 'completed' && (
                              <Tooltip title="Share Report">
                                <IconButton size="small" onClick={() => handleReportAction(report.id, 'share')}>
                                  <ShareIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete Report">
                              <IconButton size="small" color="error" onClick={() => handleReportAction(report.id, 'delete')}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {report.description}
                        </Typography>

                        {report.status === 'generating' && report.progress !== undefined && (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Generation Progress</Typography>
                              <Typography variant="body2">{Math.round(report.progress)}%</Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={report.progress}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        )}

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Author:</Typography>
                            <Typography variant="body2">{report.author}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Size:</Typography>
                            <Typography variant="body2">{report.size}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Created:</Typography>
                            <Typography variant="body2">{report.createdAt}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Updated:</Typography>
                            <Typography variant="body2">{report.updatedAt}</Typography>
                          </Grid>
                        </Grid>

                        {report.findings.total > 0 && (
                          <>
                            <Divider sx={{ mb: 2 }} />
                            <Box>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                Security Findings: {report.findings.total} total
                              </Typography>
                              <Stack direction="row" spacing={1}>
                                {report.findings.critical > 0 && (
                                  <Chip
                                    label={`${report.findings.critical} Critical`}
                                    size="small"
                                    sx={{ bgcolor: getSeverityColor('critical'), color: 'white' }}
                                  />
                                )}
                                {report.findings.high > 0 && (
                                  <Chip
                                    label={`${report.findings.high} High`}
                                    size="small"
                                    sx={{ bgcolor: getSeverityColor('high'), color: 'white' }}
                                  />
                                )}
                                {report.findings.medium > 0 && (
                                  <Chip
                                    label={`${report.findings.medium} Medium`}
                                    size="small"
                                    sx={{ bgcolor: getSeverityColor('medium'), color: 'white' }}
                                  />
                                )}
                                {report.findings.low > 0 && (
                                  <Chip
                                    label={`${report.findings.low} Low`}
                                    size="small"
                                    sx={{ bgcolor: getSeverityColor('low'), color: 'white' }}
                                  />
                                )}
                              </Stack>
                            </Box>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </TabPanel>
      </Paper>

      {/* New Report Dialog */}
      <Dialog
        open={newReportDialog}
        onClose={() => setNewReportDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Neuen Security-Report erstellen</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Report Title"
              value={newReport.title}
              onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
              placeholder="z.B. Quarterly Security Assessment Q1 2025"
              required
            />

            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={newReport.type}
                onChange={(e) => setNewReport({ ...newReport, type: e.target.value as SecurityReport['type'] })}
              >
                <MenuItem value="vulnerability">Vulnerability Assessment</MenuItem>
                <MenuItem value="compliance">Compliance Report</MenuItem>
                <MenuItem value="penetration-test">Penetration Test</MenuItem>
                <MenuItem value="network-assessment">Network Assessment</MenuItem>
                <MenuItem value="executive-summary">Executive Summary</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Output Format</InputLabel>
              <Select
                value={newReport.format}
                onChange={(e) => setNewReport({ ...newReport, format: e.target.value as SecurityReport['format'] })}
              >
                <MenuItem value="pdf">PDF Document</MenuItem>
                <MenuItem value="html">HTML Report</MenuItem>
                <MenuItem value="csv">CSV Data Export</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={newReport.description}
              onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
              placeholder="Brief description of the report scope and objectives..."
            />

            <TextField
              fullWidth
              label="Source Scan ID (Optional)"
              value={newReport.scanId}
              onChange={(e) => setNewReport({ ...newReport, scanId: e.target.value })}
              placeholder="scan-123 (if based on specific scan)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewReportDialog(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleCreateReport}>
            Report erstellen
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Report Details Dialog */}
      <Dialog
        open={viewReportDialog.open}
        onClose={() => setViewReportDialog({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Report Details: {viewReportDialog.report?.title}
        </DialogTitle>
        <DialogContent>
          {viewReportDialog.report && (
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Type:</Typography>
                  <Typography variant="body1">{viewReportDialog.report.type.replace('-', ' ')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  <Typography variant="body1">{viewReportDialog.report.status}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Format:</Typography>
                  <Typography variant="body1">{viewReportDialog.report.format.toUpperCase()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Size:</Typography>
                  <Typography variant="body1">{viewReportDialog.report.size}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Author:</Typography>
                  <Typography variant="body1">{viewReportDialog.report.author}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Scan ID:</Typography>
                  <Typography variant="body1">{viewReportDialog.report.scanId || 'N/A'}</Typography>
                </Grid>
              </Grid>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>Description</Typography>
                <Typography variant="body2">{viewReportDialog.report.description}</Typography>
              </Box>

              {viewReportDialog.report.findings.total > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Security Findings Summary</Typography>
                  <Grid container spacing={2}>
                    {Object.entries(viewReportDialog.report.findings).map(([severity, count]) => (
                      severity !== 'total' && count > 0 && (
                        <Grid item xs={3} key={severity}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: getSeverityColor(severity), color: 'white' }}>
                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                              {count}
                            </Typography>
                            <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                              {severity}
                            </Typography>
                          </Paper>
                        </Grid>
                      )
                    ))}
                  </Grid>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewReportDialog({ open: false })}>Schließen</Button>
          {viewReportDialog.report?.status === 'completed' && (
            <Button variant="contained" startIcon={<DownloadIcon />}>
              Report herunterladen
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Reports